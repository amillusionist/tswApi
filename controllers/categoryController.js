const Category = require('../models/Category');
const { sendResponse, paginateResults } = require('../utils/helpers');
const { validationResult } = require('express-validator');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, active, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build query
    let query = {};

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Filter by active status
    if (active !== undefined) {
      query.active = active === 'true';
    }

    // Execute query with pagination
    const { skip, limit: limitNum } = paginateResults(page, limit);
    
    const categories = await Category.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Category.countDocuments(query);

    sendResponse(res, 200, true, 'Categories retrieved successfully', {
      categories,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return sendResponse(res, 404, false, 'Category not found');
    }

    sendResponse(res, 200, true, 'Category retrieved successfully', category);
  } catch (error) {
    console.error('Get category by ID error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Admin
const createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { name, description, icon, image, active } = req.body;

    // Check if category with same name already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return sendResponse(res, 400, false, 'Category with this name already exists');
    }

    // Create category
    const category = await Category.create({
      name,
      description,
      icon: '',
      image: image.replace(/^https?:\/\/[^/]+/, ''), // sirf relative path rakhega,
      active: active !== undefined ? active : true
    });

    sendResponse(res, 201, true, 'Category created successfully', category);
  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === 11000) {
      return sendResponse(res, 400, false, 'Category with this name already exists');
    }
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Admin
const updateCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return sendResponse(res, 404, false, 'Category not found');
    }

    // Check if name is being updated and if it conflicts with existing category
    if (req.body.name && req.body.name !== category.name) {
      const existingCategory = await Category.findOne({ name: req.body.name });
      if (existingCategory) {
        return sendResponse(res, 400, false, 'Category with this name already exists');
      }
    }

    // Update category
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    sendResponse(res, 200, true, 'Category updated successfully', updatedCategory);
  } catch (error) {
    console.error('Update category error:', error);
    if (error.code === 11000) {
      return sendResponse(res, 400, false, 'Category with this name already exists');
    }
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Admin
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return sendResponse(res, 404, false, 'Category not found');
    }

    // Check if category is being used by any services
    const Service = require('../models/Service');
    const servicesUsingCategory = await Service.findOne({ category: req.params.id });
    
    if (servicesUsingCategory) {
      return sendResponse(res, 400, false, 'Cannot delete category. It is being used by services.');
    }

    await Category.findByIdAndDelete(req.params.id);

    sendResponse(res, 200, true, 'Category deleted successfully');
  } catch (error) {
    console.error('Delete category error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
