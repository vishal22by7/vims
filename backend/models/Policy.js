const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  policyTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PolicyType',
    required: true
  },
  premium: {
    type: Number,
    required: true,
    min: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  vehicleType: {
    type: String,
    required: true
  },
  vehicleBrand: {
    type: String,
    required: true
  },
  vehicleModel: {
    type: String,
    required: true
  },
  modelYear: {
    type: Number,
    required: true
  },
  engineCapacity: {
    type: Number,
    required: true
  },
  registrationNumber: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  chassisNumber: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  policyIdOnChain: {
    type: String,
    default: null
  },
  blockchainTxHash: {
    type: String,
    default: null
  },
  ipfsCid: {
    type: String,
    default: null
  },
  documents: {
    rcDocument: {
      path: { type: String, default: null },
      ipfsCid: { type: String, default: null }
    },
    insuranceDocument: {
      path: { type: String, default: null },
      ipfsCid: { type: String, default: null }
    },
    drivingLicense: {
      path: { type: String, default: null },
      ipfsCid: { type: String, default: null }
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Policy', policySchema);

