// create-db.js
const mongoose = require('mongoose');
require('dotenv').config();

async function createDatabase() {
    try {
        console.log('🔌 Connecting to MongoDB Atlas...');
        await mongoose.connect(process.env.MONGO_URI);

        console.log('✅ Connected successfully!');
        console.log(`📚 Database: ${mongoose.connection.name}`);

        // Create a test collection with one document
        const testCollection = mongoose.connection.db.collection('_test');
        await testCollection.insertOne({
            test: true,
            createdAt: new Date(),
            message: 'This creates the database'
        });

        console.log('✅ Test document created!');
        console.log(`📚 Database "${mongoose.connection.name}" now exists in Atlas`);

        // Clean up test document
        await testCollection.deleteOne({ test: true });
        console.log('🧹 Test document cleaned up');

        // List all databases
        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        console.log('\n📊 All databases in your cluster:');
        dbs.databases.forEach(db => {
            console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
        });

        await mongoose.connection.close();
        console.log('\n🎉 Database setup complete!');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createDatabase();