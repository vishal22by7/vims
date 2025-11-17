const mongoose = require('mongoose');

const blockchainRecordSchema = new mongoose.Schema({
  entityType: {
    type: String,
    enum: ['Policy', 'Claim'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  txHash: {
    type: String,
    required: true,
    unique: true
  },
  blockNumber: {
    type: Number,
    required: true
  },
  eventName: {
    type: String,
    enum: ['PolicyIssued', 'ClaimSubmitted', 'ClaimStatusUpdated'],
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BlockchainRecord', blockchainRecordSchema);

