const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
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
} = require('../controllers/bookingController');

const router = express.Router();

// Validation rules
const createBookingValidation = [
  body('service')
    .isMongoId()
    .withMessage('Valid service ID is required'),
  body('provider')
    .isMongoId()
    .withMessage('Valid provider ID is required'),
  body('scheduledAt')
    .isISO8601()
    .withMessage('Valid scheduled date and time is required'),
  body('address.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  body('address.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('address.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('address.zipCode')
    .trim()
    .notEmpty()
    .withMessage('Zip code is required'),
  body('specialInstructions')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Special instructions cannot exceed 500 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('addons')
    .optional()
    .isArray()
    .withMessage('Addons must be an array'),
  body('addons.*.addonId')
    .optional()
    .isMongoId()
    .withMessage('Valid addon ID is required'),
  body('addons.*.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1')
];

const updateBookingValidation = [
  body('status')
    .optional()
    .isIn(['pending', 'accepted', 'in-progress', 'completed', 'cancelled', 'rejected'])
    .withMessage('Invalid status'),
  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('Valid scheduled date and time is required'),
  body('address.street')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Street address cannot be empty'),
  body('address.city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('City cannot be empty'),
  body('address.state')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('State cannot be empty'),
  body('address.zipCode')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Zip code cannot be empty'),
  body('specialInstructions')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Special instructions cannot exceed 500 characters'),
  body('providerNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Provider notes cannot exceed 500 characters'),
  body('customerNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Customer notes cannot exceed 500 characters'),
  body('cancellationReason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Cancellation reason cannot exceed 200 characters'),
  body('cancellationBy')
    .optional()
    .isIn(['user', 'provider', 'admin'])
    .withMessage('Invalid cancellation by value')
];

const updateStatusValidation = [
  body('status')
    .isIn(['pending', 'accepted', 'in-progress', 'completed', 'cancelled', 'rejected'])
    .withMessage('Invalid status'),
  body('providerNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Provider notes cannot exceed 500 characters')
];

// Admin routes
router.get('/', protect, authorize('admin'), getBookings);
router.get('/stats', protect, authorize('admin'), getBookingStats);
router.get('/:id', protect, authorize('admin'), getBookingById);
router.put('/:id', protect, authorize('admin'), updateBookingValidation, updateBooking);
router.delete('/:id', protect, authorize('admin'), deleteBooking);

// User routes
router.post('/', protect, authorize('user'), createBookingValidation, createBooking);
router.get('/me', protect, authorize('user'), getMyBookings);
router.get('/me/:id', protect, authorize('user'), getMyBookingById);

// Provider routes
router.get('/provider/me', protect, authorize('worker'), getProviderBookings);
router.put('/:id/status', protect, authorize('worker'), updateStatusValidation, updateBookingStatus);

module.exports = router;
