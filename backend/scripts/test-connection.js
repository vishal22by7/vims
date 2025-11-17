const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔍 Testing MongoDB connection...');
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vims';
    
    // Mask password in log
    const maskedURI = mongoURI.replace(/:[^:@]+@/, ':****@');
    console.log('📝 Connection string:', maskedURI);
    console.log('');
    
    await mongoose.connect(mongoURI);
    console.log('✅ Successfully connected to MongoDB!');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    if (collections.length > 0) {
      console.log('📁 Existing collections:');
      collections.forEach(c => console.log('   -', c.name));
    } else {
      console.log('📁 No collections yet (database is empty)');
    }
    
    await mongoose.disconnect();
    console.log('✅ Connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('authentication')) {
      console.error('\n💡 Tip: Check your username and password in MONGODB_URI');
    } else if (error.message.includes('IP')) {
      console.error('\n💡 Tip: Add your IP address to MongoDB Atlas Network Access');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('timeout')) {
      console.error('\n💡 Tip: Check your internet connection and cluster URL');
    }
    
    process.exit(1);
  }
}

testConnection();

