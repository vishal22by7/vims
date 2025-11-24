const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  policyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Policy',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  ipfsDescriptionCid: {
    type: String,
    default: null
  },
  claimIdOnChain: {
    type: Number,
    default: null
  },
  status: {
    type: String,
    enum: ['Submitted', 'In Review', 'Approved', 'Rejected'],
    default: 'Submitted'
  },
  blockchainTxHash: {
    type: String,
    default: null
  },
  // ML Analysis fields
  mlSeverity: {
    type: Number,
    default: null,
    min: 0,
    max: 100
  },
  mlReportCID: {
    type: String,
    default: null
  },
  damageParts: {
    type: [String],
    default: []
  },
  mlConfidence: {
    type: Number,
    default: null
  },
  mlValidationError: {
    type: String,
    default: null
  },
  // Private verification fields
  verified: {
    type: Boolean,
    default: false
  },
  fabricVerificationCID: {
    type: String,
    default: null
  },
  // Payout fields
  payoutAmount: {
    type: Number,
    default: 0
  },
  payoutStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Paid', 'Rejected'],
    default: 'Pending'
  },
  // Oracle fields
  blockchainEvaluated: {
    type: Boolean,
    default: false
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update updatedAt before save
claimSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.updatedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('Claim', claimSchema);

