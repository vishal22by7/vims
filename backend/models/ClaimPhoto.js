const mongoose = require('mongoose');

const claimPhotoSchema = new mongoose.Schema({
  claimId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Claim',
    required: true
  },
  ipfsCid: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  blockchainIncluded: {
    type: Boolean,
    default: false
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ClaimPhoto', claimPhotoSchema);

