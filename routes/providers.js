const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  registerProvider,
  getProviders,
  getProviderById,
  updateProvider,
  deleteProvider,
  getMyProviderProfile,
  updateMyProviderProfile,
  getAvailableProviders,
  getProviderStats
} = require('../controllers/providerController');

const router = express.Router();

// Validation rules
const registerProviderValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone')
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit phone number')
];

const updateProviderValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit phone number'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

const updateMyProviderValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit phone number')
];

// Public routes
router.post('/register', registerProviderValidation, registerProvider);
router.get('/available', getAvailableProviders);

// Admin routes
router.get('/', protect, authorize('admin'), getProviders);
router.get('/stats', protect, authorize('admin'), getProviderStats);
router.get('/:id', protect, authorize('admin', 'user'), getProviderById);
router.put('/:id', protect, authorize('admin'), updateProviderValidation, updateProvider);
router.delete('/:id', protect, authorize('admin'), deleteProvider);

// Provider routes
router.get('/me', protect, authorize('worker'), getMyProviderProfile);
router.put('/me', protect, authorize('worker'), updateMyProviderValidation, updateMyProviderProfile);

module.exports = router;
