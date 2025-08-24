const express = require('express');
const { body } = require('express-validator');
const { protect, authorize, optionalAuth } = require('../middlewares/authMiddleware');
const {
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
} = require('../controllers/reviewController');

const router = express.Router();

// Validation rules
const createReviewValidation = [
  body('booking')
    .isMongoId()
    .withMessage('Valid booking ID is required'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Comment must be between 10 and 500 characters')
];

const updateReviewValidation = [
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Comment must be between 10 and 500 characters')
];

const moderateReviewValidation = [
  body('isVerified')
    .optional()
    .isBoolean()
    .withMessage('isVerified must be a boolean'),
  body('adminResponse')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Admin response cannot exceed 500 characters')
];

const reportReviewValidation = [
  body('reason')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Report reason must be between 1 and 200 characters')
];

// Public routes
router.get('/', optionalAuth, getReviews);
router.get('/provider/:providerId', getReviewsByProvider);
router.get('/service/:serviceId', getReviewsByService);
router.get('/:id', optionalAuth, getReviewById);

// User routes
router.post('/', protect, authorize('user'), createReviewValidation, createReview);
router.put('/:id', protect, authorize('user'), updateReviewValidation, updateReview);
router.delete('/:id', protect, authorize('user'), deleteReview);
router.post('/:id/helpful', protect, authorize('user'), markReviewHelpful);
router.post('/:id/report', protect, authorize('user'), reportReviewValidation, reportReview);

// Admin routes
router.put('/:id/moderate', protect, authorize('admin'), moderateReviewValidation, moderateReview);

module.exports = router;
