const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

const router = express.Router();

// Validation rules
const createCategoryValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  // body('icon')
  //   .trim()
  //   .optional()
  //   .withMessage('Icon is required'),
  body('image')
  .trim()
  .notEmpty()
  .withMessage('Image is required')
  .isString()
  .withMessage('Image must be a valid string'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean')
];

const updateCategoryValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  // body('icon')
  //   .optional()
  //   .trim()
  //   .optional()
  //   .withMessage('Icon cannot be empty'),
  body('image')
  .optional()
  .trim()
  .matches(/^\/uploads\/[a-zA-Z0-9/_\-.]+$/) // sirf /uploads/... path allow karega
  .withMessage('Image must be a valid upload path'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean')
];

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Admin routes
router.post('/', protect, authorize('admin'), createCategoryValidation, createCategory);
router.put('/:id', protect, authorize('admin'), updateCategoryValidation, updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

module.exports = router;
