const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');

// Connect to database
const connectDB = require('./config/db');

const createSampleUsers = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Get existing admin user
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (!existingAdmin) {
      console.log('❌ No admin user found. Please run createAdmin.js first.');
      return;
    }

    // Sample customers data
    const sampleCustomers = [
      {
        name: 'Rahul Sharma',
        email: 'rahul.sharma@example.com',
        password: 'password123',
        phone: '9876543210',
        role: 'user',
        address: {
          street: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001'
        },
        isActive: true
      },
      {
        name: 'Priya Patel',
        email: 'priya.patel@example.com',
        password: 'password123',
        phone: '9876543211',
        role: 'user',
        address: {
          street: '456 Park Avenue',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400002'
        },
        isActive: true
      },
      {
        name: 'Amit Kumar',
        email: 'amit.kumar@example.com',
        password: 'password123',
        phone: '9876543212',
        role: 'user',
        address: {
          street: '789 Lake Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400003'
        },
        isActive: true
      },
      {
        name: 'Neha Singh',
        email: 'neha.singh@example.com',
        password: 'password123',
        phone: '9876543213',
        role: 'user',
        address: {
          street: '321 Garden Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400004'
        },
        isActive: true
      },
      {
        name: 'Vikram Mehta',
        email: 'vikram.mehta@example.com',
        password: 'password123',
        phone: '9876543214',
        role: 'user',
        address: {
          street: '654 Hill Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400005'
        },
        isActive: true
      }
    ];

    // Sample partners/workers data
    const samplePartners = [
      {
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@example.com',
        password: 'password123',
        phone: '9876543220',
        role: 'worker',
        address: {
          street: '111 Worker Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001'
        },
        skills: ['Cleaning', 'Deep Cleaning', 'Kitchen Cleaning'],
        experience: 3,
        availability: {
          isAvailable: true,
          availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
          availableTimeSlots: [
            { startTime: '09:00', endTime: '12:00' },
            { startTime: '14:00', endTime: '17:00' }
          ],
          maxBookingsPerDay: 5
        },
        rating: 4.5,
        totalBookings: 45,
        completedBookings: 42,
        isActive: true
      },
      {
        name: 'Suresh Patel',
        email: 'suresh.patel@example.com',
        password: 'password123',
        phone: '9876543221',
        role: 'worker',
        address: {
          street: '222 Plumber Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400002'
        },
        skills: ['Plumbing', 'Emergency Repair', 'Pipe Installation'],
        experience: 5,
        availability: {
          isAvailable: true,
          availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          availableTimeSlots: [
            { startTime: '00:00', endTime: '23:59' }
          ],
          maxBookingsPerDay: 8
        },
        rating: 4.8,
        totalBookings: 78,
        completedBookings: 75,
        isActive: true
      },
      {
        name: 'Mohan Singh',
        email: 'mohan.singh@example.com',
        password: 'password123',
        phone: '9876543222',
        role: 'worker',
        address: {
          street: '333 Electric Avenue',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400003'
        },
        skills: ['Electrical', 'Wiring', 'Safety Inspection'],
        experience: 4,
        availability: {
          isAvailable: true,
          availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
          availableTimeSlots: [
            { startTime: '08:00', endTime: '18:00' }
          ],
          maxBookingsPerDay: 6
        },
        rating: 4.6,
        totalBookings: 62,
        completedBookings: 58,
        isActive: true
      },
      {
        name: 'Lakshmi Devi',
        email: 'lakshmi.devi@example.com',
        password: 'password123',
        phone: '9876543223',
        role: 'worker',
        address: {
          street: '444 Cleaning Lane',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400004'
        },
        skills: ['Cleaning', 'Bathroom Cleaning', 'Window Cleaning'],
        experience: 2,
        availability: {
          isAvailable: true,
          availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          availableTimeSlots: [
            { startTime: '10:00', endTime: '16:00' }
          ],
          maxBookingsPerDay: 4
        },
        rating: 4.3,
        totalBookings: 28,
        completedBookings: 26,
        isActive: true
      },
      {
        name: 'Arun Verma',
        email: 'arun.verma@example.com',
        password: 'password123',
        phone: '9876543224',
        role: 'worker',
        address: {
          street: '555 Service Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400005'
        },
        skills: ['Plumbing', 'Kitchen Sink', 'Bathroom Fittings'],
        experience: 6,
        availability: {
          isAvailable: true,
          availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
          availableTimeSlots: [
            { startTime: '07:00', endTime: '19:00' }
          ],
          maxBookingsPerDay: 7
        },
        rating: 4.7,
        totalBookings: 89,
        completedBookings: 85,
        isActive: true
      }
    ];

    // Sample additional admin
    const sampleAdmin = {
      name: 'Admin Manager',
      email: 'admin.manager@example.com',
      password: 'password123',
      phone: '9876543230',
      role: 'admin',
      address: {
        street: '999 Admin Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001'
      },
      isActive: true
    };

    // Sample manager
    const sampleManager = {
      name: 'Manager User',
      email: 'manager.user@example.com',
      password: 'password123',
      phone: '9876543231',
      role: 'manager',
      address: {
        street: '888 Manager Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400002'
      },
      isActive: true
    };

    // Create users
    const createdUsers = [];

    // Create customers
    console.log('\n📝 Creating customers...');
    for (const customerData of sampleCustomers) {
      try {
        const customer = await User.create({
          ...customerData,
          createdBy: existingAdmin._id
        });
        createdUsers.push(customer);
        console.log(`✅ Created customer: ${customer.name} (${customer.email})`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⚠️ Customer ${customerData.email} already exists, skipping...`);
        } else {
          console.log(`❌ Error creating customer ${customerData.name}: ${error.message}`);
        }
      }
    }

    // Create partners
    console.log('\n🔧 Creating partners/workers...');
    for (const partnerData of samplePartners) {
      try {
        const partner = await User.create({
          ...partnerData,
          createdBy: existingAdmin._id
        });
        createdUsers.push(partner);
        console.log(`✅ Created partner: ${partner.name} (${partner.email}) - Skills: ${partner.skills.join(', ')}`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⚠️ Partner ${partnerData.email} already exists, skipping...`);
        } else {
          console.log(`❌ Error creating partner ${partnerData.name}: ${error.message}`);
        }
      }
    }

    // Create additional admin
    console.log('\n👑 Creating additional admin...');
    try {
      const admin = await User.create({
        ...sampleAdmin,
        createdBy: existingAdmin._id
      });
      createdUsers.push(admin);
      console.log(`✅ Created admin: ${admin.name} (${admin.email})`);
    } catch (error) {
      if (error.code === 11000) {
        console.log(`⚠️ Admin ${sampleAdmin.email} already exists, skipping...`);
      } else {
        console.log(`❌ Error creating admin: ${error.message}`);
      }
    }

    // Create manager
    console.log('\n👨‍💼 Creating manager...');
    try {
      const manager = await User.create({
        ...sampleManager,
        createdBy: existingAdmin._id
      });
      createdUsers.push(manager);
      console.log(`✅ Created manager: ${manager.name} (${manager.email})`);
    } catch (error) {
      if (error.code === 11000) {
        console.log(`⚠️ Manager ${sampleManager.email} already exists, skipping...`);
      } else {
        console.log(`❌ Error creating manager: ${error.message}`);
      }
    }

    console.log(`\n🎉 Successfully created ${createdUsers.length} sample users!`);

    // Display summary
    const customers = createdUsers.filter(u => u.role === 'user');
    const partners = createdUsers.filter(u => u.role === 'worker');
    const admins = createdUsers.filter(u => u.role === 'admin');
    const managers = createdUsers.filter(u => u.role === 'manager');

    console.log('\n📊 User Summary:');
    console.log(`- Customers: ${customers.length}`);
    console.log(`- Partners/Workers: ${partners.length}`);
    console.log(`- Admins: ${admins.length}`);
    console.log(`- Managers: ${managers.length}`);

    console.log('\n🔗 You can now test the user management endpoints:');
    console.log('- GET /api/users - Get all users');
    console.log('- GET /api/users/customers - Get all customers');
    console.log('- GET /api/users/partners - Get all partners/workers');
    console.log('- GET /api/users/admins - Get all admins');
    console.log('- POST /api/users - Create new user (Admin only)');
    console.log('- POST /api/users/partner - Create partner (Admin only)');
    console.log('- POST /api/users/admin - Create admin (Admin only)');
    console.log('- PUT /api/users/:id/block - Block/Unblock user (Admin only)');
    console.log('- PUT /api/users/:id/role - Change user role (Admin only)');

    console.log('\n🔐 Test Login Credentials:');
    console.log('Customers:');
    customers.forEach(c => console.log(`  ${c.email} / password123`));
    console.log('\nPartners:');
    partners.forEach(p => console.log(`  ${p.email} / password123`));
    console.log('\nAdmins:');
    admins.forEach(a => console.log(`  ${a.email} / password123`));
    console.log('\nManagers:');
    managers.forEach(m => console.log(`  ${m.email} / password123`));

  } catch (error) {
    console.error('❌ Error creating sample users:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

createSampleUsers();
