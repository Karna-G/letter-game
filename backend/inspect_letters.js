require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Letter = require('./models/Letter');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/postmaster_guild');
  console.log("Connected to MongoDB.");

  const letters = await Letter.find().populate('senderRef receiverRef mailmanRef');
  
  console.log(`Found ${letters.length} letters total.`);
  for (const letter of letters) {
    console.log(`Letter ID: ${letter._id} | Status: ${letter.status}`);
    console.log(` - Sender: ${letter.senderRef?.name}`);
    console.log(` - Receiver: ${letter.receiverRef?.name || letter.receiverRef}`);
    console.log(` - Mailman: ${letter.mailmanRef?.name || 'NONE'}`);
  }

  process.exit(0);
}

run().catch(console.error);
