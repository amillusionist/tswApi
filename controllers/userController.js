const User = require('../models/User');
const { sendResponse, paginateResults, buildFilter, buildSort } = require('../utils/helpers');
const { validationResult } = require('express-validator');

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    sendResponse(res, 200, true, 'Profile retrieved successfully', { user });
  } catch (error) {
    console.error('Get me error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/me
// @access  Private
const updateMe = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { name, phone, address } = req.body;
    const updateFields = {};

    if (name) updateFields.name = name;
    if (phone) updateFields.phone = phone;
    if (address) updateFields.address = address;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true, runValidators: true }
    );

    sendResponse(res, 200, true, 'Profile updated successfully', { user });
  } catch (error) {
    console.error('Update me error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Create new user (Admin only)
// @route   POST /api/users
// @access  Private (Admin)
const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { name, email, password, phone, role = 'user', address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendResponse(res, 400, false, 'User with this email already exists');
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role,
      address,
      createdBy: req.user.id
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    sendResponse(res, 201, true, 'User created successfully', { user: userResponse });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 11000) {
      return sendResponse(res, 400, false, 'User with this email already exists');
    }
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Create admin user (Admin only)
// @route   POST /api/users/admin
// @access  Private (Admin)
const createAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { name, email, password, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendResponse(res, 400, false, 'User with this email already exists');
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'admin',
      address,
      createdBy: req.user.id
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    sendResponse(res, 201, true, 'Admin user created successfully', { user: userResponse });
  } catch (error) {
    console.error('Create admin error:', error);
    if (error.code === 11000) {
      return sendResponse(res, 400, false, 'User with this email already exists');
    }
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Create partner/worker (Admin only)
// @route   POST /api/users/partner
// @access  Private (Admin)
const createPartner = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { name, email, password, phone, address, skills, experience, availability } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendResponse(res, 400, false, 'User with this email already exists');
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'worker',
      address,
      skills,
      experience,
      availability,
      createdBy: req.user.id
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    sendResponse(res, 201, true, 'Partner created successfully', { user: userResponse });
  } catch (error) {
    console.error('Create partner error:', error);
    if (error.code === 11000) {
      return sendResponse(res, 400, false, 'User with this email already exists');
    }
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get all users (Admin/Manager)
// @route   GET /api/users
// @access  Private (Admin/Manager)
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt', ...filters } = req.query;
    const { skip, limit: limitNum } = paginateResults(page, limit);
    const filter = buildFilter(filters);
    const sortObj = buildSort(sort);

    const users = await User.find(filter)
      .select('-password')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(filter);

    sendResponse(res, 200, true, 'Users retrieved successfully', {
      users,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get all partners/workers
// @route   GET /api/users/partners
// @access  Private (Admin/Manager)
const getPartners = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt', isActive, skills } = req.query;
    const { skip, limit: limitNum } = paginateResults(page, limit);
    
    let filter = { role: 'worker' };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (skills) filter.skills = { $in: skills.split(',') };
    
    const sortObj = buildSort(sort);

    const users = await User.find(filter)
      .select('-password')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(filter);

    sendResponse(res, 200, true, 'Partners retrieved successfully', {
      partners: users,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get partners error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get all admins
// @route   GET /api/users/admins
// @access  Private (Admin)
const getAdmins = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const { skip, limit: limitNum } = paginateResults(page, limit);
    const sortObj = buildSort(sort);

    const users = await User.find({ role: 'admin' })
      .select('-password')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments({ role: 'admin' });

    sendResponse(res, 200, true, 'Admins retrieved successfully', {
      admins: users,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get admins error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get all customers
// @route   GET /api/users/customers
// @access  Private (Admin/Manager)
const getCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt', isActive } = req.query;
    const { skip, limit: limitNum } = paginateResults(page, limit);
    
    let filter = { role: 'user' };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const sortObj = buildSort(sort);

    const users = await User.find(filter)
      .select('-password')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(filter);

    sendResponse(res, 200, true, 'Customers retrieved successfully', {
      customers: users,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin/Manager/Worker)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return sendResponse(res, 404, false, 'User not found');
    }

    sendResponse(res, 200, true, 'User retrieved successfully', { user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Update user by ID (Admin only)
// @route   PUT /api/users/:id
// @access  Private (Admin)
const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { name, email, phone, role, isActive, address, skills, experience, availability } = req.body;
    const updateFields = {};

    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (role) updateFields.role = role;
    if (typeof isActive === 'boolean') updateFields.isActive = isActive;
    if (address) updateFields.address = address;
    if (skills) updateFields.skills = skills;
    if (experience) updateFields.experience = experience;
    if (availability) updateFields.availability = availability;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return sendResponse(res, 404, false, 'User not found');
    }

    sendResponse(res, 200, true, 'User updated successfully', { user });
  } catch (error) {
    console.error('Update user error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Block/Unblock user (Admin only)
// @route   PUT /api/users/:id/block
// @access  Private (Admin)
const toggleUserBlock = async (req, res) => {
  try {
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return sendResponse(res, 400, false, 'isActive must be a boolean');
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return sendResponse(res, 404, false, 'User not found');
    }

    const action = isActive ? 'unblocked' : 'blocked';
    sendResponse(res, 200, true, `User ${action} successfully`, { user });
  } catch (error) {
    console.error('Toggle user block error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Change user role (Admin only)
// @route   PUT /api/users/:id/role
// @access  Private (Admin)
const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['admin', 'manager', 'user', 'worker'].includes(role)) {
      return sendResponse(res, 400, false, 'Invalid role');
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return sendResponse(res, 404, false, 'User not found');
    }

    sendResponse(res, 200, true, 'User role changed successfully', { user });
  } catch (error) {
    console.error('Change user role error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return sendResponse(res, 404, false, 'User not found');
    }

    sendResponse(res, 200, true, 'User deleted successfully');
  } catch (error) {
    console.error('Delete user error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

// @desc    Get user statistics (Admin only)
// @route   GET /api/users/stats
// @access  Private (Admin)
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentUsers = await User.find()
      .sort('-createdAt')
      .limit(5)
      .select('name email role createdAt');

    sendResponse(res, 200, true, 'User statistics retrieved successfully', {
      stats: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        byRole: usersByRole
      },
      recentUsers
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    sendResponse(res, 500, false, 'Server error');
  }
};

module.exports = {
  getMe,
  updateMe,
  createUser,
  createAdmin,
  createPartner,
  getUsers,
  getPartners,
  getAdmins,
  getCustomers,
  getUserById,
  updateUser,
  toggleUserBlock,
  changeUserRole,
  deleteUser,
  getUserStats
};
