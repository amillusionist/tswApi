const { sendResponse } = require('../utils/helpers');
const path = require('path');

// @desc    Upload icon
// @route   POST /api/upload/icons
// @access  Admin
const uploadIcon = async (req, res) => {
  try {
    if (!req.file) {
      return sendResponse(res, 400, false, 'No file uploaded');
    }

    // Generate the URL for the uploaded file
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/icons/${req.file.filename}`;

    sendResponse(res, 200, true, 'Icon uploaded successfully', {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      url: fileUrl,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Upload icon error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Upload image
// @route   POST /api/upload/images
// @access  Admin
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return sendResponse(res, 400, false, 'No file uploaded');
    }

    // Generate the URL for the uploaded file
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/images/${req.file.filename}`;

    sendResponse(res, 200, true, 'Image uploaded successfully', {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      url: fileUrl,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Upload image error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Upload multiple images
// @route   POST /api/upload/multiple
// @access  Admin
const uploadMultiple = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return sendResponse(res, 400, false, 'No files uploaded');
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const uploadedFiles = req.files.map(file => {
      const fileUrl = `${baseUrl}/uploads/images/${file.filename}`;
      return {
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        url: fileUrl,
        mimetype: file.mimetype
      };
    });

    sendResponse(res, 200, true, `${uploadedFiles.length} files uploaded successfully`, {
      files: uploadedFiles,
      count: uploadedFiles.length
    });
  } catch (error) {
    console.error('Upload multiple files error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Delete uploaded file
// @route   DELETE /api/upload/:filename
// @access  Admin
const deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const fs = require('fs');
    const path = require('path');

    // Check if file exists in icons directory
    let filePath = path.join(__dirname, '../public/uploads/icons', filename);
    if (!fs.existsSync(filePath)) {
      // Check if file exists in images directory
      filePath = path.join(__dirname, '../public/uploads/images', filename);
      if (!fs.existsSync(filePath)) {
        return sendResponse(res, 404, false, 'File not found');
      }
    }

    // Delete the file
    fs.unlinkSync(filePath);

    sendResponse(res, 200, true, 'File deleted successfully');
  } catch (error) {
    console.error('Delete file error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get uploaded files list
// @route   GET /api/upload/files
// @access  Admin
const getFilesList = async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const { type = 'all' } = req.query;

    const iconsDir = path.join(__dirname, '../public/uploads/icons');
    const imagesDir = path.join(__dirname, '../public/uploads/images');
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    let files = [];

    if (type === 'all' || type === 'icons') {
      if (fs.existsSync(iconsDir)) {
        const iconFiles = fs.readdirSync(iconsDir)
          .filter(file => !file.startsWith('.'))
          .map(filename => ({
            filename,
            type: 'icon',
                         url: `${baseUrl}/uploads/icons/${filename}`,
             path: `/uploads/icons/${filename}`
          }));
        files = files.concat(iconFiles);
      }
    }

    if (type === 'all' || type === 'images') {
      if (fs.existsSync(imagesDir)) {
        const imageFiles = fs.readdirSync(imagesDir)
          .filter(file => !file.startsWith('.'))
          .map(filename => ({
            filename,
            type: 'image',
                         url: `${baseUrl}/uploads/images/${filename}`,
             path: `/uploads/images/${filename}`
          }));
        files = files.concat(imageFiles);
      }
    }

    sendResponse(res, 200, true, 'Files list retrieved successfully', {
      files,
      count: files.length
    });
  } catch (error) {
    console.error('Get files list error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

module.exports = {
  uploadIcon,
  uploadImage,
  uploadMultiple,
  deleteFile,
  getFilesList
};
