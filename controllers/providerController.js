const User = require('../models/User');
const Booking = require('../models/Booking');
const { sendResponse, paginateResults, buildFilter, buildSort } = require('../utils/helpers');
const { validationResult } = require('express-validator');

// @desc    Provider self-registration
// @route   POST /api/providers/register
// @access  Public
const registerProvider = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { name, email, password, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendResponse(res, 400, false, 'User already exists with this email');
    }

    // Create provider (worker)
    const provider = await User.create({
      name,
      email,
      password,
      phone,
      role: 'worker',
      address
    });

    sendResponse(res, 201, true, 'Provider registered successfully', {
      provider: {
        id: provider._id,
        name: provider.name,
        email: provider.email,
        phone: provider.phone,
        role: provider.role
      }
    });
  } catch (error) {
    console.error('Provider registration error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get all providers (Admin only)
// @route   GET /api/providers
// @access  Private (Admin)
const getProviders = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt', ...filters } = req.query;
    const { skip, limit: limitNum } = paginateResults(page, limit);
    const filter = { role: 'worker', ...buildFilter(filters) };
    const sortObj = buildSort(sort);

    const providers = await User.find(filter)
      .select('-password')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(filter);

    sendResponse(res, 200, true, 'Providers retrieved successfully', {
      providers,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get providers error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get provider by ID
// @route   GET /api/providers/:id
// @access  Private (Admin/User)
const getProviderById = async (req, res) => {
  try {
    const provider = await User.findById(req.params.id)
      .select('-password');

    if (!provider || provider.role !== 'worker') {
      return sendResponse(res, 404, false, 'Provider not found');
    }

    // Get provider's booking statistics
    const bookingStats = await Booking.aggregate([
      { $match: { provider: provider._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalEarnings: { $sum: '$price' }
        }
      }
    ]);

    const totalBookings = await Booking.countDocuments({ provider: provider._id });
    const completedBookings = await Booking.countDocuments({ 
      provider: provider._id, 
      status: 'completed' 
    });

    sendResponse(res, 200, true, 'Provider retrieved successfully', {
      provider: {
        ...provider.toObject(),
        stats: {
          totalBookings,
          completedBookings,
          bookingBreakdown: bookingStats
        }
      }
    });
  } catch (error) {
    console.error('Get provider by ID error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Update provider
// @route   PUT /api/providers/:id
// @access  Private (Admin)
const updateProvider = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { name, email, phone, isActive, address } = req.body;
    const updateFields = {};

    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (typeof isActive === 'boolean') updateFields.isActive = isActive;
    if (address) updateFields.address = address;

    const provider = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    if (!provider || provider.role !== 'worker') {
      return sendResponse(res, 404, false, 'Provider not found');
    }

    sendResponse(res, 200, true, 'Provider updated successfully', { provider });
  } catch (error) {
    console.error('Update provider error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Delete provider
// @route   DELETE /api/providers/:id
// @access  Private (Admin)
const deleteProvider = async (req, res) => {
  try {
    const provider = await User.findById(req.params.id);
    
    if (!provider || provider.role !== 'worker') {
      return sendResponse(res, 404, false, 'Provider not found');
    }

    // Check if provider has active bookings
    const activeBookings = await Booking.countDocuments({
      provider: provider._id,
      status: { $in: ['pending', 'accepted', 'in-progress'] }
    });

    if (activeBookings > 0) {
      return sendResponse(res, 400, false, 'Cannot delete provider with active bookings');
    }

    await User.findByIdAndDelete(req.params.id);

    sendResponse(res, 200, true, 'Provider deleted successfully');
  } catch (error) {
    console.error('Delete provider error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get current provider profile
// @route   GET /api/providers/me
// @access  Private (Worker)
const getMyProviderProfile = async (req, res) => {
  try {
    const provider = await User.findById(req.user.id).select('-password');

    if (!provider || provider.role !== 'worker') {
      return sendResponse(res, 403, false, 'Access denied. Worker role required.');
    }

    // Get provider's booking statistics
    const bookingStats = await Booking.aggregate([
      { $match: { provider: provider._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalEarnings: { $sum: '$price' }
        }
      }
    ]);

    const totalBookings = await Booking.countDocuments({ provider: provider._id });
    const completedBookings = await Booking.countDocuments({ 
      provider: provider._id, 
      status: 'completed' 
    });

    const recentBookings = await Booking.find({ provider: provider._id })
      .sort('-createdAt')
      .limit(5)
      .populate('service', 'title category')
      .populate('user', 'name email phone')
      .select('status price scheduledAt createdAt');

    sendResponse(res, 200, true, 'Provider profile retrieved successfully', {
      provider: {
        ...provider.toObject(),
        stats: {
          totalBookings,
          completedBookings,
          bookingBreakdown: bookingStats
        },
        recentBookings
      }
    });
  } catch (error) {
    console.error('Get my provider profile error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Update current provider profile
// @route   PUT /api/providers/me
// @access  Private (Worker)
const updateMyProviderProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { name, phone, address } = req.body;
    const updateFields = {};

    if (name) updateFields.name = name;
    if (phone) updateFields.phone = phone;
    if (address) updateFields.address = address;

    const provider = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    sendResponse(res, 200, true, 'Profile updated successfully', { provider });
  } catch (error) {
    console.error('Update my provider profile error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get available providers for a service
// @route   GET /api/providers/available
// @access  Public
const getAvailableProviders = async (req, res) => {
  try {
    const { service, date, time } = req.query;

    if (!date || !time) {
      return sendResponse(res, 400, false, 'Date and time are required');
    }

    const scheduledDateTime = new Date(`${date}T${time}`);

    // Get all active workers
    const providers = await User.find({ 
      role: 'worker', 
      isActive: true 
    }).select('name email phone address');

    // Filter out providers who have conflicting bookings
    const availableProviders = [];

    for (const provider of providers) {
      const conflictingBooking = await Booking.findOne({
        provider: provider._id,
        scheduledAt: {
          $gte: scheduledDateTime,
          $lte: new Date(scheduledDateTime.getTime() + 2 * 60 * 60 * 1000) // 2 hours window
        },
        status: { $in: ['pending', 'accepted', 'in-progress'] }
      });

      if (!conflictingBooking) {
        availableProviders.push(provider);
      }
    }

    sendResponse(res, 200, true, 'Available providers retrieved successfully', {
      providers: availableProviders
    });
  } catch (error) {
    console.error('Get available providers error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get provider statistics (Admin only)
// @route   GET /api/providers/stats
// @access  Private (Admin)
const getProviderStats = async (req, res) => {
  try {
    const totalProviders = await User.countDocuments({ role: 'worker' });
    const activeProviders = await User.countDocuments({ role: 'worker', isActive: true });

    const providersByPerformance = await Booking.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$provider',
          totalBookings: { $sum: 1 },
          totalEarnings: { $sum: '$price' },
          avgRating: { $avg: '$rating' }
        }
      },
      { $sort: { totalEarnings: -1 } },
      { $limit: 10 }
    ]);

    const topProviders = await User.populate(providersByPerformance, {
      path: '_id',
      select: 'name email phone',
      model: 'User'
    });

    sendResponse(res, 200, true, 'Provider statistics retrieved successfully', {
      stats: {
        total: totalProviders,
        active: activeProviders,
        inactive: totalProviders - activeProviders
      },
      topProviders
    });
  } catch (error) {
    console.error('Get provider stats error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

module.exports = {
  registerProvider,
  getProviders,
  getProviderById,
  updateProvider,
  deleteProvider,
  getMyProviderProfile,
  updateMyProviderProfile,
  getAvailableProviders,
  getProviderStats
};
