const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { sendResponse, paginateResults, buildFilter, buildSort, generatePaymentRef } = require('../utils/helpers');
const { validationResult } = require('express-validator');

// @desc    Get all payments (Admin only)
// @route   GET /api/payments
// @access  Private (Admin)
const getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt', status, method, ...filters } = req.query;
    const { skip, limit: limitNum } = paginateResults(page, limit);
    const filter = buildFilter(filters);
    const sortObj = buildSort(sort);

    if (status) {
      filter.status = status;
    }

    if (method) {
      filter.method = method;
    }

    const payments = await Payment.find(filter)
      .populate('booking', 'service user provider status')
      .populate('user', 'name email phone')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await Payment.countDocuments(filter);

    sendResponse(res, 200, true, 'Payments retrieved successfully', {
      payments,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private (Admin)
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('booking', 'service user provider status scheduledAt')
      .populate('user', 'name email phone');

    if (!payment) {
      return sendResponse(res, 404, false, 'Payment not found');
    }

    sendResponse(res, 200, true, 'Payment retrieved successfully', { payment });
  } catch (error) {
    console.error('Get payment by ID error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Create payment
// @route   POST /api/payments
// @access  Private (User)
const createPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const {
      booking,
      amount,
      method,
      description
    } = req.body;

    // Validate booking exists and belongs to user
    const bookingExists = await Booking.findById(booking);
    if (!bookingExists) {
      return sendResponse(res, 404, false, 'Booking not found');
    }

    if (bookingExists.user.toString() !== req.user.id) {
      return sendResponse(res, 403, false, 'Not authorized to pay for this booking');
    }

    // Check if payment already exists for this booking
    const existingPayment = await Payment.findOne({ booking });
    if (existingPayment) {
      return sendResponse(res, 400, false, 'Payment already exists for this booking');
    }

    // Generate transaction ID
    const transactionId = generatePaymentRef();

    const payment = await Payment.create({
      booking,
      user: req.user.id,
      amount: amount || bookingExists.price,
      method,
      description: description || `Payment for booking ${booking}`,
      transactionId
    });

    const populatedPayment = await Payment.findById(payment._id)
      .populate('booking', 'service user provider status')
      .populate('user', 'name email phone');

    sendResponse(res, 201, true, 'Payment created successfully', { payment: populatedPayment });
  } catch (error) {
    console.error('Create payment error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Private (Admin)
const updatePayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const {
      status,
      gatewayResponse,
      refundAmount,
      refundReason
    } = req.body;

    const updateFields = {};

    if (status) updateFields.status = status;
    if (gatewayResponse) updateFields.gatewayResponse = gatewayResponse;

    // Handle refund
    if (status === 'refunded') {
      updateFields.refundAmount = refundAmount;
      updateFields.refundReason = refundReason;
      updateFields.refundedAt = new Date();
    }

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('booking', 'service user provider status')
      .populate('user', 'name email phone');

    if (!payment) {
      return sendResponse(res, 404, false, 'Payment not found');
    }

    // Update booking payment status if payment is successful
    if (status === 'paid') {
      await Booking.findByIdAndUpdate(payment.booking._id, {
        paymentStatus: 'paid'
      });
    }

    sendResponse(res, 200, true, 'Payment updated successfully', { payment });
  } catch (error) {
    console.error('Update payment error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private (Admin)
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    
    if (!payment) {
      return sendResponse(res, 404, false, 'Payment not found');
    }

    sendResponse(res, 200, true, 'Payment deleted successfully');
  } catch (error) {
    console.error('Delete payment error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get user's payments
// @route   GET /api/payments/me
// @access  Private (User)
const getMyPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const { skip, limit: limitNum } = paginateResults(page, limit);

    const filter = { user: req.user.id };
    if (status) {
      filter.status = status;
    }

    const payments = await Payment.find(filter)
      .populate('booking', 'service user provider status')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum);

    const total = await Payment.countDocuments(filter);

    sendResponse(res, 200, true, 'Your payments retrieved successfully', {
      payments,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get my payments error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get specific user payment
// @route   GET /api/payments/me/:id
// @access  Private (User)
const getMyPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      user: req.user.id
    })
      .populate('booking', 'service user provider status scheduledAt')
      .populate('user', 'name email phone');

    if (!payment) {
      return sendResponse(res, 404, false, 'Payment not found');
    }

    sendResponse(res, 200, true, 'Payment retrieved successfully', { payment });
  } catch (error) {
    console.error('Get my payment by ID error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Process payment (simulate payment gateway)
// @route   POST /api/payments/:id/process
// @access  Private (Admin)
const processPayment = async (req, res) => {
  try {
    const { status, gatewayResponse } = req.body;

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return sendResponse(res, 404, false, 'Payment not found');
    }

    // Simulate payment processing
    const updateFields = {
      status: status || 'paid',
      gatewayResponse: gatewayResponse || {
        transactionId: payment.transactionId,
        status: 'success',
        timestamp: new Date().toISOString()
      }
    };

    const updatedPayment = await Payment.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('booking', 'service user provider status')
      .populate('user', 'name email phone');

    // Update booking payment status
    if (status === 'paid') {
      await Booking.findByIdAndUpdate(payment.booking, {
        paymentStatus: 'paid'
      });
    }

    sendResponse(res, 200, true, 'Payment processed successfully', { payment: updatedPayment });
  } catch (error) {
    console.error('Process payment error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Refund payment
// @route   POST /api/payments/:id/refund
// @access  Private (Admin)
const refundPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { refundAmount, refundReason } = req.body;

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return sendResponse(res, 404, false, 'Payment not found');
    }

    if (payment.status !== 'paid') {
      return sendResponse(res, 400, false, 'Payment must be paid to refund');
    }

    const refundAmountNum = parseFloat(refundAmount);
    if (refundAmountNum > payment.amount) {
      return sendResponse(res, 400, false, 'Refund amount cannot exceed payment amount');
    }

    const updateFields = {
      status: 'refunded',
      refundAmount: refundAmountNum,
      refundReason,
      refundedAt: new Date()
    };

    const updatedPayment = await Payment.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('booking', 'service user provider status')
      .populate('user', 'name email phone');

    // Update booking payment status
    await Booking.findByIdAndUpdate(payment.booking, {
      paymentStatus: 'refunded'
    });

    sendResponse(res, 200, true, 'Payment refunded successfully', { payment: updatedPayment });
  } catch (error) {
    console.error('Refund payment error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get payment statistics (Admin only)
// @route   GET /api/payments/stats
// @access  Private (Admin)
const getPaymentStats = async (req, res) => {
  try {
    const totalPayments = await Payment.countDocuments();
    const totalAmount = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const paymentsByStatus = await Payment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const paymentsByMethod = await Payment.aggregate([
      {
        $group: {
          _id: '$method',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const recentPayments = await Payment.find()
      .sort('-createdAt')
      .limit(5)
      .populate('booking', 'service user provider')
      .populate('user', 'name email')
      .select('amount method status createdAt');

    sendResponse(res, 200, true, 'Payment statistics retrieved successfully', {
      stats: {
        total: totalPayments,
        totalAmount: totalAmount[0]?.total || 0,
        byStatus: paymentsByStatus,
        byMethod: paymentsByMethod
      },
      recentPayments
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

module.exports = {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getMyPayments,
  getMyPaymentById,
  processPayment,
  refundPayment,
  getPaymentStats
};
