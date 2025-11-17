const mongoose = require('mongoose');

const ipfsFileSchema = new mongoose.Schema({
  ipfsCid: {
    type: String,
    required: true,
    unique: true
  },
  localPath: {
    type: String,
    default: null
  },
  fileType: {
    type: String,
    enum: ['claim-photo', 'policy-pdf', 'other'],
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('IPFSFile', ipfsFileSchema);

