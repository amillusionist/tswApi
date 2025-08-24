const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Service price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  featuredImage: {
    type: String,
    required: [true, 'Featured image is required'],
    trim: true
  },
  images: [{
    imageUrl: {
      type: String,
      required: true,
      trim: true
    },
    altText: {
      type: String,
      trim: true,
      maxlength: [100, 'Alt text cannot exceed 100 characters']
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  addons: [{
    addonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Addon'
    },
    isRequired: {
      type: Boolean,
      default: false
    },
    defaultQuantity: {
      type: Number,
      default: 1,
      min: [1, 'Default quantity must be at least 1']
    }
  }],
  duration: {
    type: Number, // in minutes
    required: [true, 'Service duration is required'],
    min: [15, 'Duration must be at least 15 minutes']
  },
  pincodes: [{
    type: String,
    trim: true,
    maxlength: [10, 'Pincode cannot exceed 10 characters'],
    validate: {
      validator: function(v) {
        return /^\d{6}$/.test(v);
      },
      message: 'Pincode must be 6 digits'
    }
  }],
  features: [{
    type: String,
    trim: true,
    maxlength: [100, 'Feature cannot exceed 100 characters']
  }],
  requirements: [{
    type: String,
    trim: true,
    maxlength: [150, 'Requirement cannot exceed 150 characters']
  }],
  instructions: {
    type: String,
    trim: true,
    maxlength: [500, 'Instructions cannot exceed 500 characters']
  },
  cancellationPolicy: {
    type: String,
    trim: true,
    maxlength: [300, 'Cancellation policy cannot exceed 300 characters']
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    availableDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    availableTimeSlots: [{
      startTime: {
        type: String,
        required: true,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
      },
      endTime: {
        type: String,
        required: true,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
      }
    }],
    maxBookingsPerDay: {
      type: Number,
      default: 10,
      min: [1, 'Max bookings per day must be at least 1']
    }
  },
  provider: {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    providerName: {
      type: String,
      trim: true,
      maxlength: [100, 'Provider name cannot exceed 100 characters']
    },
    providerRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    providerExperience: {
      type: Number,
      min: [0, 'Experience cannot be negative']
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  seo: {
    metaTitle: {
      type: String,
      trim: true,
      maxlength: [60, 'Meta title cannot exceed 60 characters']
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: [160, 'Meta description cannot exceed 160 characters']
    },
    keywords: [{
      type: String,
      trim: true,
      maxlength: [30, 'Keyword cannot exceed 30 characters']
    }]
  },
  active: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  popular: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better search performance
serviceSchema.index({ name: 'text', description: 'text', tags: 'text' });
serviceSchema.index({ categoryId: 1, active: 1 });
serviceSchema.index({ provider: 1, active: 1 });
serviceSchema.index({ featured: 1, active: 1 });
serviceSchema.index({ popular: 1, active: 1 });
 serviceSchema.index({ rating: -1 });

// Virtual for discount percentage
serviceSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Ensure virtual fields are serialized
serviceSchema.set('toJSON', { virtuals: true });
serviceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Service', serviceSchema);
