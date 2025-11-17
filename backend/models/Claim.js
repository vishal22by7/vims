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

