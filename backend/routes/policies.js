const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const Policy = require('../models/Policy');
const PolicyType = require('../models/PolicyType');
const BlockchainRecord = require('../models/BlockchainRecord');
const IPFSFile = require('../models/IPFSFile');
const { auth } = require('../middleware/auth');
const blockchainService = require('../services/blockchain');
const ipfsService = require('../services/ipfs');

// Configure multer for document uploads
const uploadsDir = path.join(__dirname, '../uploads/policies');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf';

    if (extname || mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and PDF files are allowed'));
    }
  }
});

const router = express.Router();

// Get all policies (user's own policies)
router.get('/', auth, async (req, res) => {
  try {
    const policies = await Policy.find({ userId: req.user._id })
      .populate('policyTypeId', 'name description')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      policies
    });
  } catch (error) {
    console.error('Get policies error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch policies',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get single policy
router.get('/:id', auth, async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id)
      .populate('policyTypeId')
      .populate('userId', 'name email');

    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }

    // Check if user owns this policy or is admin
    if (policy.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({
      success: true,
      policy
    });
  } catch (error) {
    console.error('Get policy error:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid policy ID' });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch policy',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to validate chassis number (17 chars, no I, O, Q)
function validateChassisNumber(chassisNumber) {
  if (!chassisNumber || typeof chassisNumber !== 'string') {
    return false;
  }
  const cleaned = chassisNumber.toUpperCase().trim();
  if (cleaned.length !== 17) {
    return false;
  }
  // VIN pattern: 17 alphanumeric characters, excluding I, O, Q
  const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/;
  return vinPattern.test(cleaned);
}

// Buy policy
router.post('/buy', auth, upload.fields([
  { name: 'rcDocument', maxCount: 1 },
  { name: 'insuranceDocument', maxCount: 1 },
  { name: 'drivingLicense', maxCount: 1 }
]), [
  body('policyTypeId').notEmpty().withMessage('Policy type is required'),
  body('premium').isFloat({ min: 0 }).withMessage('Premium is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('vehicleType').notEmpty().withMessage('Vehicle type is required'),
  body('vehicleBrand').notEmpty().withMessage('Vehicle brand is required'),
  body('vehicleModel').notEmpty().withMessage('Vehicle model is required'),
  body('modelYear').isInt().withMessage('Model year is required'),
  body('engineCapacity').isFloat({ min: 0 }).withMessage('Engine capacity is required'),
  body('registrationNumber').notEmpty().trim().withMessage('Vehicle registration number is required'),
  body('chassisNumber').notEmpty().trim().withMessage('Chassis number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      policyTypeId,
      premium,
      startDate,
      endDate,
      vehicleType,
      vehicleBrand,
      vehicleModel,
      modelYear,
      engineCapacity,
      registrationNumber,
      chassisNumber,
      addOns
    } = req.body;

    // Parse addOns if it's a JSON string
    let parsedAddOns = [];
    if (addOns) {
      try {
        parsedAddOns = typeof addOns === 'string' ? JSON.parse(addOns) : addOns;
      } catch (e) {
        parsedAddOns = [];
      }
    }

    // Verify policy type exists
    const policyType = await PolicyType.findById(policyTypeId);
    if (!policyType) {
      return res.status(404).json({ success: false, message: 'Policy type not found' });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    if (start < now) {
      return res.status(400).json({ success: false, message: 'Start date cannot be in the past' });
    }
    
    if (end <= start) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }

    // Validate model year
    const currentYear = new Date().getFullYear();
    if (modelYear < 1900 || modelYear > currentYear + 1) {
      return res.status(400).json({ success: false, message: 'Invalid model year' });
    }

    // Validate chassis number
    const cleanedChassis = chassisNumber.toUpperCase().trim();
    if (!validateChassisNumber(cleanedChassis)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid chassis number. Must be exactly 17 alphanumeric characters (no I, O, or Q)' 
      });
    }

    // Check for duplicate registration number
    const existingPolicy = await Policy.findOne({ 
      registrationNumber: registrationNumber.toUpperCase().trim() 
    });
    if (existingPolicy) {
      return res.status(400).json({ 
        success: false, 
        message: 'A policy already exists for this vehicle registration number' 
      });
    }

    // Handle document uploads
    const documents = {
      rcDocument: { path: null, ipfsCid: null },
      insuranceDocument: { path: null, ipfsCid: null },
      drivingLicense: { path: null, ipfsCid: null }
    };

    if (req.files) {
      // RC Document is required
      if (!req.files.rcDocument || req.files.rcDocument.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'RC Document is required' 
        });
      }

      // Process RC Document
      const rcFile = req.files.rcDocument[0];
      documents.rcDocument.path = rcFile.path;
      
      // Upload to IPFS if available
      if (ipfsService.isAvailable()) {
        try {
          const rcCid = await ipfsService.uploadFile(rcFile.path, rcFile.originalname);
          if (rcCid) {
            documents.rcDocument.ipfsCid = rcCid;
          }
        } catch (ipfsError) {
          console.error('IPFS upload error for RC:', ipfsError);
          // Continue even if IPFS fails
        }
      }

      // Process Insurance Document (optional)
      if (req.files.insuranceDocument && req.files.insuranceDocument.length > 0) {
        const insFile = req.files.insuranceDocument[0];
        documents.insuranceDocument.path = insFile.path;
        
        if (ipfsService.isAvailable()) {
          try {
            const insCid = await ipfsService.uploadFile(insFile.path, insFile.originalname);
            if (insCid) {
              documents.insuranceDocument.ipfsCid = insCid;
            }
          } catch (ipfsError) {
            console.error('IPFS upload error for Insurance:', ipfsError);
          }
        }
      }

      // Process Driving License (optional)
      if (req.files.drivingLicense && req.files.drivingLicense.length > 0) {
        const dlFile = req.files.drivingLicense[0];
        documents.drivingLicense.path = dlFile.path;
        
        if (ipfsService.isAvailable()) {
          try {
            const dlCid = await ipfsService.uploadFile(dlFile.path, dlFile.originalname);
            if (dlCid) {
              documents.drivingLicense.ipfsCid = dlCid;
            }
          } catch (ipfsError) {
            console.error('IPFS upload error for DL:', ipfsError);
          }
        }
      }
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'RC Document is required' 
      });
    }

    // Create policy
    const policy = new Policy({
      userId: req.user._id,
      policyTypeId,
      premium,
      startDate,
      endDate,
      vehicleType,
      vehicleBrand,
      vehicleModel,
      modelYear,
      engineCapacity,
      registrationNumber: registrationNumber.toUpperCase().trim(),
      chassisNumber: cleanedChassis,
      documents: documents
    });

    await policy.save();

    // Write to blockchain
    let blockchainResult = null;
    if (blockchainService.isAvailable()) {
      try {
        blockchainResult = await blockchainService.issuePolicy(
          policy._id.toString(),
          req.user._id.toString(),
          premium,
          startDate,
          endDate
        );

        policy.policyIdOnChain = policy._id.toString();
        policy.blockchainTxHash = blockchainResult.txHash;
        await policy.save();

        // Create blockchain record
        const blockchainRecord = new BlockchainRecord({
          entityType: 'Policy',
          entityId: policy._id,
          txHash: blockchainResult.txHash,
          blockNumber: blockchainResult.blockNumber,
          eventName: 'PolicyIssued',
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
      message: 'Policy purchased successfully',
      policy,
      blockchain: blockchainResult
    });
  } catch (error) {
    console.error('Buy policy error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(e => e.message) 
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Policy already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete policy (user can delete their own policy, admin can delete any)
router.delete('/:id', auth, async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
    
    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }

    // Check if user owns this policy or is admin
    if (policy.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Check if policy has any claims
    const Claim = require('../models/Claim');
    const claimsCount = await Claim.countDocuments({ policyId: req.params.id });
    
    if (claimsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete policy. ${claimsCount} claim(s) are associated with this policy. Please delete the claims first.`
      });
    }

    // Delete blockchain record if exists
    if (policy.blockchainTxHash) {
      try {
        const BlockchainRecord = require('../models/BlockchainRecord');
        await BlockchainRecord.deleteMany({ 
          entityType: 'Policy', 
          entityId: policy._id 
        });
      } catch (blockchainError) {
        console.error('Error deleting blockchain records:', blockchainError);
        // Continue with policy deletion even if blockchain record deletion fails
      }
    }

    await Policy.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Policy deleted successfully'
    });
  } catch (error) {
    console.error('Delete policy error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

