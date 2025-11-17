const mongoose = require('mongoose');

const policyTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  baseRate: {
    type: Number,
    required: true,
    min: 0
  },
  ageFactor: {
    type: Number,
    required: true,
    min: 0
  },
  engineFactor: {
    type: Number,
    required: true,
    min: 0
  },
  addOns: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PolicyType', policyTypeSchema);

