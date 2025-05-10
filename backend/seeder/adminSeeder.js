const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/admin');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zerowastemarket', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected for admin seeding'))
.catch(err => console.error('MongoDB connection error:', err));

// Admin accounts to seed
const admins = [
  {
    username: 'admin1',
    password: 'admin123',
    displayName: 'Administrator 1'
  },
  {
    username: 'superadmin',
    password: 'super123',
    displayName: 'Super Administrator'
  },
  {
    username: 'operator',
    password: 'operator123',
    displayName: 'System Operator'
  }
];

// Function to seed admins
const seedAdmins = async () => {
  try {
    // Clear existing admin accounts
    await Admin.deleteMany({});
    console.log('Previous admin accounts cleared');

    // Create new admin accounts with hashed passwords
    const adminPromises = admins.map(async admin => {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(admin.password, salt);

      return new Admin({
        username: admin.username,
        password: hashedPassword,
        displayName: admin.displayName
      });
    });

    const createdAdmins = await Promise.all(adminPromises);
    await Admin.insertMany(createdAdmins);

    console.log('Admin accounts seeded successfully:');
    createdAdmins.forEach(admin => {
      // Print admin info but don't show the hashed password for security
      console.log(`- Username: ${admin.username}, Display Name: ${admin.displayName}`);
    });

    // Close the connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error seeding admin accounts:', error);
    process.exit(1);
  }
};

// Run the seeder
seedAdmins();