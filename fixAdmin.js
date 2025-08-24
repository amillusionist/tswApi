const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./models/User');

// Connect to database
const connectDB = require('./config/db');

const fixAdminUser = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Hash the password directly
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('BepuFU3ezAya', salt);
    
    console.log('🔑 Password hashed successfully');
    console.log('Hash length:', hashedPassword.length);

    // Update the admin user directly
    const result = await User.updateOne(
      { email: 'manishwebworks@gmail.com' },
      { 
        password: hashedPassword,
        role: 'admin',
        isActive: true
      }
    );

    console.log('✅ Update result:', result);

    // Verify the update
    const admin = await User.findOne({ email: 'manishwebworks@gmail.com' }).select('+password');
    
    if (admin) {
      console.log('\n📋 Admin User Details:');
      console.log('Email:', admin.email);
      console.log('Role:', admin.role);
      console.log('Status:', admin.isActive ? 'Active' : 'Inactive');
      console.log('Password Hash:', admin.password.substring(0, 20) + '...');
      
      // Test password comparison
      const isMatch = await bcrypt.compare('BepuFU3ezAya', admin.password);
      console.log('Password Match:', isMatch);
      
      if (isMatch) {
        console.log('\n🎉 SUCCESS! Admin user is ready for login!');
        console.log('\n🔑 Login Credentials:');
        console.log('Email: manishwebworks@gmail.com');
        console.log('Password: BepuFU3ezAya');
      } else {
        console.log('\n❌ Password still not matching');
      }
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

fixAdminUser();
