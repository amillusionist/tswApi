const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./models/User');

// Connect to database
const connectDB = require('./config/db');

const createAdminUser = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'manishwebworks@gmail.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists with email: manishwebworks@gmail.com');
      console.log('Updating password...');
      
      // Update password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('BepuFU3ezAya', salt);
      
      existingAdmin.password = hashedPassword;
      existingAdmin.role = 'admin';
      existingAdmin.isActive = true;
      
      await existingAdmin.save();
      console.log('✅ Admin user password updated successfully');
    } else {
      // Create new admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('BepuFU3ezAya', salt);

      const adminUser = new User({
        name: 'Admin User',
        email: 'manishwebworks@gmail.com',
        password: hashedPassword,
        phone: '1234567890',
        role: 'admin',
        isActive: true,
        emailVerified: true,
        phoneVerified: true
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully');
    }

    // Display admin user info
    const admin = await User.findOne({ email: 'manishwebworks@gmail.com' }).select('-password');
    console.log('\n📋 Admin User Details:');
    console.log('Email:', admin.email);
    console.log('Role:', admin.role);
    console.log('Status:', admin.isActive ? 'Active' : 'Inactive');
    console.log('Created:', admin.createdAt);

    console.log('\n🔑 Login Credentials:');
    console.log('Email: manishwebworks@gmail.com');
    console.log('Password: BepuFU3ezAya');

    console.log('\n🚀 You can now login to the API using these credentials!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
createAdminUser();
