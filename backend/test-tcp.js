const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

console.log('🔍 Testing TCP connection to MongoDB Atlas...\n');

// First, get the replica set name
async function getReplicaSetName() {
    const uri = 'mongodb://karnaghose_db_user:2oiaCKN9xN4VYOAJ@ac-uvktxid-shard-00-00.seznlfo.mongodb.net:27017,ac-uvktxid-shard-00-01.seznlfo.mongodb.net:27017,ac-uvktxid-shard-00-02.seznlfo.mongodb.net:27017/?ssl=true&authSource=admin';

    console.log('📡 Connecting to get replica set name...');
    const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        family: 4,
    });

    try {
        await client.connect();
        console.log('✅ Connected successfully!\n');

        const adminDb = client.db('admin');
        const status = await adminDb.command({ replSetGetStatus: 1 });
        const replicaSetName = status.set;

        console.log(`📊 Replica Set Name: ${replicaSetName}`);
        console.log(`📊 Members: ${status.members.length}\n`);

        await client.close();
        return replicaSetName;
    } catch (error) {
        console.error('❌ Error getting replica set:', error.message);
        if (error.message.includes('whitelist')) {
            console.log('\n🔧 Please whitelist your IP in MongoDB Atlas:');
            console.log('   1. Go to MongoDB Atlas → Network Access');
            console.log('   2. Click "Add IP Address"');
            console.log('   3. Click "Add Current IP Address"');
            console.log('   4. Wait 30 seconds and try again');
        }
        process.exit(1);
    }
}

// Test the connection with the TCP string
async function testTCPConnection(replicaSetName) {
    // Build the TCP connection string
    const tcpUri = `mongodb://karnaghose_db_user:2oiaCKN9xN4VYOAJ@ac-uvktxid-shard-00-00.seznlfo.mongodb.net:27017,ac-uvktxid-shard-00-01.seznlfo.mongodb.net:27017,ac-uvktxid-shard-00-02.seznlfo.mongodb.net:27017/letter-game?ssl=true&replicaSet=${replicaSetName}&authSource=admin&retryWrites=true&w=majority`;

    console.log('📡 Testing TCP connection...');
    console.log(`🔗 Connection string (masked): ${tcpUri.replace(/\/\/[^:]+:[^@]+@/, '//<username>:<password>@')}\n`);

    try {
        const conn = await mongoose.connect(tcpUri, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 15000,
            family: 4,
            maxPoolSize: 10,
        });

        console.log('✅ CONNECTION SUCCESSFUL! 🎉');
        console.log(`   Host: ${conn.connection.host}`);
        console.log(`   Database: ${conn.connection.name}`);
        console.log(`   Port: ${conn.connection.port}`);
        console.log(`   Connection State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);

        // Test database operations
        console.log('\n🔍 Testing database operations...');

        // List collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`   📁 Collections found: ${collections.length}`);
        if (collections.length > 0) {
            console.log(`   📁 Collections: ${collections.map(c => c.name).join(', ')}`);
        }

        // Ping the database
        await mongoose.connection.db.admin().ping();
        console.log('   ✅ Ping successful');

        console.log('\n🎉 All tests passed! Database is working correctly.');
        console.log('\n📋 Use this in your .env file:');
        console.log(`MONGO_URI=${tcpUri}`);
        console.log('JWT_SECRET=super_secret_postmaster_key');
        console.log('PORT=5000');

        await mongoose.connection.close();
        console.log('\n👋 Connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        if (error.message.includes('whitelist')) {
            console.log('   Your IP needs to be whitelisted in MongoDB Atlas');
            console.log('   Go to MongoDB Atlas → Network Access → Add IP Address');
        } else if (error.message.includes('authentication')) {
            console.log('   Check your username and password');
        }
        process.exit(1);
    }
}

// Main function
async function main() {
    console.log('🚀 Starting connection test...\n');
    console.log('====================================\n');

    // Get replica set name
    const replicaSetName = await getReplicaSetName();

    // Test TCP connection
    await testTCPConnection(replicaSetName);
}

main().catch(console.error);