const Addon = require('../models/Addon');
const { sendResponse, paginateResults } = require('../utils/helpers');
const { validationResult } = require('express-validator');

// @desc    Get all addons
// @route   GET /api/addons
// @access  Public
const getAddons = async (req, res) => {
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
    
    const addons = await Addon.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Addon.countDocuments(query);

    sendResponse(res, 200, true, 'Addons retrieved successfully', {
      addons,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get addons error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get addon by ID
// @route   GET /api/addons/:id
// @access  Public
const getAddonById = async (req, res) => {
  try {
    const addon = await Addon.findById(req.params.id);

    if (!addon) {
      return sendResponse(res, 404, false, 'Addon not found');
    }

    sendResponse(res, 200, true, 'Addon retrieved successfully', addon);
  } catch (error) {
    console.error('Get addon by ID error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Create addon
// @route   POST /api/addons
// @access  Admin
const createAddon = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { name, description, price, image, duration, features, requirements, notes, active } = req.body;

    // Create addon
    const addon = await Addon.create({
      name,
      description,
      price,
      image,
      duration,
      features,
      requirements,
      notes,
      active: active !== undefined ? active : true
    });

    sendResponse(res, 201, true, 'Addon created successfully', addon);
  } catch (error) {
    console.error('Create addon error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Update addon
// @route   PUT /api/addons/:id
// @access  Admin
const updateAddon = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const addon = await Addon.findById(req.params.id);
    if (!addon) {
      return sendResponse(res, 404, false, 'Addon not found');
    }

    // Update addon
    const updatedAddon = await Addon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    sendResponse(res, 200, true, 'Addon updated successfully', updatedAddon);
  } catch (error) {
    console.error('Update addon error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Delete addon
// @route   DELETE /api/addons/:id
// @access  Admin
const deleteAddon = async (req, res) => {
  try {
    const addon = await Addon.findById(req.params.id);
    if (!addon) {
      return sendResponse(res, 404, false, 'Addon not found');
    }

    await Addon.findByIdAndDelete(req.params.id);

    sendResponse(res, 200, true, 'Addon deleted successfully');
  } catch (error) {
    console.error('Delete addon error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

module.exports = {
  getAddons,
  getAddonById,
  createAddon,
  updateAddon,
  deleteAddon
};
