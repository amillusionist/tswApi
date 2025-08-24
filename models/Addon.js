const mongoose = require('mongoose');

const addonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Addon name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  image: {
    type: String,
    default: null
  },
  duration: {
    type: Number,
    min: [5, 'Duration must be at least 5 minutes'],
    default: 30
  },
  features: [{
    type: String,
    trim: true
  }],
  requirements: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [200, 'Notes cannot exceed 200 characters']
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Text index for search
addonSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Addon', addonSchema);
