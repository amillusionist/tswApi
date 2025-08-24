const Service = require('../models/Service');
const Category = require('../models/Category');
const Addon = require('../models/Addon');
const User = require('../models/User');
const { sendResponse, paginateResults } = require('../utils/helpers');
const { validationResult } = require('express-validator');

// @desc    Get all services
// @route   GET /api/services
// @access  Public
const getServices = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      categoryId, 
      active, 
      featured, 
      popular,
      minPrice, 
      maxPrice, 
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
             providerId,
       pincode
    } = req.query;

    // Build query
    let query = {};

    // Filter by active status
    if (active !== undefined) {
      query.active = active === 'true';
    }

    // Filter by featured
    if (featured !== undefined) {
      query.featured = featured === 'true';
    }

    // Filter by popular
    if (popular !== undefined) {
      query.popular = popular === 'true';
    }

    // Filter by category
    if (categoryId) {
      query.categoryId = categoryId;
    }

    // Filter by provider
    if (providerId) {
      query['provider.providerId'] = providerId;
    }

    // Filter by pincode
    if (req.query.pincode) {
      query.pincodes = req.query.pincode;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with pagination
    const { skip, limit: limitNum } = paginateResults(page, limit);
    
         const services = await Service.find(query)
       .populate('categoryId', '_id')
       .populate('addons.addonId', '_id')
       .populate('provider.providerId', '_id')
       .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
       .skip(skip)
       .limit(limitNum);

    const total = await Service.countDocuments(query);

    sendResponse(res, 200, true, 'Services retrieved successfully', {
      services,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get services error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get service by ID
// @route   GET /api/services/:id
// @access  Public
const getServiceById = async (req, res) => {
  try {
         const service = await Service.findById(req.params.id)
       .populate('categoryId', '_id')
       .populate('addons.addonId', '_id')
       .populate('provider.providerId', '_id');

    if (!service) {
      return sendResponse(res, 404, false, 'Service not found');
    }

    sendResponse(res, 200, true, 'Service retrieved successfully', service);
  } catch (error) {
    console.error('Get service by ID error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Create service
// @route   POST /api/services
// @access  Admin/Manager
const createService = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

         const {
       categoryId,
       name,
       description,
       price,
       originalPrice,
       featuredImage,
      images,
      addons,
      duration,
      location,
      features,
      requirements,
      instructions,
      cancellationPolicy,
      availability,
      provider,
      tags,
      seo,
      active,
      featured,
      popular
    } = req.body;

    // Validate category exists
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return sendResponse(res, 400, false, 'Category not found');
    }

    // Validate addons if provided
    if (addons && addons.length > 0) {
      for (const addon of addons) {
        const addonExists = await Addon.findById(addon.addonId);
        if (!addonExists) {
          return sendResponse(res, 400, false, `Addon ${addon.addonId} not found`);
        }
      }
    }

    // Validate provider if provided
    if (provider && provider.providerId) {
      const providerExists = await User.findById(provider.providerId);
      if (!providerExists || providerExists.role !== 'worker') {
        return sendResponse(res, 400, false, 'Provider not found or invalid');
      }
    } else if (provider && Object.keys(provider).length > 0) {
      // If provider object is provided but no providerId, remove it
      delete req.body.provider;
    }

         // Create service
     const service = await Service.create({
       categoryId,
       name,
       description,
       price,
       originalPrice,
       featuredImage,
      images,
      addons,
      duration,
      location,
      features,
      requirements,
      instructions,
      cancellationPolicy,
      availability,
      provider,
      tags,
      seo,
      active,
      featured,
      popular,
      createdBy: req.user.id
    });

         // Populate references
     const populatedService = await Service.findById(service._id)
       .populate('categoryId', '_id')
       .populate('addons.addonId', '_id')
       .populate('provider.providerId', '_id');

    sendResponse(res, 201, true, 'Service created successfully', populatedService);
  } catch (error) {
    console.error('Create service error:', error);
    if (error.code === 11000) {
      return sendResponse(res, 400, false, 'Service with this name already exists');
    }
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Admin
const updateService = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const service = await Service.findById(req.params.id);
    if (!service) {
      return sendResponse(res, 404, false, 'Service not found');
    }

    // Validate category if being updated
    if (req.body.categoryId) {
      const categoryExists = await Category.findById(req.body.categoryId);
      if (!categoryExists) {
        return sendResponse(res, 400, false, 'Category not found');
      }
    }

    // Validate addons if being updated
    if (req.body.addons && req.body.addons.length > 0) {
      for (const addon of req.body.addons) {
        const addonExists = await Addon.findById(addon.addonId);
        if (!addonExists) {
          return sendResponse(res, 400, false, `Addon ${addon.addonId} not found`);
        }
      }
    }

    // Validate provider if being updated
    if (req.body.provider && req.body.provider.providerId) {
      const providerExists = await User.findById(req.body.provider.providerId);
      if (!providerExists || providerExists.role !== 'worker') {
        return sendResponse(res, 400, false, 'Provider not found or invalid');
      }
    } else if (req.body.provider && Object.keys(req.body.provider).length > 0) {
      // If provider object is provided but no providerId, remove it
      delete req.body.provider;
    }

         // Update service
     const updatedService = await Service.findByIdAndUpdate(
       req.params.id,
       req.body,
       { new: true, runValidators: true }
     )
     .populate('categoryId', '_id')
     .populate('addons.addonId', '_id')
     .populate('provider.providerId', '_id');

    sendResponse(res, 200, true, 'Service updated successfully', updatedService);
  } catch (error) {
    console.error('Update service error:', error);
    if (error.code === 11000) {
      return sendResponse(res, 400, false, 'Service with this name already exists');
    }
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Admin
const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return sendResponse(res, 404, false, 'Service not found');
    }

    await Service.findByIdAndDelete(req.params.id);

    sendResponse(res, 200, true, 'Service deleted successfully');
  } catch (error) {
    console.error('Delete service error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get service categories
// @route   GET /api/services/categories
// @access  Public
const getServiceCategories = async (req, res) => {
  try {
    const categories = await Category.find({ active: true })
      .select('name icon description')
      .sort('name');

    sendResponse(res, 200, true, 'Categories retrieved successfully', categories);
  } catch (error) {
    console.error('Get categories error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Search services
// @route   GET /api/services/search
// @access  Public
const searchServices = async (req, res) => {
  try {
    const { q, categoryId, minPrice, maxPrice, limit = 10 } = req.query;

    if (!q) {
      return sendResponse(res, 400, false, 'Search query is required');
    }

    let query = {
      $text: { $search: q },
      active: true
    };

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

         const services = await Service.find(query)
       .populate('categoryId', '_id')
       .populate('addons.addonId', '_id')
       .limit(parseInt(limit))
       .sort({ score: { $meta: 'textScore' } });

    sendResponse(res, 200, true, 'Search completed successfully', {
      services,
      count: services.length,
      query: q
    });
  } catch (error) {
    console.error('Search services error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get service statistics
// @route   GET /api/services/stats
// @access  Admin
const getServiceStats = async (req, res) => {
  try {
    const totalServices = await Service.countDocuments();
    const activeServices = await Service.countDocuments({ active: true });
    const featuredServices = await Service.countDocuments({ featured: true });
    const popularServices = await Service.countDocuments({ popular: true });

    // Category-wise distribution
    const categoryStats = await Service.aggregate([
      {
        $group: {
          _id: '$categoryId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $project: {
          categoryName: '$category.name',
          count: 1
        }
      }
    ]);

         // Average rating
     const avgRating = await Service.aggregate([
       {
         $group: {
           _id: null,
           averageRating: { $avg: '$rating' }
         }
       }
     ]);

    sendResponse(res, 200, true, 'Service statistics retrieved successfully', {
      totalServices,
      activeServices,
      featuredServices,
      popularServices,
      categoryStats,
      averageRating: avgRating[0]?.averageRating || 0
    });
  } catch (error) {
    console.error('Get service stats error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get featured services
// @route   GET /api/services/featured
// @access  Public
const getFeaturedServices = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

         const services = await Service.find({ 
       featured: true, 
       active: true 
     })
     .populate('categoryId', '_id')
     .populate('addons.addonId', '_id')
     .sort({ rating: -1, createdAt: -1 })
     .limit(parseInt(limit));

    sendResponse(res, 200, true, 'Featured services retrieved successfully', services);
  } catch (error) {
    console.error('Get featured services error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get popular services
// @route   GET /api/services/popular
// @access  Public
const getPopularServices = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

         const services = await Service.find({ 
       popular: true, 
       active: true 
     })
     .populate('categoryId', '_id')
     .populate('addons.addonId', '_id')
     .sort({ rating: -1 })
     .limit(parseInt(limit));

    sendResponse(res, 200, true, 'Popular services retrieved successfully', services);
  } catch (error) {
    console.error('Get popular services error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

module.exports = {
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
};
