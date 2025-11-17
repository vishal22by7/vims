const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const Claim = require('../models/Claim');
const ClaimPhoto = require('../models/ClaimPhoto');
const Policy = require('../models/Policy');
const BlockchainRecord = require('../models/BlockchainRecord');
const IPFSFile = require('../models/IPFSFile');
const { auth } = require('../middleware/auth');
const blockchainService = require('../services/blockchain');
const ipfsService = require('../services/ipfs');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG and PNG images are allowed'));
    }
  }
});

// Get all claims (user's own claims)
router.get('/', auth, async (req, res) => {
  try {
    const claims = await Claim.find({ userId: req.user._id })
      .populate('policyId', 'policyTypeId vehicleType vehicleBrand vehicleModel')
      .populate('policyId.policyTypeId', 'name')
      .sort({ submittedAt: -1 });

    // Get photos for each claim
    const claimsWithPhotos = await Promise.all(
      claims.map(async (claim) => {
        const photos = await ClaimPhoto.find({ claimId: claim._id });
        return {
          ...claim.toObject(),
          photos
        };
      })
    );

    res.json({
      success: true,
      claims: claimsWithPhotos
    });
  } catch (error) {
    console.error('Get claims error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single claim
router.get('/:id', auth, async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate('policyId')
      .populate('userId', 'name email');

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    // Check if user owns this claim or is admin
    if (claim.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const photos = await ClaimPhoto.find({ claimId: claim._id });

    res.json({
      success: true,
      claim: {
        ...claim.toObject(),
        photos
      }
    });
  } catch (error) {
    console.error('Get claim error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Submit claim with photos
router.post('/submit', auth, upload.array('photos', 5), [
  body('policyId').notEmpty().withMessage('Policy ID is required'),
  body('description').notEmpty().withMessage('Description is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { policyId, description } = req.body;

    // Verify policy exists and belongs to user
    const policy = await Policy.findById(policyId);
    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }

    if (policy.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Policy does not belong to you' });
    }

    // Create claim
    const claim = new Claim({
      policyId,
      userId: req.user._id,
      description,
      status: 'Submitted'
    });

    await claim.save();

    // Upload photos to IPFS
    const photos = [];
    const ipfsCids = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          // Check if IPFS is available before attempting upload
          if (ipfsService.isAvailable && ipfsService.isAvailable()) {
            const { cid, url } = await ipfsService.uploadFile(file.path, file.originalname);

            const claimPhoto = new ClaimPhoto({
              claimId: claim._id,
              ipfsCid: cid,
              url,
              blockchainIncluded: false
            });

            await claimPhoto.save();
            photos.push(claimPhoto);
            ipfsCids.push(cid);

            // Record IPFS file
            const ipfsFile = new IPFSFile({
              ipfsCid: cid,
              fileType: 'claim-photo',
              uploadedBy: req.user._id
            });
            await ipfsFile.save().catch(() => {}); // Ignore duplicate errors
          } else {
            // IPFS not available, save photo info without IPFS
            console.warn('⚠️  IPFS not available, saving photo without IPFS CID');
            const claimPhoto = new ClaimPhoto({
              claimId: claim._id,
              ipfsCid: 'local-only',
              url: `/uploads/${file.filename}`,
              blockchainIncluded: false
            });
            await claimPhoto.save();
            photos.push(claimPhoto);
          }

          // Clean up temp file
          fs.unlinkSync(file.path);
        } catch (ipfsError) {
          console.error('IPFS upload error:', ipfsError);
          // Continue even if IPFS fails - save photo info anyway
          try {
            const claimPhoto = new ClaimPhoto({
              claimId: claim._id,
              ipfsCid: 'upload-failed',
              url: `/uploads/${file.filename}`,
              blockchainIncluded: false
            });
            await claimPhoto.save();
            photos.push(claimPhoto);
          } catch (saveError) {
            console.error('Failed to save photo record:', saveError);
          }
        }
      }
    }

    // Write to blockchain
    let blockchainResult = null;
    if (blockchainService.isAvailable()) {
      try {
        blockchainResult = await blockchainService.submitClaim(
          claim._id.toString(),
          policyId,
          req.user._id.toString(),
          description,
          ipfsCids
        );

        claim.claimIdOnChain = claim._id.toString();
        claim.blockchainTxHash = blockchainResult.txHash;
        await claim.save();

        // Update photos to mark as blockchain included
        await ClaimPhoto.updateMany(
          { claimId: claim._id },
          { blockchainIncluded: true }
        );

        // Create blockchain record
        const blockchainRecord = new BlockchainRecord({
          entityType: 'Claim',
          entityId: claim._id,
          txHash: blockchainResult.txHash,
          blockNumber: blockchainResult.blockNumber,
          eventName: 'ClaimSubmitted',
          timestamp: blockchainResult.timestamp
        });
        await blockchainRecord.save();
      } catch (blockchainError) {
        console.error('Blockchain write error (non-fatal):', blockchainError);
        // Continue even if blockchain fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Claim submitted successfully',
      claim: {
        ...claim.toObject(),
        photos
      },
      blockchain: blockchainResult
    });
  } catch (error) {
    console.error('Submit claim error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

