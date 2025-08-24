const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { uploadIcon, uploadImage, handleUploadError } = require('../middlewares/uploadMiddleware');
const {
  uploadIcon: uploadIconController,
  uploadImage: uploadImageController,
  uploadMultiple,
  deleteFile,
  getFilesList
} = require('../controllers/uploadController');

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

// Upload routes
router.post('/icons', uploadIcon.single('icon'), handleUploadError, uploadIconController);
router.post('/images', uploadImage.single('image'), handleUploadError, uploadImageController);
router.post('/multiple', uploadImage.array('images', 10), handleUploadError, uploadMultiple);

// File management routes
router.get('/files', getFilesList);
router.delete('/:filename', deleteFile);

module.exports = router;
