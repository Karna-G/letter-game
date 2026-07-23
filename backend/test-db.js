const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

console.log('🧪 Testing MongoDB Atlas Connection...');
console.log('=====================================');

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('❌ MONGO_URI not found in .env file');
  process.exit(1);
}

// Mask the password for logging
const maskedUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//<username>:<password>@');
console.log(`📝 Connection string: ${maskedUri}`);

// Check connection type
if (uri.startsWith('mongodb+srv://')) {
  console.log('✅ Using SRV connection (recommended for Atlas)');
} else if (uri.startsWith('mongodb://')) {
  console.log('⚠️ Using standard TCP connection');
} else {
  console.error('❌ Invalid connection string format');
  process.exit(1);
}

// Check if database name is included
const dbName = uri.split('/').pop().split('?')[0];
if (dbName && !dbName.includes('.')) {
  console.log(`📚 Database name: ${dbName}`);
} else {
  console.warn('⚠️ No database name specified in connection string');
}

console.log('\n🔌 Attempting to connect...');

// Connection options
const options = {
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 15000,
  maxPoolSize: 10,
  family: 4,
  retryWrites: true,
  retryReads: true,
};

// Test the connection with retry logic
const testConnection = async (retries = 3, delay = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`\n🔄 Attempt ${attempt}/${retries}...`);

      const conn = await mongoose.connect(uri, options);

      console.log('\n✅ CONNECTION SUCCESSFUL!');
      console.log(`   Host: ${conn.connection.host}`);
      console.log(`   Database: ${conn.connection.name}`);
      console.log(`   Port: ${conn.connection.port}`);

      // Test database operations
      console.log('\n🔍 Testing database operations...');

      // Ping the database
      await mongoose.connection.db.admin().ping();
      console.log('   ✅ Ping successful');

      // List collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`   📊 Collections found: ${collections.length}`);
      if (collections.length > 0) {
        console.log(`   📁 Collections: ${collections.map(c => c.name).join(', ')}`);
      }

      console.log('\n🎉 All tests passed! Database is working correctly.');
      await mongoose.connection.close();
      console.log('👋 Connection closed');
      process.exit(0);

    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);

      if (attempt === retries) {
        console.error('\n❌ All connection attempts failed.');

        // Provide specific troubleshooting
        if (error.message.includes('whitelist')) {
          console.log('\n🔧 IP WHITELIST ISSUE:');
          console.log('   Your IP is not whitelisted in MongoDB Atlas.');
          console.log('   To fix:');
          console.log('   1. Go to MongoDB Atlas → Network Access');
          console.log('   2. Click "Add IP Address"');
          console.log('   3. Click "Add Current IP Address"');
          console.log('   4. Wait 30-60 seconds');
          console.log('   5. Try again');
        } else if (error.message.includes('authentication')) {
          console.log('\n🔧 AUTHENTICATION ISSUE:');
          console.log('   Check your username and password in the connection string.');
        } else if (error.message.includes('ECONNREFUSED')) {
          console.log('\n🔧 CONNECTION REFUSED:');
          console.log('   The hostname could not be resolved.');
          console.log('   Make sure you\'re using the correct cluster hostname.');
        } else if (error.message.includes('querySrv')) {
          console.log('\n🔧 SRV DNS ISSUE:');
          console.log('   The SRV record could not be resolved.');
          console.log('   Try using the TCP connection format instead.');
        }

        process.exit(1);
      }

      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Run the test
testConnection();