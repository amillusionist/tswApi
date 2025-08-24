const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Category = require('./models/Category');

// Connect to database
const connectDB = require('./config/db');

const createSampleCategories = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Sample categories data
    const sampleCategories = [
             {
         name: 'Cleaning',
         description: 'Professional cleaning services for homes and offices',
         icon: '🧹',
         image: 'https://example.com/cleaning.jpg',
         active: true
       },
             {
         name: 'Plumbing',
         description: 'Expert plumbing services and repairs',
         icon: '🔧',
         image: 'https://example.com/plumbing.jpg',
         active: true
       },
       {
         name: 'Electrical',
         description: 'Electrical installation and repair services',
         icon: '⚡',
         image: 'https://example.com/electrical.jpg',
         active: true
       },
       {
         name: 'Carpentry',
         description: 'Custom carpentry and woodwork services',
         icon: '🔨',
         image: 'https://example.com/carpentry.jpg',
         active: true
       },
       {
         name: 'Painting',
         description: 'Interior and exterior painting services',
         icon: '🎨',
         image: 'https://example.com/painting.jpg',
         active: true
       },
       {
         name: 'Beauty & Wellness',
         description: 'Beauty treatments and wellness services',
         icon: '💄',
         image: 'https://example.com/beauty.jpg',
         active: true
       },
       {
         name: 'Fitness',
         description: 'Personal training and fitness services',
         icon: '💪',
         image: 'https://example.com/fitness.jpg',
         active: true
       },
       {
         name: 'Tutoring',
         description: 'Educational and tutoring services',
         icon: '📚',
         image: 'https://example.com/tutoring.jpg',
         active: true
       }
    ];

    // Create categories
    const createdCategories = [];
    for (const categoryData of sampleCategories) {
      const category = await Category.create(categoryData);
      createdCategories.push(category);
      console.log(`✅ Created category: ${category.name} ${category.icon}`);
    }

    console.log(`\n🎉 Successfully created ${createdCategories.length} sample categories!`);
    console.log('\n📋 Sample Categories:');
    createdCategories.forEach(category => {
      console.log(`- ${category.icon} ${category.name}: ${category.description}`);
    });

    console.log('\n🔗 You can now test the category endpoints:');
    console.log('- GET /api/categories - Get all categories');
    console.log('- GET /api/categories/:id - Get specific category');
    console.log('- POST /api/categories - Create category (Admin only)');
    console.log('- PUT /api/categories/:id - Update category (Admin only)');
    console.log('- DELETE /api/categories/:id - Delete category (Admin only)');

  } catch (error) {
    console.error('❌ Error creating sample categories:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

createSampleCategories();
