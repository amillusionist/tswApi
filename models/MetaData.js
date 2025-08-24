const mongoose = require('mongoose');

const metaDataSchema = new mongoose.Schema({
  key: {
    type: String,
    required: [true, 'Key is required'],
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Value is required']
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    enum: ['system', 'content', 'configuration', 'contact', 'legal'],
    default: 'content'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better query performance
metaDataSchema.index({ key: 1 });
metaDataSchema.index({ category: 1 });
metaDataSchema.index({ isPublic: 1 });

module.exports = mongoose.model('MetaData', metaDataSchema);
