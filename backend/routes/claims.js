const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const Claim = require('../models/Claim');
const ClaimPhoto = require('../models/ClaimPhoto');
const Policy = require('../models/Policy');
const BlockchainRecord = require('../models/BlockchainRecord');
const IPFSFile = require('../models/IPFSFile');
const { auth } = require('../middleware/auth');
const blockchainService = require('../services/blockchain');
const ipfsService = require('../services/ipfs');

// Service URLs
const ML_ANALYZER_URL = process.env.ML_ANALYZER_URL || 'http://localhost:8000';

// Uploads directory
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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

// Get ML report from Pinata using CID
router.get('/:id/ml-report', auth, async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    // Check if user owns this claim or is admin
    if (claim.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!claim.mlReportCID) {
      return res.status(404).json({ success: false, message: 'ML report CID not found' });
    }

    // Fetch ML report from Pinata gateway
    const pinataGateway = process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';
    const reportUrl = `${pinataGateway}/${claim.mlReportCID}`;
    
    console.log(`📥 Fetching ML report from Pinata: ${reportUrl}`);
    
    try {
      const response = await axios.get(reportUrl, { timeout: 10000 });
      const mlReport = response.data;
      
      console.log(`✅ ML report fetched successfully. Severity: ${mlReport.severity}`);
      
      res.json({
        success: true,
        mlReport: {
          severity: mlReport.severity,
          damage_parts: mlReport.damage_parts || [],
          confidence: mlReport.confidence,
          timestamp: mlReport.timestamp,
          is_vehicle: mlReport.is_vehicle,
          validation_error: mlReport.validation_error,
          fullReport: mlReport // Include full report for debugging
        }
      });
    } catch (fetchError) {
      console.error('Error fetching ML report from Pinata:', fetchError.message);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch ML report from Pinata',
        error: fetchError.message 
      });
    }
  } catch (error) {
    console.error('Get ML report error:', error);
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

    // Step 1: Upload photos to IPFS AND keep local copy
    const photos = [];
    const evidenceCids = [];
    let firstPhotoCID = null;
    let firstPhotoPath = null; // Keep path for direct Gemini upload

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          // Step 1a: Upload to IPFS (if available)
          let ipfsCid = null;
          let ipfsUrl = null;
          
          if (ipfsService.isAvailable && ipfsService.isAvailable()) {
            const ipfsResult = await ipfsService.uploadFile(file.path, file.originalname);
            
            if (ipfsResult) {
              ipfsCid = ipfsResult.cid;
              ipfsUrl = ipfsResult.url;
              evidenceCids.push(ipfsCid);
              console.log(`✅ Photo uploaded to IPFS: ${ipfsCid}`);
              
              // Store first photo CID for ML analysis
              if (!firstPhotoCID) {
                firstPhotoCID = ipfsCid;
                firstPhotoPath = file.path; // Keep path for direct Gemini upload
              }

              // Record IPFS file
              const ipfsFile = new IPFSFile({
                ipfsCid: ipfsCid,
                fileType: 'claim-photo',
                uploadedBy: req.user._id
              });
              await ipfsFile.save().catch(() => {}); // Ignore duplicate errors
            } else {
              console.warn('⚠️  IPFS upload failed, continuing with local storage');
            }
          } else {
            console.warn('⚠️  IPFS not available, using local storage only');
          }

          // Step 1b: Save local copy (move from temp to permanent location)
          const permanentPath = path.join(uploadsDir, `${claim._id}_${file.filename}`);
          fs.copyFileSync(file.path, permanentPath);
          
          // Store first photo path for Gemini analysis
          if (!firstPhotoPath) {
            firstPhotoPath = permanentPath;
          }

          // Step 1c: Save photo record in database
          const claimPhoto = new ClaimPhoto({
            claimId: claim._id,
            ipfsCid: ipfsCid || 'local-only',
            url: ipfsUrl || `/uploads/${claim._id}_${file.filename}`,
            blockchainIncluded: false
          });
          await claimPhoto.save();
          photos.push(claimPhoto);

          // Clean up temp file (we have permanent copy now)
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (error) {
          console.error('Photo processing error:', error);
          // Save photo record even if IPFS/local save failed
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

    // Step 2: ML Analysis - Send image directly to Gemini (bypass IPFS)
    let mlReport = null;
    if (firstPhotoPath && fs.existsSync(firstPhotoPath)) {
      try {
        console.log(`🔍 Sending image directly to Gemini for analysis: ${firstPhotoPath}`);
        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('file', fs.createReadStream(firstPhotoPath), path.basename(firstPhotoPath));
        
        const mlResponse = await axios.post(`${ML_ANALYZER_URL}/analyze/upload`, formData, {
          headers: formData.getHeaders(),
          timeout: 30000
        });
        console.log(`✅ ML analysis via direct upload successful`);
        
        if (mlResponse && mlResponse.data) {
          mlReport = mlResponse.data;
          
          // Check if ML validation failed (non-vehicle image)
          if (mlReport.is_vehicle === false || mlReport.validation_error) {
            console.warn(`⚠️  ML Validation failed: ${mlReport.validation_error || 'Not a vehicle'}`);
            // Mark claim with validation error but don't fail the submission
            claim.mlValidationError = mlReport.validation_error || 'Image does not appear to be a vehicle';
            claim.mlSeverity = 0;
            claim.mlConfidence = 0;
          } else {
            claim.mlSeverity = mlReport.severity;
            claim.mlReportCID = mlReport.mlReportCID || null;
            claim.damageParts = mlReport.damage_parts || [];
            claim.mlConfidence = mlReport.confidence || null;
            console.log(`✅ ML Analysis complete: Severity=${mlReport.severity}, Confidence=${mlReport.confidence}`);
          }
        }
      } catch (mlError) {
      } catch (mlError) {
        // Handle specific validation errors (400 status)
        if (mlError.response && mlError.response.status === 400) {
          const errorDetail = mlError.response.data?.detail || {};
          console.warn(`⚠️  ML Validation failed: ${errorDetail.message || errorDetail.error || 'Invalid image'}`);
          claim.mlValidationError = errorDetail.message || errorDetail.error || 'Image validation failed';
          claim.mlSeverity = 0;
          claim.mlConfidence = 0;
        } else {
          console.error('⚠️  ML Analysis error (non-fatal):', mlError.message);
          // Continue without ML analysis for other errors
        }
      }
    }

    await claim.save();

    // Step 3: Write to blockchain (enhanced contract with ML data)
    let blockchainResult = null;
    if (blockchainService.isAvailable() && evidenceCids.length > 0) {
      try {
        blockchainResult = await blockchainService.submitClaimWithML(
          claim._id.toString(),
          policyId,
          req.user._id.toString(),
          description,
          evidenceCids,
          claim.mlReportCID || '',
          Math.floor(claim.mlSeverity || 0)
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
      mlAnalysis: mlReport ? {
        severity: mlReport.severity,
        damageParts: mlReport.damage_parts,
        confidence: mlReport.confidence,
        mlReportCID: mlReport.mlReportCID
      } : null,
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

// Get claim for Oracle (no auth required, internal service call)
router.get('/:id/oracle', async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate('policyId')
      .populate('userId', 'name email');

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    res.json({
      success: true,
      claim: {
        ...claim.toObject(),
        severity: claim.mlSeverity || 0
      }
    });
  } catch (error) {
    console.error('Get claim for Oracle error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update claim from Oracle (called by Oracle service)
router.patch('/:id/updateFromOracle', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, verified, payoutAmount, blockchainEvaluated } = req.body;

    const claim = await Claim.findById(id);
    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    // Update claim fields
    if (status) claim.status = status;
    if (verified !== undefined) claim.verified = verified;
    if (payoutAmount !== undefined) {
      claim.payoutAmount = payoutAmount;
      claim.payoutStatus = payoutAmount > 0 ? 'Approved' : 'Rejected';
    }
    if (blockchainEvaluated !== undefined) claim.blockchainEvaluated = blockchainEvaluated;

    await claim.save();

    res.json({
      success: true,
      message: 'Claim updated from Oracle',
      claim
    });
  } catch (error) {
    console.error('Update from Oracle error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete claim (user can delete their own claim, admin can delete any)
router.delete('/:id', auth, async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    
    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    // Check if user owns this claim or is admin
    if (claim.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Prevent deletion of approved claims (optional safety check)
    if (claim.status === 'Approved' && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an approved claim. Please contact admin if you need to remove it.'
      });
    }

    // Get IPFS CIDs before deleting photos
    const claimPhotos = await ClaimPhoto.find({ claimId: claim._id });
    const ipfsCids = claimPhotos.map(photo => photo.ipfsCid).filter(cid => cid && cid !== 'local-only' && cid !== 'upload-failed');
    
    // Delete related photos
    await ClaimPhoto.deleteMany({ claimId: claim._id });

    // Delete blockchain records if exists
    if (claim.blockchainTxHash) {
      try {
        await BlockchainRecord.deleteMany({ 
          entityType: 'Claim', 
          entityId: claim._id 
        });
      } catch (blockchainError) {
        console.error('Error deleting blockchain records:', blockchainError);
        // Continue with claim deletion even if blockchain record deletion fails
      }
    }

    // Delete IPFS files associated with this claim
    try {
      if (ipfsCids.length > 0) {
        await IPFSFile.deleteMany({ ipfsCid: { $in: ipfsCids } });
      }
      
      // Also delete ML report CID if exists
      if (claim.mlReportCID) {
        await IPFSFile.deleteMany({ ipfsCid: claim.mlReportCID });
      }
    } catch (ipfsError) {
      console.error('Error deleting IPFS records:', ipfsError);
      // Continue with claim deletion even if IPFS record deletion fails
    }

    await Claim.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Claim deleted successfully'
    });
  } catch (error) {
    console.error('Delete claim error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

