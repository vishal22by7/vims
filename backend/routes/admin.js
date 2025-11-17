const express = require('express');
const { body, validationResult } = require('express-validator');
const PolicyType = require('../models/PolicyType');
const Policy = require('../models/Policy');
const Claim = require('../models/Claim');
const User = require('../models/User');
const ClaimPhoto = require('../models/ClaimPhoto');
const BlockchainRecord = require('../models/BlockchainRecord');
const { adminAuth } = require('../middleware/auth');
const blockchainService = require('../services/blockchain');

const router = express.Router();

// All routes require admin authentication
router.use(adminAuth);

// Get dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalPolicies = await Policy.countDocuments();
    const totalClaims = await Claim.countDocuments();
    const pendingClaims = await Claim.countDocuments({ status: 'Submitted' });
    const inReviewClaims = await Claim.countDocuments({ status: 'In Review' });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalPolicies,
        totalClaims,
        pendingClaims,
        inReviewClaims
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Policy Type Management
router.get('/policy-types', async (req, res) => {
  try {
    const policyTypes = await PolicyType.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      policyTypes
    });
  } catch (error) {
    console.error('Get policy types error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/policy-types', [
  body('name').notEmpty().withMessage('Name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('baseRate').isFloat({ min: 0 }).withMessage('Base rate is required'),
  body('ageFactor').isFloat({ min: 0 }).withMessage('Age factor is required'),
  body('engineFactor').isFloat({ min: 0 }).withMessage('Engine factor is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description, baseRate, ageFactor, engineFactor, addOns } = req.body;

    const policyType = new PolicyType({
      name,
      description,
      baseRate,
      ageFactor,
      engineFactor,
      addOns: addOns || {},
      createdBy: req.user._id
    });

    await policyType.save();

    res.status(201).json({
      success: true,
      message: 'Policy type created successfully',
      policyType
    });
  } catch (error) {
    console.error('Create policy type error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/policy-types/:id', [
  body('name').optional().notEmpty(),
  body('description').optional().notEmpty(),
  body('baseRate').optional().isFloat({ min: 0 }),
  body('ageFactor').optional().isFloat({ min: 0 }),
  body('engineFactor').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const policyType = await PolicyType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!policyType) {
      return res.status(404).json({ success: false, message: 'Policy type not found' });
    }

    res.json({
      success: true,
      message: 'Policy type updated successfully',
      policyType
    });
  } catch (error) {
    console.error('Update policy type error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/policy-types/:id', async (req, res) => {
  try {
    const policyType = await PolicyType.findById(req.params.id);
    
    if (!policyType) {
      return res.status(404).json({ success: false, message: 'Policy type not found' });
    }

    // Check if any policies use this type
    const policiesCount = await Policy.countDocuments({ policyTypeId: req.params.id });
    if (policiesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete policy type. ${policiesCount} policies are using it.`
      });
    }

    await PolicyType.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Policy type deleted successfully'
    });
  } catch (error) {
    console.error('Delete policy type error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all policies
router.get('/policies', async (req, res) => {
  try {
    const policies = await Policy.find()
      .populate('userId', 'name email')
      .populate('policyTypeId', 'name description')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      policies
    });
  } catch (error) {
    console.error('Get policies error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all claims
router.get('/claims', async (req, res) => {
  try {
    const claims = await Claim.find()
      .populate('userId', 'name email')
      .populate('policyId', 'vehicleType vehicleBrand vehicleModel')
      .sort({ submittedAt: -1 });

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

// Update claim status
router.put('/claims/:id/status', [
  body('status').isIn(['Submitted', 'In Review', 'Approved', 'Rejected']).withMessage('Valid status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { status } = req.body;
    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    const oldStatus = claim.status;
    claim.status = status;
    await claim.save();

    // Write to blockchain
    let blockchainResult = null;
    if (blockchainService.isAvailable()) {
      try {
        blockchainResult = await blockchainService.updateClaimStatus(
          claim._id.toString(),
          status
        );

        // Create blockchain record
        const blockchainRecord = new BlockchainRecord({
          entityType: 'Claim',
          entityId: claim._id,
          txHash: blockchainResult.txHash,
          blockNumber: blockchainResult.blockNumber,
          eventName: 'ClaimStatusUpdated',
          timestamp: blockchainResult.timestamp
        });
        await blockchainRecord.save();
      } catch (blockchainError) {
        console.error('Blockchain write error (non-fatal):', blockchainError);
        // Continue even if blockchain fails
      }
    }

    res.json({
      success: true,
      message: `Claim status updated from ${oldStatus} to ${status}`,
      claim,
      blockchain: blockchainResult
    });
  } catch (error) {
    console.error('Update claim status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

