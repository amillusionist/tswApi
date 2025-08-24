const express = require('express');
const { body } = require('express-validator');
const { protect, authorize, optionalAuth } = require('../middlewares/authMiddleware');
const {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getServiceCategories,
  searchServices,
  getServiceStats,
  getFeaturedServices,
  getPopularServices
} = require('../controllers/serviceController');

const router = express.Router();

// Validation rules for create service
const createServiceValidation = [
  body('categoryId')
    .isMongoId()
    .withMessage('Valid category ID is required'),
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('originalPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Original price must be a positive number'),
  body('featuredImage')
    .trim()
    .isURL()
    .withMessage('Featured image must be a valid URL'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('images.*.imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be valid'),
  body('images.*.altText')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Alt text cannot exceed 100 characters'),
  body('addons')
    .optional()
    .isArray()
    .withMessage('Addons must be an array'),
  body('addons.*.addonId')
    .optional()
    .isMongoId()
    .withMessage('Valid addon ID is required'),
  body('addons.*.isRequired')
    .optional()
    .isBoolean()
    .withMessage('isRequired must be a boolean'),
  body('addons.*.defaultQuantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Default quantity must be at least 1'),
  body('duration')
    .isInt({ min: 15 })
    .withMessage('Duration must be at least 15 minutes'),
  body('pincodes')
    .optional()
    .isArray()
    .withMessage('Pincodes must be an array'),
  body('pincodes.*')
    .optional()
    .matches(/^\d{6}$/)
    .withMessage('Each pincode must be 6 digits'),
  body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array'),
  body('features.*')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Feature cannot exceed 100 characters'),
  body('requirements')
    .optional()
    .isArray()
    .withMessage('Requirements must be an array'),
  body('requirements.*')
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage('Requirement cannot exceed 150 characters'),
  body('instructions')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Instructions cannot exceed 500 characters'),
  body('cancellationPolicy')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Cancellation policy cannot exceed 300 characters'),
  body('availability.isAvailable')
    .optional()
    .isBoolean()
    .withMessage('isAvailable must be a boolean'),
  body('availability.availableDays')
    .optional()
    .isArray()
    .withMessage('Available days must be an array'),
  body('availability.availableDays.*')
    .optional()
    .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .withMessage('Invalid day of week'),
  body('availability.availableTimeSlots')
    .optional()
    .isArray()
    .withMessage('Available time slots must be an array'),
  body('availability.availableTimeSlots.*.startTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('availability.availableTimeSlots.*.endTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  body('availability.maxBookingsPerDay')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max bookings per day must be at least 1'),
  body('provider.providerId')
    .optional()
    .isMongoId()
    .withMessage('Valid provider ID is required'),
  body('provider.providerName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Provider name cannot exceed 100 characters'),
  body('provider.providerRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Provider rating must be between 0 and 5'),
  body('provider.providerExperience')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Provider experience cannot be negative'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Tag cannot exceed 30 characters'),
  body('seo.metaTitle')
    .optional()
    .trim()
    .isLength({ max: 60 })
    .withMessage('Meta title cannot exceed 60 characters'),
  body('seo.metaDescription')
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage('Meta description cannot exceed 160 characters'),
  body('seo.keywords')
    .optional()
    .isArray()
    .withMessage('Keywords must be an array'),
  body('seo.keywords.*')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Keyword cannot exceed 30 characters'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean'),
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean'),
  body('popular')
    .optional()
    .isBoolean()
    .withMessage('Popular must be a boolean')
];

// Validation rules for update service (all fields optional)
const updateServiceValidation = [
  body('categoryId')
    .optional()
    .isMongoId()
    .withMessage('Valid category ID is required'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('originalPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Original price must be a positive number'),
  body('featuredImage')
    .optional()
    .trim()
    .isURL()
    .withMessage('Featured image must be a valid URL'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('images.*.imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be valid'),
  body('images.*.altText')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Alt text cannot exceed 100 characters'),
  body('addons')
    .optional()
    .isArray()
    .withMessage('Addons must be an array'),
  body('addons.*.addonId')
    .optional()
    .isMongoId()
    .withMessage('Valid addon ID is required'),
  body('addons.*.isRequired')
    .optional()
    .isBoolean()
    .withMessage('isRequired must be a boolean'),
  body('addons.*.defaultQuantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Default quantity must be at least 1'),
  body('duration')
    .optional()
    .isInt({ min: 15 })
    .withMessage('Duration must be at least 15 minutes'),
  body('pincodes')
    .optional()
    .isArray()
    .withMessage('Pincodes must be an array'),
  body('pincodes.*')
    .optional()
    .matches(/^\d{6}$/)
    .withMessage('Each pincode must be 6 digits'),
  body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array'),
  body('features.*')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Feature cannot exceed 100 characters'),
  body('requirements')
    .optional()
    .isArray()
    .withMessage('Requirements must be an array'),
  body('requirements.*')
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage('Requirement cannot exceed 150 characters'),
  body('instructions')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Instructions cannot exceed 500 characters'),
  body('cancellationPolicy')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Cancellation policy cannot exceed 300 characters'),
  body('availability.isAvailable')
    .optional()
    .isBoolean()
    .withMessage('isAvailable must be a boolean'),
  body('availability.availableDays')
    .optional()
    .isArray()
    .withMessage('Available days must be an array'),
  body('availability.availableDays.*')
    .optional()
    .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .withMessage('Invalid day of week'),
  body('availability.availableTimeSlots')
    .optional()
    .isArray()
    .withMessage('Available time slots must be an array'),
  body('availability.availableTimeSlots.*.startTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('availability.availableTimeSlots.*.endTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  body('availability.maxBookingsPerDay')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max bookings per day must be at least 1'),
  body('provider.providerId')
    .optional()
    .isMongoId()
    .withMessage('Valid provider ID is required'),
  body('provider.providerName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Provider name cannot exceed 100 characters'),
  body('provider.providerRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Provider rating must be between 0 and 5'),
  body('provider.providerExperience')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Provider experience cannot be negative'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Tag cannot exceed 30 characters'),
  body('seo.metaTitle')
    .optional()
    .trim()
    .isLength({ max: 60 })
    .withMessage('Meta title cannot exceed 60 characters'),
  body('seo.metaDescription')
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage('Meta description cannot exceed 160 characters'),
  body('seo.keywords')
    .optional()
    .isArray()
    .withMessage('Keywords must be an array'),
  body('seo.keywords.*')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Keyword cannot exceed 30 characters'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean'),
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean'),
  body('popular')
    .optional()
    .isBoolean()
    .withMessage('Popular must be a boolean')
];

// Public routes
router.get('/', optionalAuth, getServices);
router.get('/categories', getServiceCategories);
router.get('/search', searchServices);
router.get('/featured', getFeaturedServices);
router.get('/popular', getPopularServices);
router.get('/:id', optionalAuth, getServiceById);

// Protected routes
router.post('/', protect, authorize('admin', 'manager'), createServiceValidation, createService);
router.put('/:id', protect, authorize('admin'), updateServiceValidation, updateService);
router.delete('/:id', protect, authorize('admin'), deleteService);
router.get('/stats', protect, authorize('admin'), getServiceStats);

module.exports = router;
