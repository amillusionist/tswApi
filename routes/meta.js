const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  getMetaData,
  createOrUpdateMetaData,
  deleteMetaData,
  getAllMetaData,
  getPublicMetaData,
  getMetaDataCategories,
  bulkUpdateMetaData,
  initializeDefaultMetaData
} = require('../controllers/metaController');

const router = express.Router();

// Validation rules
const createOrUpdateMetaDataValidation = [
  body('value')
    .notEmpty()
    .withMessage('Value is required'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  body('category')
    .optional()
    .isIn(['system', 'content', 'configuration', 'contact', 'legal'])
    .withMessage('Invalid category')
];

const bulkUpdateValidation = [
  body('updates')
    .isArray({ min: 1 })
    .withMessage('Updates must be a non-empty array'),
  body('updates.*.key')
    .notEmpty()
    .withMessage('Key is required for each update'),
  body('updates.*.value')
    .notEmpty()
    .withMessage('Value is required for each update'),
  body('updates.*.description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
  body('updates.*.isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  body('updates.*.category')
    .optional()
    .isIn(['system', 'content', 'configuration', 'contact', 'legal'])
    .withMessage('Invalid category')
];

// Public routes
router.get('/public/all', getPublicMetaData);
router.get('/categories', getMetaDataCategories);
router.get('/:key', getMetaData);

// Admin routes
router.get('/', protect, authorize('admin'), getAllMetaData);
router.post('/:key', protect, authorize('admin'), createOrUpdateMetaDataValidation, createOrUpdateMetaData);
router.delete('/:key', protect, authorize('admin'), deleteMetaData);
router.put('/bulk', protect, authorize('admin'), bulkUpdateValidation, bulkUpdateMetaData);
router.post('/init', protect, authorize('admin'), initializeDefaultMetaData);

module.exports = router;
