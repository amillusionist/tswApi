const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('./models/User');

// Connect to database
const connectDB = require('./config/db');

const testAdmin = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Find admin user with password
    const admin = await User.findOne({ email: 'manishwebworks@gmail.com' }).select('+password');
    
    if (admin) {
      console.log('✅ Admin user found:');
      console.log('Email:', admin.email);
      console.log('Role:', admin.role);
      console.log('Is Active:', admin.isActive);
      console.log('Has Password:', !!admin.password);
      console.log('Password Length:', admin.password ? admin.password.length : 0);
      
      // Test password comparison
      const bcrypt = require('bcryptjs');
      const isMatch = await bcrypt.compare('BepuFU3ezAya', admin.password);
      console.log('Password Match:', isMatch);
      
    } else {
      console.log('❌ Admin user not found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

testAdmin();
