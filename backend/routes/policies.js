const express = require('express');
const { body, validationResult } = require('express-validator');
const Policy = require('../models/Policy');
const PolicyType = require('../models/PolicyType');
const BlockchainRecord = require('../models/BlockchainRecord');
const IPFSFile = require('../models/IPFSFile');
const { auth } = require('../middleware/auth');
const blockchainService = require('../services/blockchain');
const ipfsService = require('../services/ipfs');

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

// Buy policy
router.post('/buy', auth, [
  body('policyTypeId').notEmpty().withMessage('Policy type is required'),
  body('premium').isFloat({ min: 0 }).withMessage('Premium is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('vehicleType').notEmpty().withMessage('Vehicle type is required'),
  body('vehicleBrand').notEmpty().withMessage('Vehicle brand is required'),
  body('vehicleModel').notEmpty().withMessage('Vehicle model is required'),
  body('modelYear').isInt().withMessage('Model year is required'),
  body('engineCapacity').isFloat({ min: 0 }).withMessage('Engine capacity is required')
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
      engineCapacity
    } = req.body;

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
      engineCapacity
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

module.exports = router;

