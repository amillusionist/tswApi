const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return require('jsonwebtoken').sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '30d'
  });
};




// Generate random token
const generateRandomToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Format response
const sendResponse = (res, statusCode, success, message, data = null) => {
  const response = {
    success,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

// Pagination helper
const paginateResults = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return { skip, limit: parseInt(limit) };
};

// Filter helper
const buildFilter = (query) => {
  const filter = {};
  
  // Remove pagination and sorting from filter
  const { page, limit, sort, ...filterParams } = query;
  
  Object.keys(filterParams).forEach(key => {
    if (filterParams[key] !== undefined && filterParams[key] !== '') {
      // Handle special cases
      if (key === 'search') {
        filter.$or = [
          { name: { $regex: filterParams[key], $options: 'i' } },
          { email: { $regex: filterParams[key], $options: 'i' } }
        ];
      } else if (key === 'priceRange') {
        const [min, max] = filterParams[key].split('-');
        filter.price = {};
        if (min) filter.price.$gte = parseFloat(min);
        if (max) filter.price.$lte = parseFloat(max);
      } else if (key === 'dateRange') {
        const [start, end] = filterParams[key].split('-');
        filter.createdAt = {};
        if (start) filter.createdAt.$gte = new Date(start);
        if (end) filter.createdAt.$lte = new Date(end);
      } else {
        filter[key] = filterParams[key];
      }
    }
  });
  
  return filter;
};

// Sort helper
const buildSort = (sort = '-createdAt') => {
  const sortObj = {};
  const sortFields = sort.split(',');
  
  sortFields.forEach(field => {
    const order = field.startsWith('-') ? -1 : 1;
    const fieldName = field.startsWith('-') ? field.substring(1) : field;
    sortObj[fieldName] = order;
  });
  
  return sortObj;
};

// Validate phone number
const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

// Validate email
const validateEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

// Format currency
const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Generate booking reference
const generateBookingRef = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK${timestamp}${random}`;
};

// Generate payment reference
const generatePaymentRef = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PAY${timestamp}${random}`;
};

// Sanitize user input
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

module.exports = {
  generateToken,
  generateRandomToken,
  sendResponse,
  paginateResults,
  buildFilter,
  buildSort,
  validatePhone,
  validateEmail,
  calculateDistance,
  formatCurrency,
  generateBookingRef,
  generatePaymentRef,
  sanitizeInput
};
