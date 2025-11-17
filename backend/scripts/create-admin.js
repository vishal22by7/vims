const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

async function createAdmin() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vims';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    const email = 'admin@vims.com';
    const password = 'admin123456';
    const name = 'Admin User';
    
    console.log('\n🔧 Creating/Updating Admin Account...\n');

    // Check if admin already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      // Update to admin if exists
      if (existingUser.role !== 'admin') {
        existingUser.role = 'admin';
        await existingUser.save();
        console.log('✅ Existing user updated to admin');
      } else {
        console.log('ℹ️  User is already an admin');
      }
    } else {
      // Create new admin
      const passwordHash = await bcrypt.hash(password, 10);
      const admin = new User({
        name,
        email,
        passwordHash,
        role: 'admin'
      });
      await admin.save();
      console.log('✅ Admin user created successfully');
    }

    console.log('\n📝 Admin Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    ' + email);
    console.log('Password: ' + password);
    console.log('Role:     admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Admin account ready!');
    console.log('✅ Login at: http://localhost:3000/login');
    console.log('✅ Admin Dashboard: http://localhost:3000/admin');
    console.log('\n💡 Note: This is a fixed admin account for development\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();

