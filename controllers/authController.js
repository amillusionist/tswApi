const User = require('../models/User');
const { generateToken,  generateRandomToken, sendResponse } = require('../utils/helpers');
const { sendMail } = require('../services/emailService');
const { validationResult } = require('express-validator');
const crypto = require('crypto');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { name, email, password, phone, role = 'user' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendResponse(res, 400, false, 'User already exists with this email');
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role
    });

    // Generate token
    const token = generateToken(user._id);

    sendResponse(res, 201, true, 'User registered successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return sendResponse(res, 401, false, 'Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      return sendResponse(res, 401, false, 'Account is deactivated');
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendResponse(res, 401, false, 'Invalid credentials');
    }

    // Generate token
    const token = generateToken(user._id);

    sendResponse(res, 200, true, 'Login successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just send a success response
    sendResponse(res, 200, true, 'Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return sendResponse(res, 404, false, 'User not found');
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save();

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendMail({
        email: user.email,
        subject: 'Password reset token',
        html: message
      });

      sendResponse(res, 200, true, 'Email sent');
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return sendResponse(res, 500, false, 'Email could not be sent');
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return sendResponse(res, 400, false, 'Invalid or expired token');
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    sendResponse(res, 200, true, 'Password reset successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Reset password error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Admin add user
// @route   POST /api/auth/admin-add-user
// @access  Private (Admin only)
const adminAddUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { name, email, password, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendResponse(res, 400, false, 'User already exists with this email');
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role
    });

    sendResponse(res, 201, true, 'User created successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin add user error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    sendResponse(res, 200, true, 'User details retrieved', { user });
  } catch (error) {
    console.error('Get me error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Send OTP for customer login
// @route   POST /api/auth/login/user/send-otp
// @access  Public
const sendCustomerLoginOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { email } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    
    // If user doesn't exist, create one with template data
    if (!user) {
      try {
        // Create user with template data
        const templateData = {
          name: `User_${Date.now()}`, // Generate a temporary name
          email: email,
          password: crypto.randomBytes(16).toString('hex'), // Generate random password
          phone: '1234567890', // Empty phone
          role: 'user', // Default role
          isActive: true // Set as active
        };

        user = await User.create(templateData);
        console.log('New user created for OTP:', user.email);
      } catch (createError) {
        console.error('Error creating user:', createError);
        return sendResponse(res, 500, false, 'Failed to create user account');
      }
    }

    // Check if user is active
    if (!user.isActive) {
      return sendResponse(res, 401, false, 'Account is deactivated');
    }

    // Check if OTP was sent recently (rate limiting)
    if (user.lastOTPSentAt) {
      const timeDiff = Date.now() - user.lastOTPSentAt.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      
      if (minutesDiff < 1) { // 1 minute cooldown
        return sendResponse(res, 429, false, 'Please wait 1 minute before requesting another OTP');
      }
    }

    // Generate OTP
    const otp = user.generateLoginOTP();
    await user.save();

    // Send OTP via email
    const message = `Your login OTP is: ${otp}\n\nThis OTP will expire in 5 minutes.\n\nIf you didn't request this OTP, please ignore this email.`;

    try {
      await sendMail({
        email: user.email,
        subject: 'Login OTP',
        html: message
      });

      sendResponse(res, 200, true, 'OTP sent successfully to your email');
    } catch (error) {
      console.error('Email sending error:', error);
      // Clear OTP if email fails
      user.clearLoginOTP();
      await user.save();
      return sendResponse(res, 500, false, 'Failed to send OTP. Please try again.');
    }
  } catch (error) {
    console.error('Send customer login OTP error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Verify OTP and login customer
// @route   POST /api/auth/login/user/verify-otp
// @access  Public
const verifyCustomerLoginOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { email, otp } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return sendResponse(res, 404, false, 'User not found with this email');
    }

    // Check if user is active
    if (!user.isActive) {
      return sendResponse(res, 401, false, 'Account is deactivated');
    }

    // Verify OTP
    const isValidOTP = user.verifyLoginOTP(otp);
    if (!isValidOTP) {
      return sendResponse(res, 401, false, 'Invalid or expired OTP');
    }

    // Clear OTP after successful verification
    user.clearLoginOTP();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    sendResponse(res, 200, true, 'Login successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Verify customer login OTP error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  adminAddUser,
  getMe,
  sendCustomerLoginOTP,
  verifyCustomerLoginOTP
};
