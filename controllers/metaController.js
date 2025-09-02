const MetaData = require('../models/MetaData');
const { sendResponse, paginateResults, buildFilter, buildSort } = require('../utils/helpers');
const { validationResult } = require('express-validator');

// @desc    Get metadata by key
// @route   GET /api/meta/:key
// @access  Public
const getMetaData = async (req, res) => {
  try {
    const { key } = req.params;

    const metaData = await MetaData.findOne({ key });

    if (!metaData) {
      return sendResponse(res, 404, false, 'Metadata not found');
    }

    // Check if metadata is public
    if (!metaData.isPublic && req.user?.role !== 'admin') {
      return sendResponse(res, 403, false, 'Access denied');
    }

    sendResponse(res, 200, true, 'Metadata retrieved successfully', { metaData });
  } catch (error) {
    console.error('Get metadata error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Create or update metadata
// @route   POST /api/meta/:key
// @access  Private (Admin)
const createOrUpdateMetaData = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { key } = req.params;
    const { value, description, isPublic, category } = req.body;

    const updateFields = {
      value,
      lastUpdatedBy: req.user.id
    };

    if (description) updateFields.description = description;
    if (typeof isPublic === 'boolean') updateFields.isPublic = isPublic;
    if (category) updateFields.category = category;

    const metaData = await MetaData.findOneAndUpdate(
      { key },
      updateFields,
      { 
        new: true, 
        runValidators: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    sendResponse(res, 200, true, 'Metadata created/updated successfully', { metaData });
  } catch (error) {
    console.error('Create/Update metadata error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Delete metadata
// @route   DELETE /api/meta/:key
// @access  Private (Admin)
const deleteMetaData = async (req, res) => {
  try {
    const { key } = req.params;

    const metaData = await MetaData.findOneAndDelete({ key });
    
    if (!metaData) {
      return sendResponse(res, 404, false, 'Metadata not found');
    }

    sendResponse(res, 200, true, 'Metadata deleted successfully');
  } catch (error) {
    console.error('Delete metadata error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get all metadata (Admin only)
// @route   GET /api/meta
// @access  Private (Admin)
const getAllMetaData = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-updatedAt', category, isPublic, ...filters } = req.query;
    const { skip, limit: limitNum } = paginateResults(page, limit);
    const filter = buildFilter(filters);
    const sortObj = buildSort(sort);

    if (category) {
      filter.category = category;
    }

    if (typeof isPublic === 'boolean') {
      filter.isPublic = isPublic;
    }

    const metaData = await MetaData.find(filter)
      .populate('lastUpdatedBy', 'name email')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await MetaData.countDocuments(filter);

    sendResponse(res, 200, true, 'Metadata retrieved successfully', {
      metaData,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get all metadata error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get public metadata
// @route   GET /api/meta/public/all
// @access  Public
const getPublicMetaData = async (req, res) => {
  try {
    const { category } = req.query;

    const filter = { isPublic: true };
    if (category) {
      filter.category = category;
    }

    const metaData = await MetaData.find(filter)
      .select('key value description category')
      .sort('category key');

    sendResponse(res, 200, true, 'Public metadata retrieved successfully', { metaData });
  } catch (error) {
    console.error('Get public metadata error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get metadata categories
// @route   GET /api/meta/categories
// @access  Public
const getMetaDataCategories = async (req, res) => {
  try {
    const categories = await MetaData.distinct('category');
    sendResponse(res, 200, true, 'Categories retrieved successfully', { categories });
  } catch (error) {
    console.error('Get metadata categories error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Bulk update metadata
// @route   PUT /api/meta/bulk
// @access  Private (Admin)
const bulkUpdateMetaData = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { updates } = req.body;

    if (!Array.isArray(updates)) {
      return sendResponse(res, 400, false, 'Updates must be an array');
    }

    const results = [];

    for (const update of updates) {
      const { key, value, description, isPublic, category } = update;

      if (!key || value === undefined) {
        results.push({ key, success: false, error: 'Key and value are required' });
        continue;
      }

      try {
        const updateFields = {
          value,
          lastUpdatedBy: req.user.id
        };

        if (description) updateFields.description = description;
        if (typeof isPublic === 'boolean') updateFields.isPublic = isPublic;
        if (category) updateFields.category = category;

        const metaData = await MetaData.findOneAndUpdate(
          { key },
          updateFields,
          { 
            new: true, 
            runValidators: true,
            upsert: true,
            setDefaultsOnInsert: true
          }
        );

        results.push({ key, success: true, data: metaData });
      } catch (error) {
        results.push({ key, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    sendResponse(res, 200, true, `Bulk update completed. ${successCount} successful, ${failureCount} failed`, {
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    });
  } catch (error) {
    console.error('Bulk update metadata error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Initialize default metadata
// @route   POST /api/meta/init
// @access  Private (Admin)
const initializeDefaultMetaData = async (req, res) => {
  try {
    const defaultMetaData = [
      {
        key: 'faq',
        value: [
          {
            question: 'How do I book a service?',
            answer: 'You can book a service by browsing our service catalog and selecting a provider. Follow the booking process to schedule your appointment.'
          },
          {
            question: 'What payment methods do you accept?',
            answer: 'We accept various payment methods including credit cards, debit cards, UPI, net banking, and cash payments.'
          },
          {
            question: 'Can I cancel my booking?',
            answer: 'Yes, you can cancel your booking up to 24 hours before the scheduled time. Cancellation policies may vary by service.'
          }
        ],
        description: 'Frequently Asked Questions',
        category: 'content',
        isPublic: true
      },
      {
        key: 'contact_details',
        value: {
          email: 'support@tsw-api.com',
          phone: '+91-1234567890',
          address: '123 Service Street, Mumbai, Maharashtra 400001',
          workingHours: 'Monday to Sunday, 8:00 AM to 8:00 PM'
        },
        description: 'Contact information',
        category: 'contact',
        isPublic: true
      },
      {
        key: 'app_settings',
        value: {
          maintenanceMode: false,
          version: '1.0.0',
          features: {
            booking: true,
            payments: true,
            reviews: true,
            notifications: true
          }
        },
        description: 'Application settings',
        category: 'system',
        isPublic: false
      },
      {
        key: 'terms_of_service',
        value: 'By using our service, you agree to our terms and conditions...',
        description: 'Terms of Service',
        category: 'legal',
        isPublic: true
      },
      {
        key: 'privacy_policy',
        value: 'We are committed to protecting your privacy...',
        description: 'Privacy Policy',
        category: 'legal',
        isPublic: true
      }
    ];

    const results = [];

    for (const meta of defaultMetaData) {
      try {
        const existingMeta = await MetaData.findOne({ key: meta.key });
        
        if (!existingMeta) {
          const newMeta = await MetaData.create({
            ...meta,
            lastUpdatedBy: req.user.id
          });
          results.push({ key: meta.key, action: 'created', success: true });
        } else {
          results.push({ key: meta.key, action: 'skipped', success: true, reason: 'Already exists' });
        }
      } catch (error) {
        results.push({ key: meta.key, action: 'failed', success: false, error: error.message });
      }
    }

    const createdCount = results.filter(r => r.action === 'created').length;
    const skippedCount = results.filter(r => r.action === 'skipped').length;
    const failedCount = results.filter(r => r.action === 'failed').length;

    sendResponse(res, 200, true, `Initialization completed. ${createdCount} created, ${skippedCount} skipped, ${failedCount} failed`, {
      results,
      summary: {
        created: createdCount,
        skipped: skippedCount,
        failed: failedCount
      }
    });
  } catch (error) {
    console.error('Initialize default metadata error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get app settings
// @route   GET /api/settings
// @access  Public
const getAppSettings = async (req, res) => {
  try {
    const settings = await MetaData.findOne({ key: 'app_settings' });
    
    if (!settings) {
      return sendResponse(res, 404, false, 'App settings not found');
    }

    sendResponse(res, 200, true, 'App settings retrieved successfully', {
      settings: settings.value
    });
  } catch (error) {
    console.error('Get app settings error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Update app settings
// @route   PUT /api/settings
// @access  Private (Admin only)
const updateAppSettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { value } = req.body;

    const settings = await MetaData.findOneAndUpdate(
      { key: 'app_settings' },
      { 
        value,
        lastUpdatedBy: req.user.id,
        lastUpdated: Date.now()
      },
      { new: true, upsert: true }
    );

    sendResponse(res, 200, true, 'App settings updated successfully', {
      settings: settings.value
    });
  } catch (error) {
    console.error('Update app settings error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

module.exports = {
  getMetaData,
  createOrUpdateMetaData,
  deleteMetaData,
  getAllMetaData,
  getPublicMetaData,
  getMetaDataCategories,
  bulkUpdateMetaData,
  initializeDefaultMetaData,
  getAppSettings,
  updateAppSettings
};
