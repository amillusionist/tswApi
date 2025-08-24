const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/User');
const Addon = require('../models/Addon');
const { sendResponse, paginateResults, buildFilter, buildSort, generateBookingRef } = require('../utils/helpers');
const { validationResult } = require('express-validator');

// @desc    Get all bookings (Admin only)
// @route   GET /api/bookings
// @access  Private (Admin)
const getBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt', status, ...filters } = req.query;
    const { skip, limit: limitNum } = paginateResults(page, limit);
    const filter = buildFilter(filters);
    const sortObj = buildSort(sort);

    if (status) {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .populate('service', 'title price category')
      .populate('user', 'name email phone')
      .populate('provider', 'name email phone')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await Booking.countDocuments(filter);

    sendResponse(res, 200, true, 'Bookings retrieved successfully', {
      bookings,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private (Admin)
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('service', 'title price category description')
      .populate('user', 'name email phone address')
      .populate('provider', 'name email phone');

    if (!booking) {
      return sendResponse(res, 404, false, 'Booking not found');
    }

    sendResponse(res, 200, true, 'Booking retrieved successfully', { booking });
  } catch (error) {
    console.error('Get booking by ID error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private (User)
const createBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const {
      service,
      provider,
      scheduledAt,
      address,
      specialInstructions,
      addons,
      price
    } = req.body;

    // Validate service exists
    const serviceExists = await Service.findById(service);
    if (!serviceExists) {
      return sendResponse(res, 404, false, 'Service not found');
    }

    // Validate provider exists and is a worker
    const providerExists = await User.findById(provider);
    if (!providerExists || providerExists.role !== 'worker') {
      return sendResponse(res, 404, false, 'Provider not found or invalid');
    }

    // Check if provider is available at scheduled time
    const conflictingBooking = await Booking.findOne({
      provider,
      scheduledAt: {
        $gte: new Date(scheduledAt),
        $lte: new Date(new Date(scheduledAt).getTime() + serviceExists.duration * 60000)
      },
      status: { $in: ['pending', 'accepted', 'in-progress'] }
    });

    if (conflictingBooking) {
      return sendResponse(res, 400, false, 'Provider is not available at this time');
    }

    // Calculate total price including addons
    let totalPrice = price || serviceExists.price;
    let validatedAddons = [];

    if (addons && addons.length > 0) {
      for (const addonItem of addons) {
        const addon = await Addon.findById(addonItem.addonId);
        if (!addon || !addon.active) {
          return sendResponse(res, 400, false, `Addon ${addonItem.addonId} not found or inactive`);
        }
        
        const addonPrice = addon.price * (addonItem.quantity || 1);
        totalPrice += addonPrice;
        
        validatedAddons.push({
          addonId: addonItem.addonId,
          name: addon.name,
          quantity: addonItem.quantity || 1,
          price: addonPrice
        });
      }
    }

    const booking = await Booking.create({
      service,
      user: req.user.id,
      provider,
      scheduledAt,
      address,
      specialInstructions,
      addons: validatedAddons,
      price: totalPrice
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('service', 'title price category')
      .populate('user', 'name email phone')
      .populate('provider', 'name email phone');

    sendResponse(res, 201, true, 'Booking created successfully', { booking: populatedBooking });
  } catch (error) {
    console.error('Create booking error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private (Admin)
const updateBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const {
      status,
      scheduledAt,
      address,
      specialInstructions,
      providerNotes,
      customerNotes,
      cancellationReason,
      cancellationBy
    } = req.body;

    const updateFields = {};

    if (status) updateFields.status = status;
    if (scheduledAt) updateFields.scheduledAt = scheduledAt;
    if (address) updateFields.address = address;
    if (specialInstructions) updateFields.specialInstructions = specialInstructions;
    if (providerNotes) updateFields.providerNotes = providerNotes;
    if (customerNotes) updateFields.customerNotes = customerNotes;

    // Handle cancellation
    if (status === 'cancelled') {
      updateFields.cancellationReason = cancellationReason;
      updateFields.cancellationBy = cancellationBy || 'admin';
      updateFields.cancellationTime = new Date();
    }

    // Handle completion
    if (status === 'completed') {
      updateFields.completedAt = new Date();
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('service', 'title price category')
      .populate('user', 'name email phone')
      .populate('provider', 'name email phone');

    if (!booking) {
      return sendResponse(res, 404, false, 'Booking not found');
    }

    sendResponse(res, 200, true, 'Booking updated successfully', { booking });
  } catch (error) {
    console.error('Update booking error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private (Admin)
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    
    if (!booking) {
      return sendResponse(res, 404, false, 'Booking not found');
    }

    sendResponse(res, 200, true, 'Booking deleted successfully');
  } catch (error) {
    console.error('Delete booking error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get user's bookings
// @route   GET /api/bookings/me
// @access  Private (User)
const getMyBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const { skip, limit: limitNum } = paginateResults(page, limit);

    const filter = { user: req.user.id };
    if (status) {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .populate('service', 'title price category')
      .populate('provider', 'name email phone')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum);

    const total = await Booking.countDocuments(filter);

    sendResponse(res, 200, true, 'Your bookings retrieved successfully', {
      bookings,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get my bookings error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get specific user booking
// @route   GET /api/bookings/me/:id
// @access  Private (User)
const getMyBookingById = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user.id
    })
      .populate('service', 'title price category description')
      .populate('provider', 'name email phone');

    if (!booking) {
      return sendResponse(res, 404, false, 'Booking not found');
    }

    sendResponse(res, 200, true, 'Booking retrieved successfully', { booking });
  } catch (error) {
    console.error('Get my booking by ID error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get provider's bookings
// @route   GET /api/bookings/provider/me
// @access  Private (Worker)
const getProviderBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const { skip, limit: limitNum } = paginateResults(page, limit);

    const filter = { provider: req.user.id };
    if (status) {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .populate('service', 'title price category')
      .populate('user', 'name email phone')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum);

    const total = await Booking.countDocuments(filter);

    sendResponse(res, 200, true, 'Provider bookings retrieved successfully', {
      bookings,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get provider bookings error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Update booking status (Provider)
// @route   PUT /api/bookings/:id/status
// @access  Private (Worker)
const updateBookingStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { status, providerNotes } = req.body;

    const booking = await Booking.findOne({
      _id: req.params.id,
      provider: req.user.id
    });

    if (!booking) {
      return sendResponse(res, 404, false, 'Booking not found');
    }

    const updateFields = { status };
    if (providerNotes) updateFields.providerNotes = providerNotes;

    // Handle completion
    if (status === 'completed') {
      updateFields.completedAt = new Date();
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('service', 'title price category')
      .populate('user', 'name email phone')
      .populate('provider', 'name email phone');

    sendResponse(res, 200, true, 'Booking status updated successfully', { booking: updatedBooking });
  } catch (error) {
    console.error('Update booking status error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get booking statistics (Admin only)
// @route   GET /api/bookings/stats
// @access  Private (Admin)
const getBookingStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const bookingsByStatus = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$price' }
        }
      }
    ]);

    const recentBookings = await Booking.find()
      .sort('-createdAt')
      .limit(5)
      .populate('service', 'title category')
      .populate('user', 'name email')
      .populate('provider', 'name email')
      .select('status price scheduledAt createdAt');

    sendResponse(res, 200, true, 'Booking statistics retrieved successfully', {
      stats: {
        total: totalBookings,
        byStatus: bookingsByStatus
      },
      recentBookings
    });
  } catch (error) {
    console.error('Get booking stats error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

module.exports = {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  getMyBookings,
  getMyBookingById,
  getProviderBookings,
  updateBookingStatus,
  getBookingStats
};
