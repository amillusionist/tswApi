const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getMyPayments,
  getMyPaymentById,
  processPayment,
  refundPayment,
  getPaymentStats
} = require('../controllers/paymentController');

const router = express.Router();

// Validation rules
const createPaymentValidation = [
  body('booking')
    .isMongoId()
    .withMessage('Valid booking ID is required'),
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('method')
    .isIn(['card', 'cash', 'wallet', 'upi', 'netbanking'])
    .withMessage('Invalid payment method'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters')
];

const updatePaymentValidation = [
  body('status')
    .optional()
    .isIn(['pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled'])
    .withMessage('Invalid status'),
  body('gatewayResponse')
    .optional()
    .isObject()
    .withMessage('Gateway response must be an object'),
  body('refundAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Refund amount must be a positive number'),
  body('refundReason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Refund reason cannot exceed 200 characters')
];

const processPaymentValidation = [
  body('status')
    .optional()
    .isIn(['pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled'])
    .withMessage('Invalid status'),
  body('gatewayResponse')
    .optional()
    .isObject()
    .withMessage('Gateway response must be an object')
];

const refundPaymentValidation = [
  body('refundAmount')
    .isFloat({ min: 0 })
    .withMessage('Refund amount must be a positive number'),
  body('refundReason')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Refund reason must be between 1 and 200 characters')
];

// Admin routes
router.get('/', protect, authorize('admin'), getPayments);
router.get('/stats', protect, authorize('admin'), getPaymentStats);
router.get('/:id', protect, authorize('admin'), getPaymentById);
router.put('/:id', protect, authorize('admin'), updatePaymentValidation, updatePayment);
router.delete('/:id', protect, authorize('admin'), deletePayment);
router.post('/:id/process', protect, authorize('admin'), processPaymentValidation, processPayment);
router.post('/:id/refund', protect, authorize('admin'), refundPaymentValidation, refundPayment);

// User routes
router.post('/', protect, authorize('user'), createPaymentValidation, createPayment);
router.get('/me', protect, authorize('user'), getMyPayments);
router.get('/me/:id', protect, authorize('user'), getMyPaymentById);

module.exports = router;
