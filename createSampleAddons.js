const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Addon = require('./models/Addon');

// Connect to database
const connectDB = require('./config/db');

const createSampleAddons = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Sample addons data
    const sampleAddons = [
      {
        name: 'Deep Cleaning',
        description: 'Extra thorough cleaning with specialized equipment',
        price: 200,
        image: 'https://example.com/deep-cleaning.jpg',
        duration: 45,
        features: ['Specialized equipment', 'Eco-friendly products', 'Detailed attention'],
        requirements: ['Extra time', 'Access to all areas'],
        notes: 'Recommended for first-time cleaning',
        active: true
      },
      {
        name: 'Window Cleaning',
        description: 'Professional window cleaning service',
        price: 150,
        image: 'https://example.com/window-cleaning.jpg',
        duration: 30,
        features: ['Streak-free finish', 'Interior and exterior', 'Safety equipment'],
        requirements: ['Safe access to windows'],
        notes: 'Includes both interior and exterior windows',
        active: true
      },
      {
        name: 'Carpet Cleaning',
        description: 'Deep carpet cleaning and stain removal',
        price: 300,
        image: 'https://example.com/carpet-cleaning.jpg',
        duration: 60,
        features: ['Stain removal', 'Odor elimination', 'Fabric protection'],
        requirements: ['Clear carpet area', 'Drying time'],
        notes: 'Drying time: 4-6 hours',
        active: true
      },
      {
        name: 'Kitchen Deep Clean',
        description: 'Comprehensive kitchen cleaning including appliances',
        price: 250,
        image: 'https://example.com/kitchen-cleaning.jpg',
        duration: 90,
        features: ['Appliance cleaning', 'Cabinet cleaning', 'Counter sanitization'],
        requirements: ['Clear kitchen area', 'Access to appliances'],
        notes: 'Includes refrigerator and oven cleaning',
        active: true
      }
    ];

    // Create addons
    const createdAddons = [];
    for (const addonData of sampleAddons) {
      const addon = await Addon.create(addonData);
      createdAddons.push(addon);
      console.log(`✅ Created addon: ${addon.name} - ₹${addon.price}`);
    }

    console.log(`\n🎉 Successfully created ${createdAddons.length} sample addons!`);
    console.log('\n📋 Sample Addons:');
    createdAddons.forEach(addon => {
      console.log(`- ${addon.name}: ₹${addon.price} (${addon.duration} mins)`);
    });

    console.log('\n🔗 You can now test the addon endpoints:');
    console.log('- GET /api/addons - Get all addons');
    console.log('- GET /api/addons/:id - Get specific addon');
    console.log('- POST /api/addons - Create addon (Admin only)');
    console.log('- PUT /api/addons/:id - Update addon (Admin only)');
    console.log('- DELETE /api/addons/:id - Delete addon (Admin only)');

  } catch (error) {
    console.error('❌ Error creating sample addons:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

createSampleAddons();
