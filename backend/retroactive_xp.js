require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Letter = require('./models/Letter');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/postmaster_guild');
  console.log("Connected to MongoDB.");

  // Get all mailmen
  const mailmen = await User.find({ role: 'mailman' });
  console.log(`Found ${mailmen.length} mailmen.`);

  for (const mailman of mailmen) {
    // Count how many 'delivered' letters have this mailman's ID
    const deliveredCount = await Letter.countDocuments({
      mailmanRef: mailman._id,
      status: 'delivered'
    });

    if (deliveredCount > 0) {
      console.log(`Updating mailman ${mailman.name}: ${deliveredCount} deliveries.`);
      // Retroactively assign 15 XP per delivery
      mailman.deliveriesCompleted = deliveredCount;
      mailman.reputation = deliveredCount * 15;
      await mailman.save();
      console.log(`  -> New Stats: ${mailman.deliveriesCompleted} Deliveries, ${mailman.reputation} XP`);
    } else {
      console.log(`Mailman ${mailman.name} has 0 deliveries. Skipping.`);
    }
  }

  console.log("Finished retroactive update.");
  process.exit(0);
}

run().catch(console.error);
