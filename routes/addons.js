const express = require('express');
const { body } = require('express-validator');
const { protect, authorize, optionalAuth } = require('../middlewares/authMiddleware');
const {
  getAddons,
  getAddonById,
  createAddon,
  updateAddon,
  deleteAddon
} = require('../controllers/addonController');

const router = express.Router();

// Validation rules
const createAddonValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('image')
    .optional()
    .isURL()
    .withMessage('Image must be a valid URL'),
  body('duration')
    .optional()
    .isInt({ min: 5 })
    .withMessage('Duration must be at least 5 minutes'),
  body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array'),
  body('requirements')
    .optional()
    .isArray()
    .withMessage('Requirements must be an array'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Notes cannot exceed 200 characters'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean')
];

const updateAddonValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('image')
    .optional()
    .isURL()
    .withMessage('Image must be a valid URL'),
  body('duration')
    .optional()
    .isInt({ min: 5 })
    .withMessage('Duration must be at least 5 minutes'),
  body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array'),
  body('requirements')
    .optional()
    .isArray()
    .withMessage('Requirements must be an array'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Notes cannot exceed 200 characters'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean')
];

// Public routes
router.get('/', getAddons);
router.get('/:id', getAddonById);

// Admin routes
router.post('/', protect, authorize('admin'), createAddonValidation, createAddon);
router.put('/:id', protect, authorize('admin'), updateAddonValidation, updateAddon);
router.delete('/:id', protect, authorize('admin'), deleteAddon);

module.exports = router;
