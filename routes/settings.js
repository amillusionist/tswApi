const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  getAppSettings,
  updateAppSettings
} = require('../controllers/metaController');

const router = express.Router();

// Validation rules for settings update
const updateSettingsValidation = [
  body('value')
    .isObject()
    .withMessage('Value must be an object'),
  body('value.maintenanceMode')
    .optional()
    .isBoolean()
    .withMessage('Maintenance mode must be a boolean'),
  body('value.version')
    .optional()
    .isString()
    .withMessage('Version must be a string'),
  body('value.features')
    .optional()
    .isObject()
    .withMessage('Features must be an object'),
  body('value.features.booking')
    .optional()
    .isBoolean()
    .withMessage('Booking feature must be a boolean'),
  body('value.features.payments')
    .optional()
    .isBoolean()
    .withMessage('Payments feature must be a boolean'),
  body('value.features.reviews')
    .optional()
    .isBoolean()
    .withMessage('Reviews feature must be a boolean'),
  body('value.features.notifications')
    .optional()
    .isBoolean()
    .withMessage('Notifications feature must be a boolean')
];

// Routes
router.get('/', getAppSettings);
router.put('/', protect, authorize('admin'), updateSettingsValidation, updateAppSettings);

module.exports = router;
