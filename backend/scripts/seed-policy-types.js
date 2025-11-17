const mongoose = require('mongoose');
const PolicyType = require('../models/PolicyType');
require('dotenv').config();

const policyTypes = [
  {
    name: 'Third-Party Liability (TP)',
    description: 'IRDAI-mandated third-party liability cover for damages to life or property.',
    baseRate: 4000,
    ageFactor: 0.01,
    engineFactor: 0.002,
    addOns: {}
  },
  {
    name: 'Comprehensive Private Car',
    description: 'Full cover including own damage, third-party liability, and PA cover.',
    baseRate: 9500,
    ageFactor: 0.015,
    engineFactor: 0.003,
    addOns: {
      'Zero Depreciation': 0.20,
      'Engine Protect': 0.08,
      'Roadside Assistance': 0.05
    }
  },
  {
    name: 'Stand-Alone Own Damage (OD)',
    description: 'Own damage-only policy when TP policy already exists.',
    baseRate: 6500,
    ageFactor: 0.012,
    engineFactor: 0.0025,
    addOns: {
      'Zero Depreciation': 0.18,
      'Consumables Cover': 0.04
    }
  },
  {
    name: 'Commercial Vehicle Package – Goods Carrier',
    description: 'Comprehensive cover for light commercial goods carriers.',
    baseRate: 12000,
    ageFactor: 0.018,
    engineFactor: 0.0035,
    addOns: {
      'Hull Damage Cover': 0.06,
      'Legal Liability Driver/Conductor': 0.03
    }
  },
  {
    name: 'Two-Wheeler Comprehensive',
    description: 'Complete protection for motorcycles and scooters.',
    baseRate: 3000,
    ageFactor: 0.008,
    engineFactor: 0.0015,
    addOns: {
      'Zero Depreciation': 0.15,
      'Pillion Rider Cover': 0.05
    }
  },
  {
    name: 'Zero-Depreciation Premium Plan',
    description: 'High-end plan for cars under five years with full depreciation waiver.',
    baseRate: 13000,
    ageFactor: 0.02,
    engineFactor: 0.004,
    addOns: {
      'Zero Depreciation': 0.30,
      'Return to Invoice': 0.1,
      'Tyre Protect': 0.05
    }
  }
];

async function seedPolicyTypes() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vims';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    for (const policy of policyTypes) {
      await PolicyType.findOneAndUpdate(
        { name: policy.name },
        {
          $set: {
            description: policy.description,
            baseRate: policy.baseRate,
            ageFactor: policy.ageFactor,
            engineFactor: policy.engineFactor,
            addOns: policy.addOns
          }
        },
        { upsert: true, new: true }
      );
      console.log(`✔️  Seeded policy type: ${policy.name}`);
    }

    console.log('\n🎉 Policy types seeded successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding policy types:', error.message);
    process.exit(1);
  }
}

seedPolicyTypes();

