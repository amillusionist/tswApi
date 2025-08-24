const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  getMe,
  updateMe,
  createUser,
  createAdmin,
  createPartner,
  getUsers,
  getPartners,
  getAdmins,
  getCustomers,
  getUserById,
  updateUser,
  toggleUserBlock,
  changeUserRole,
  deleteUser,
  getUserStats
} = require('../controllers/userController');

const router = express.Router();

// Validation rules
const updateMeValidation = [
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

const createUserValidation = [
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
    .withMessage('Password must be at least 6 characters'),
  body('phone')
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit phone number'),
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'user', 'worker'])
    .withMessage('Invalid role')
];

const createPartnerValidation = [
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
    .withMessage('Password must be at least 6 characters'),
  body('phone')
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit phone number'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  body('skills.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Skill cannot exceed 50 characters'),
  body('experience')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Experience cannot be negative'),
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
    .withMessage('Max bookings per day must be at least 1')
];

const updateUserValidation = [
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
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'user', 'worker'])
    .withMessage('Invalid role'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  body('skills.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Skill cannot exceed 50 characters'),
  body('experience')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Experience cannot be negative')
];

const blockUserValidation = [
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

const changeRoleValidation = [
  body('role')
    .isIn(['admin', 'manager', 'user', 'worker'])
    .withMessage('Invalid role')
];

// Routes
// Current user routes
router.get('/me', protect, getMe);
router.put('/me', protect, updateMeValidation, updateMe);

// Admin routes for user management
router.post('/', protect, authorize('admin'), createUserValidation, createUser);
router.post('/admin', protect, authorize('admin'), createUserValidation, createAdmin);
router.post('/partner', protect, authorize('admin'), createPartnerValidation, createPartner);

// Get users by type
router.get('/', protect, authorize('admin', 'manager'), getUsers);
router.get('/partners', protect, authorize('admin', 'manager'), getPartners);
router.get('/admins', protect, authorize('admin'), getAdmins);
router.get('/customers', protect, authorize('admin', 'manager'), getCustomers);

// User management routes
router.get('/stats', protect, authorize('admin'), getUserStats);
router.get('/:id', protect, authorize('admin', 'manager', 'worker'), getUserById);
router.put('/:id', protect, authorize('admin'), updateUserValidation, updateUser);
router.put('/:id/block', protect, authorize('admin'), blockUserValidation, toggleUserBlock);
router.put('/:id/role', protect, authorize('admin'), changeRoleValidation, changeUserRole);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
