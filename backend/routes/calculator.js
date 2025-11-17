const express = require('express');
const { body, validationResult } = require('express-validator');
const PolicyType = require('../models/PolicyType');

const router = express.Router();

// Get all policy types (public endpoint for calculator and buy policy)
router.get('/policy-types', async (req, res) => {
  try {
    const policyTypes = await PolicyType.find()
      .select('name description baseRate ageFactor engineFactor addOns')
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

// Calculate premium
router.post('/premium', [
  body('vehicleType').notEmpty().withMessage('Vehicle type is required'),
  body('modelYear').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Valid model year is required'),
  body('engineCapacity').isFloat({ min: 0 }).withMessage('Engine capacity is required'),
  body('policyTypeId').notEmpty().withMessage('Policy type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { vehicleType, modelYear, engineCapacity, policyTypeId, addOns = [] } = req.body;

    // Get policy type
    const policyType = await PolicyType.findById(policyTypeId);
    if (!policyType) {
      return res.status(404).json({ success: false, message: 'Policy type not found' });
    }

    // Calculate vehicle age
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - modelYear;

    // Base premium
    let premium = policyType.baseRate;

    // Age factor
    premium *= (1 + (vehicleAge * policyType.ageFactor));

    // Engine capacity factor
    premium *= (1 + (engineCapacity * policyType.engineFactor));

    // Vehicle type multiplier
    const vehicleTypeMultipliers = {
      'Car': 1.0,
      'SUV': 1.2,
      'Truck': 1.3,
      'Motorcycle': 0.8,
      'Van': 1.1
    };
    premium *= (vehicleTypeMultipliers[vehicleType] || 1.0);

    // Add-ons
    let addOnCosts = {};
    let totalAddOnCost = 0;
    
    if (policyType.addOns && typeof policyType.addOns === 'object') {
      for (const addOn of addOns) {
        if (policyType.addOns[addOn]) {
          const cost = premium * policyType.addOns[addOn];
          addOnCosts[addOn] = cost;
          totalAddOnCost += cost;
        }
      }
    }

    const finalPremium = premium + totalAddOnCost;

    res.json({
      success: true,
      calculation: {
        basePremium: premium,
        addOnCosts,
        totalAddOnCost,
        finalPremium: Math.round(finalPremium * 100) / 100
      }
    });
  } catch (error) {
    console.error('Premium calculation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

