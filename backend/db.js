const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const net = require('net');
require('dotenv').config();

let mongoServer;

/**
 * Fast TCP probe to check if a local port is actively accepting connections
 */
function isPortOpen(host, port, timeoutMs = 600) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);

    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });

    try {
      socket.connect(port, host);
    } catch {
      resolve(false);
    }
  });
}

const connectDB = async () => {
  let uri = process.env.MONGO_URI;

  try {
    // 1. If no URI provided, start in-memory server immediately
    if (!uri) {
      console.log('📦 No MONGO_URI provided in .env, starting in-memory MongoDB server...');
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      console.log(`✅ In-memory MongoDB active at: ${uri}`);
    } else if (uri.includes('127.0.0.1:27017') || uri.includes('localhost:27017')) {
      // 2. Fast check if local MongoDB daemon is actually running
      const portOpen = await isPortOpen('127.0.0.1', 27017, 500);
      if (!portOpen) {
        console.log('ℹ️  Local MongoDB service not detected on port 27017.');
        console.log('🔄 Launching embedded in-memory MongoDB for local development...');
        mongoServer = await MongoMemoryServer.create();
        uri = mongoServer.getUri();
      }
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10,
    });

    if (mongoServer) {
      console.log(`✅ Embedded In-Memory MongoDB ready at: ${uri}`);
      console.log(`💡 Tip: To use a persistent database, add your MongoDB Atlas URI to backend/.env`);
    } else {
      console.log(`✅ MongoDB Connected Successfully!`);
      console.log(`   Host: ${conn.connection.host}`);
      console.log(`   Database: ${conn.connection.name}`);
    }

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    return conn;
  } catch (error) {
    if (!mongoServer) {
      try {
        console.warn(`⚠️ Could not connect to '${uri}' (${error.message}).`);
        console.log('🔄 Launching embedded in-memory MongoDB fallback...');
        mongoServer = await MongoMemoryServer.create();
        const memUri = mongoServer.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`✅ In-memory MongoDB connected successfully at: ${memUri}`);
        return conn;
      } catch (memErr) {
        console.error(`❌ In-memory MongoDB fallback error: ${memErr.message}`);
      }
    }
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
