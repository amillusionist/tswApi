const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  role: {
    type: String,
    enum: 'user',
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profileImage: {
    type: String,
    default: null
  },
  // address: {
  //   street: String,
  //   city: String,
  //   state: String,
  //   zipCode: String
  // },
  // // Partner/Worker specific fields
  // skills: [{
  //   type: String,
  //   trim: true,
  //   maxlength: [50, 'Skill cannot exceed 50 characters']
  // }],
  // experience: {
  //   type: Number,
  //   min: [0, 'Experience cannot be negative'],
  //   default: 0
  // },
  // availability: {
  //   isAvailable: {
  //     type: Boolean,
  //     default: true
  //   },
  //   availableDays: [{
  //     type: String,
  //     enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  //   }],
  //   availableTimeSlots: [{
  //     startTime: {
  //       type: String,
  //       match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
  //     },
  //     endTime: {
  //       type: String,
  //       match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
  //     }
  //   }],
  //   maxBookingsPerDay: {
  //     type: Number,
  //     default: 10,
  //     min: [1, 'Max bookings per day must be at least 1']
  //   }
  // },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalBookings: {
    type: Number,
    default: 0,
    min: 0
  },
  completedBookings: {
    type: Number,
    default: 0,
    min: 0
  },
  // Tracking fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  // OTP fields for customer login
  loginOTP: {
    code: String,
    expiresAt: Date
  },
  lastOTPSentAt: Date
}, {
  timestamps: true
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare user password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Generate login OTP
userSchema.methods.generateLoginOTP = function() {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set OTP and expiry (5 minutes)
  this.loginOTP = {
    code: otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
  };
  
  this.lastOTPSentAt = new Date();
  
  return otp;
};

// Verify login OTP
userSchema.methods.verifyLoginOTP = function(enteredOTP) {
  if (!this.loginOTP || !this.loginOTP.code || !this.loginOTP.expiresAt) {
    return false;
  }
  
  // Check if OTP is expired
  if (new Date() > this.loginOTP.expiresAt) {
    return false;
  }
  
  // Check if OTP matches
  return this.loginOTP.code === enteredOTP;
};

// Clear login OTP
userSchema.methods.clearLoginOTP = function() {
  this.loginOTP = undefined;
};

module.exports = mongoose.model('User', userSchema);
