const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Service = require('./models/Service');
const Category = require('./models/Category');
const Addon = require('./models/Addon');
const User = require('./models/User');

// Connect to database
const connectDB = require('./config/db');

const createSampleServices = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Get categories
    const categories = await Category.find({ active: true });
    if (categories.length === 0) {
      console.log('❌ No categories found. Please run createSampleCategories.js first.');
      return;
    }

    // Get addons
    const addons = await Addon.find({ active: true });
    if (addons.length === 0) {
      console.log('❌ No addons found. Please run createSampleAddons.js first.');
      return;
    }

    // Get admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('❌ No admin user found. Please run createAdmin.js first.');
      return;
    }

    // Get worker users
    const workers = await User.find({ role: 'worker' });
    if (workers.length === 0) {
      console.log('⚠️ No worker users found. Services will be created without providers.');
    }

    // Sample services data
    const sampleServices = [
      {
        categoryId: categories.find(c => c.name === 'Cleaning')?._id,
        name: 'Professional Home Cleaning',
        description: 'Complete home cleaning service including kitchen, bathroom, living areas, and bedrooms. Our professional team uses eco-friendly products and ensures thorough cleaning of all surfaces.',
                 price: 1500,
         originalPrice: 2000,
         featuredImage: 'https://example.com/cleaning-service.jpg',
        images: [
          {
            imageUrl: 'https://example.com/cleaning-1.jpg',
            altText: 'Kitchen cleaning',
            isPrimary: false
          },
          {
            imageUrl: 'https://example.com/cleaning-2.jpg',
            altText: 'Bathroom cleaning',
            isPrimary: false
          }
        ],
                 addons: addons.find(a => a.name.includes('Deep')) ? [
           {
             addonId: addons.find(a => a.name.includes('Deep'))._id,
             isRequired: false,
             defaultQuantity: 1
           }
         ] : [],
        duration: 120,
                 pincodes: ['400001', '400002', '400003'],
        features: [
          'Eco-friendly cleaning products',
          'Professional trained staff',
          'Satisfaction guaranteed',
          'Flexible scheduling',
          'Deep cleaning included'
        ],
        requirements: [
          'Access to water supply',
          '2-3 hours availability',
          'Clear access to all areas'
        ],
        instructions: 'Please ensure all areas are accessible and remove any valuable items before our team arrives.',
        cancellationPolicy: 'Free cancellation up to 24 hours before scheduled time.',
        availability: {
          isAvailable: true,
          availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
          availableTimeSlots: [
            { startTime: '09:00', endTime: '12:00' },
            { startTime: '14:00', endTime: '17:00' }
          ],
          maxBookingsPerDay: 5
        },
                 provider: workers.length > 0 ? {
           providerId: workers[0]._id,
           providerName: workers[0].name,
           providerRating: 4.5,
           providerExperience: 3
         } : undefined,
        tags: ['cleaning', 'home', 'professional', 'eco-friendly'],
        seo: {
          metaTitle: 'Professional Home Cleaning Service - Best in Mumbai',
          metaDescription: 'Get professional home cleaning service with eco-friendly products. Book now for thorough cleaning of kitchen, bathroom, and living areas.',
          keywords: ['home cleaning', 'professional cleaning', 'eco-friendly', 'Mumbai']
        },
        active: true,
        featured: true,
        popular: true
      },
      {
        categoryId: categories.find(c => c.name === 'Plumbing')?._id,
        name: 'Emergency Plumbing Repair',
        description: '24/7 emergency plumbing services for leaks, clogs, pipe repairs, and fixture installations. Our certified plumbers provide quick and reliable solutions.',
                 price: 800,
         featuredImage: 'https://example.com/plumbing-service.jpg',
        images: [
          {
            imageUrl: 'https://example.com/plumbing-1.jpg',
            altText: 'Pipe repair',
            isPrimary: false
          }
        ],
                 addons: addons.find(a => a.name.includes('Emergency')) ? [
           {
             addonId: addons.find(a => a.name.includes('Emergency'))._id,
             isRequired: true,
             defaultQuantity: 1
           }
         ] : [],
                 duration: 60,
         pincodes: ['400001', '400002', '400003', '400004'],
        features: [
          '24/7 emergency service',
          'Certified plumbers',
          'Quick response time',
          'Warranty on repairs',
          'Modern equipment'
        ],
        requirements: [
          'Clear access to plumbing area',
          'Water supply available',
          'Emergency contact number'
        ],
        instructions: 'In case of emergency, call our hotline immediately. Our team will arrive within 30 minutes.',
        cancellationPolicy: 'Emergency services cannot be cancelled.',
        availability: {
          isAvailable: true,
          availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          availableTimeSlots: [
            { startTime: '00:00', endTime: '23:59' }
          ],
          maxBookingsPerDay: 20
        },
                 provider: workers.length > 1 ? {
           providerId: workers[1]._id,
           providerName: workers[1].name,
           providerRating: 4.8,
           providerExperience: 5
         } : undefined,
        tags: ['plumbing', 'emergency', 'repair', '24/7'],
        seo: {
          metaTitle: 'Emergency Plumbing Repair - 24/7 Service in Mumbai',
          metaDescription: '24/7 emergency plumbing repair services. Quick response, certified plumbers, and reliable solutions for all plumbing issues.',
          keywords: ['emergency plumbing', 'plumbing repair', '24/7 service', 'Mumbai']
        },
        active: true,
        featured: true,
        popular: false
      },
      {
        categoryId: categories.find(c => c.name === 'Electrical')?._id,
        name: 'Electrical Installation & Repair',
        description: 'Professional electrical services including wiring, installation, repairs, and safety inspections. Our licensed electricians ensure safe and reliable electrical work.',
                 price: 1200,
         featuredImage: 'https://example.com/electrical-service.jpg',
        images: [
          {
            imageUrl: 'https://example.com/electrical-1.jpg',
            altText: 'Electrical wiring',
            isPrimary: false
          }
        ],
                 addons: addons.find(a => a.name.includes('Safety')) ? [
           {
             addonId: addons.find(a => a.name.includes('Safety'))._id,
             isRequired: false,
             defaultQuantity: 1
           }
         ] : [],
                 duration: 90,
         pincodes: ['400001', '400002', '400003', '400004', '400005'],
        features: [
          'Licensed electricians',
          'Safety certified',
          'Modern equipment',
          'Warranty on work',
          'Free consultation'
        ],
        requirements: [
          'Power supply available',
          'Clear access to electrical panels',
          'Safety equipment provided'
        ],
        instructions: 'Please ensure power is turned off in the work area. Our team will handle all safety measures.',
        cancellationPolicy: 'Free cancellation up to 2 hours before scheduled time.',
        availability: {
          isAvailable: true,
          availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
          availableTimeSlots: [
            { startTime: '08:00', endTime: '18:00' }
          ],
          maxBookingsPerDay: 8
        },
                 provider: workers.length > 2 ? {
           providerId: workers[2]._id,
           providerName: workers[2].name,
           providerRating: 4.6,
           providerExperience: 4
         } : undefined,
        tags: ['electrical', 'installation', 'repair', 'safety'],
        seo: {
          metaTitle: 'Electrical Installation & Repair - Licensed Electricians',
          metaDescription: 'Professional electrical installation and repair services by licensed electricians. Safe, reliable, and certified electrical work.',
          keywords: ['electrical installation', 'electrical repair', 'licensed electrician', 'safety']
        },
        active: true,
        featured: false,
        popular: true
      }
    ];

    // Create services
    const createdServices = [];
    for (const serviceData of sampleServices) {
      // Skip if category not found
      if (!serviceData.categoryId) {
        console.log(`⚠️ Skipping service "${serviceData.name}" - category not found`);
        continue;
      }

             // Remove provider if no workers available
       const serviceDataToCreate = { ...serviceData };
       if (!workers.length) {
         delete serviceDataToCreate.provider;
       }

       const service = await Service.create({
         ...serviceDataToCreate,
         createdBy: adminUser._id
       });
      createdServices.push(service);
      console.log(`✅ Created service: ${service.name} - ₹${service.price}`);
    }

    console.log(`\n🎉 Successfully created ${createdServices.length} sample services!`);
    console.log('\n📋 Sample Services:');
    createdServices.forEach(service => {
      console.log(`- ${service.name}: ₹${service.price} (${service.duration} mins)`);
      if (service.originalPrice && service.originalPrice > service.price) {
        console.log(`  💰 Discount: ${service.discountPercentage}% off`);
      }
    });

    console.log('\n🔗 You can now test the service endpoints:');
    console.log('- GET /api/services - Get all services');
    console.log('- GET /api/services/featured - Get featured services');
    console.log('- GET /api/services/popular - Get popular services');
    console.log('- GET /api/services/:id - Get specific service');
    console.log('- POST /api/services - Create service (Admin/Manager only)');
    console.log('- PUT /api/services/:id - Update service (Admin only)');
    console.log('- DELETE /api/services/:id - Delete service (Admin only)');

  } catch (error) {
    console.error('❌ Error creating sample services:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

createSampleServices();
