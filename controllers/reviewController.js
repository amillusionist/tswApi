const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const { sendResponse, paginateResults, buildFilter, buildSort } = require('../utils/helpers');
const { validationResult } = require('express-validator');

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Public
const getReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt', provider, service, rating, ...filters } = req.query;
    const { skip, limit: limitNum } = paginateResults(page, limit);
    const filter = buildFilter(filters);
    const sortObj = buildSort(sort);

    if (provider) {
      filter.provider = provider;
    }

    if (service) {
      filter.service = service;
    }

    if (rating) {
      filter.rating = parseInt(rating);
    }

    // Only show verified reviews for public access
    if (req.user?.role !== 'admin') {
      filter.isVerified = true;
      filter.isReported = false;
    }

    const reviews = await Review.find(filter)
      .populate('reviewer', 'name')
      .populate('provider', 'name')
      .populate('service', 'title category')
      .populate('booking', 'scheduledAt')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await Review.countDocuments(filter);

    sendResponse(res, 200, true, 'Reviews retrieved successfully', {
      reviews,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get review by ID
// @route   GET /api/reviews/:id
// @access  Public
const getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('reviewer', 'name')
      .populate('provider', 'name')
      .populate('service', 'title category')
      .populate('booking', 'scheduledAt');

    if (!review) {
      return sendResponse(res, 404, false, 'Review not found');
    }

    // Check if review is verified for non-admin users
    if (!review.isVerified && req.user?.role !== 'admin') {
      return sendResponse(res, 404, false, 'Review not found');
    }

    sendResponse(res, 200, true, 'Review retrieved successfully', { review });
  } catch (error) {
    console.error('Get review by ID error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Create review
// @route   POST /api/reviews
// @access  Private (User)
const createReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const {
      booking,
      rating,
      comment
    } = req.body;

    // Validate booking exists and belongs to user
    const bookingExists = await Booking.findById(booking);
    if (!bookingExists) {
      return sendResponse(res, 404, false, 'Booking not found');
    }

    if (bookingExists.user.toString() !== req.user.id) {
      return sendResponse(res, 403, false, 'Not authorized to review this booking');
    }

    // Check if booking is completed
    if (bookingExists.status !== 'completed') {
      return sendResponse(res, 400, false, 'Can only review completed bookings');
    }

    // Check if review already exists for this booking
    const existingReview = await Review.findOne({ booking });
    if (existingReview) {
      return sendResponse(res, 400, false, 'Review already exists for this booking');
    }

    const review = await Review.create({
      booking,
      reviewer: req.user.id,
      provider: bookingExists.provider,
      service: bookingExists.service,
      rating,
      comment
    });

    const populatedReview = await Review.findById(review._id)
      .populate('reviewer', 'name')
      .populate('provider', 'name')
      .populate('service', 'title category')
      .populate('booking', 'scheduledAt');

    // Update service rating
    await updateServiceRating(bookingExists.service);

    sendResponse(res, 201, true, 'Review created successfully', { review: populatedReview });
  } catch (error) {
    console.error('Create review error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private (User - own review only)
const updateReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { rating, comment } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      return sendResponse(res, 404, false, 'Review not found');
    }

    // Check if user owns the review or is admin
    if (review.reviewer.toString() !== req.user.id && req.user.role !== 'admin') {
      return sendResponse(res, 403, false, 'Not authorized to update this review');
    }

    const updateFields = {};
    if (rating) updateFields.rating = rating;
    if (comment) updateFields.comment = comment;

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('reviewer', 'name')
      .populate('provider', 'name')
      .populate('service', 'title category')
      .populate('booking', 'scheduledAt');

    // Update service rating
    await updateServiceRating(review.service);

    sendResponse(res, 200, true, 'Review updated successfully', { review: updatedReview });
  } catch (error) {
    console.error('Update review error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private (User - own review only, Admin)
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return sendResponse(res, 404, false, 'Review not found');
    }

    // Check if user owns the review or is admin
    if (review.reviewer.toString() !== req.user.id && req.user.role !== 'admin') {
      return sendResponse(res, 403, false, 'Not authorized to delete this review');
    }

    await Review.findByIdAndDelete(req.params.id);

    // Update service rating
    await updateServiceRating(review.service);

    sendResponse(res, 200, true, 'Review deleted successfully');
  } catch (error) {
    console.error('Delete review error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Mark review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Private (User)
const markReviewHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return sendResponse(res, 404, false, 'Review not found');
    }

    const userId = req.user.id;
    const helpfulUsers = review.isHelpful.users;

    if (helpfulUsers.includes(userId)) {
      // Remove from helpful
      helpfulUsers.pull(userId);
      review.isHelpful.count = Math.max(0, review.isHelpful.count - 1);
    } else {
      // Add to helpful
      helpfulUsers.push(userId);
      review.isHelpful.count += 1;
    }

    await review.save();

    sendResponse(res, 200, true, 'Review helpful status updated', { 
      isHelpful: review.isHelpful.count,
      hasMarkedHelpful: helpfulUsers.includes(userId)
    });
  } catch (error) {
    console.error('Mark review helpful error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Report review
// @route   POST /api/reviews/:id/report
// @access  Private (User)
const reportReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { reason } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      return sendResponse(res, 404, false, 'Review not found');
    }

    // Check if user already reported this review
    if (review.isReported) {
      return sendResponse(res, 400, false, 'Review already reported');
    }

    review.isReported = true;
    review.reportReason = reason;
    await review.save();

    sendResponse(res, 200, true, 'Review reported successfully');
  } catch (error) {
    console.error('Report review error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get reviews by provider
// @route   GET /api/reviews/provider/:providerId
// @access  Public
const getReviewsByProvider = async (req, res) => {
  try {
    const { page = 1, limit = 10, rating } = req.query;
    const { skip, limit: limitNum } = paginateResults(page, limit);

    const filter = { provider: req.params.providerId };
    if (rating) {
      filter.rating = parseInt(rating);
    }

    // Only show verified reviews for public access
    if (req.user?.role !== 'admin') {
      filter.isVerified = true;
      filter.isReported = false;
    }

    const reviews = await Review.find(filter)
      .populate('reviewer', 'name')
      .populate('service', 'title category')
      .populate('booking', 'scheduledAt')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum);

    const total = await Review.countDocuments(filter);

    // Calculate average rating
    const avgRating = await Review.aggregate([
      { $match: filter },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    sendResponse(res, 200, true, 'Provider reviews retrieved successfully', {
      reviews,
      stats: {
        total,
        averageRating: avgRating[0]?.avgRating || 0
      },
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get reviews by provider error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get reviews by service
// @route   GET /api/reviews/service/:serviceId
// @access  Public
const getReviewsByService = async (req, res) => {
  try {
    const { page = 1, limit = 10, rating } = req.query;
    const { skip, limit: limitNum } = paginateResults(page, limit);

    const filter = { service: req.params.serviceId };
    if (rating) {
      filter.rating = parseInt(rating);
    }

    // Only show verified reviews for public access
    if (req.user?.role !== 'admin') {
      filter.isVerified = true;
      filter.isReported = false;
    }

    const reviews = await Review.find(filter)
      .populate('reviewer', 'name')
      .populate('provider', 'name')
      .populate('booking', 'scheduledAt')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum);

    const total = await Review.countDocuments(filter);

    // Calculate average rating
    const avgRating = await Review.aggregate([
      { $match: filter },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    sendResponse(res, 200, true, 'Service reviews retrieved successfully', {
      reviews,
      stats: {
        total,
        averageRating: avgRating[0]?.avgRating || 0
      },
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get reviews by service error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Moderate review (Admin only)
// @route   PUT /api/reviews/:id/moderate
// @access  Private (Admin)
const moderateReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { isVerified, adminResponse } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      return sendResponse(res, 404, false, 'Review not found');
    }

    const updateFields = {};
    if (typeof isVerified === 'boolean') updateFields.isVerified = isVerified;
    if (adminResponse) updateFields.adminResponse = adminResponse;

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('reviewer', 'name')
      .populate('provider', 'name')
      .populate('service', 'title category')
      .populate('booking', 'scheduledAt');

    sendResponse(res, 200, true, 'Review moderated successfully', { review: updatedReview });
  } catch (error) {
    console.error('Moderate review error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// Helper function to update service rating
const updateServiceRating = async (serviceId) => {
  try {
    const reviews = await Review.find({ 
      service: serviceId, 
      isVerified: true,
      isReported: false
    });

    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
      
      await Service.findByIdAndUpdate(serviceId, {
        'rating.average': Math.round(avgRating * 10) / 10,
        'rating.count': reviews.length
      });
    }
  } catch (error) {
    console.error('Update service rating error:', error);
  }
};

module.exports = {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  reportReview,
  getReviewsByProvider,
  getReviewsByService,
  moderateReview
};
