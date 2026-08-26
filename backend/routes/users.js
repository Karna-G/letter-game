const express = require('express');
const mongoose = require('mongoose'); // Added so we can validate ID codes
const router = express.Router();
const User = require('../models/User');
const Letter = require('../models/Letter');
const Report = require('../models/Report'); // --- NEW: Importing the Report blueprint

// Get directory of all mailmen and their service history
router.get('/mailmen', async (req, res) => {
  try {
    const mailmen = await User.find({ role: 'mailman' }).select('-password -location');
    
    const mailmenWithHistory = await Promise.all(mailmen.map(async (mailman) => {
      // Find all delivered letters by this mailman, populate sender and receiver
      const letters = await Letter.find({ mailmanRef: mailman._id, status: 'delivered' })
        .populate('senderRef', 'name')
        .populate('receiverRef', 'name');
        
      const sendersServiced = new Map();
      const receiversServiced = new Map();
      
      letters.forEach(letter => {
        if (letter.senderRef) {
          sendersServiced.set(letter.senderRef._id.toString(), letter.senderRef.name);
        }
        if (letter.receiverRef && letter.receiverRef.name) {
          receiversServiced.set(letter.receiverRef._id.toString(), letter.receiverRef.name);
        }
      });
      
      return {
        _id: mailman._id,
        name: mailman.name,
        reputationScore: mailman.reputationScore,
        rank: mailman.rank,
        xp: mailman.xp,
        badges: mailman.badges,
        deliveriesCompleted: mailman.deliveriesCompleted,
        servicedSenders: Array.from(sendersServiced.values()),
        servicedReceivers: Array.from(receiversServiced.values()),
      };
    }));
    
    res.json(mailmenWithHistory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching mailmen directory' });
  }
});

// Feature 11: Guild Leaderboards — top mailmen (by XP) & top senders (by reputation)
// Must be declared before the generic '/:id' route below.
router.get('/leaderboard', async (req, res) => {
  try {
    const topMailmen = await User.find({ role: 'mailman' })
      .select('name xp rank deliveriesCompleted badges')
      .sort({ xp: -1 })
      .limit(10);

    const topSenders = await User.find({ role: 'sender' })
      .select('name reputationScore lettersSent')
      .sort({ reputationScore: -1 })
      .limit(10);

    res.json({
      mailmanOfTheMonth: topMailmen.length > 0 ? topMailmen[0] : null,
      topMailmen,
      topSenders
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching leaderboard' });
  }
});

// ============================================
// --- NEW: THE REPORT SYSTEM ---
// ============================================
router.post('/report', async (req, res) => {
  try {
    const { reporterId, reportedUserId, reason } = req.body;
    
    // Create the formal report document
    const newReport = new Report({
      reporter: reporterId,
      reportedUser: reportedUserId,
      reason: reason
    });
    
    await newReport.save();
    res.json({ message: 'Report submitted successfully. The Guild Tribunal will review this matter.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error submitting report' });
  }
});

// Admin: Fetch all reports for the Tribunal
router.get('/reports/all', async (req, res) => {
  try {
    // We 'populate' so the Admin sees actual names, not just random ID numbers
    const reports = await Report.find()
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email role')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching reports' });
  }
});

// Admin: Resolve or Dismiss a report
// Admin: Verdict Delivery
router.post('/reports/:id/verdict', async (req, res) => {
  try {
    const Letter = require('../models/Letter');
    const Report = require('../models/Report');
    const User = require('../models/User'); // We need the User blueprint!
    
    const { message, reporterId } = req.body;
    
    // 1. Completely ignore the browser. Find the REAL Admin in the database!
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) return res.status(500).json({ error: 'No Admin account found in DB!' });

    // 2. Force create the letter using the Admin's true ID
    const newLetter = new Letter({
      senderRef: adminUser._id,
      receiverRef: reporterId,
      content: message, // Sending exactly what you typed!
      type: 'standard',
      status: 'delivered',
      deliveredAt: new Date()
    });
    await newLetter.save();
    
    // 3. Mark the report as resolved
    await Report.findByIdAndUpdate(req.params.id, { status: 'resolved' });
    
    res.json({ message: 'God Mode Verdict Delivered' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error sending verdict' });
  }
});
// ============================================
// --- NEW: THE FRIENDS SYSTEM ---
// ============================================

// 1. Fetch a user's friends list
router.get('/:id/friends', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('friends', 'name email role reputationScore');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json(user.friends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching friends' });
  }
});

// 2. Add a new friend via ID code or Email
// 2. Add a new friend via ID code or Email (MUTUAL FRIENDSHIP ENABLED)
router.post('/:id/friends/add', async (req, res) => {
  try {
    // We use .trim() to destroy any invisible spaces you accidentally pasted!
    const friendCode = req.body.friendCode.trim(); 
    const user = await User.findById(req.params.id);
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Try to find the friend by email first
    let friend = await User.findOne({ email: friendCode });
    
    // If not an email, check if they pasted a MongoDB ID Code
    if (!friend && mongoose.Types.ObjectId.isValid(friendCode)) {
        friend = await User.findById(friendCode);
    }

    // Safety checks
    if (!friend) return res.status(404).json({ message: 'No traveller found with that code or scroll address.' });
    
    // Strict comparison to prevent the "add thyself" bug
    if (friend._id.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'Thou cannot add thyself! (Make sure you copied your friend\'s code, not yours!)' });
    }
    
    if (user.friends.includes(friend._id)) {
      return res.status(400).json({ message: 'This traveller is already in thy fellowship.' });
    }

    // --- MUTUAL UPGRADE ---
    // 1. Add friend to YOUR array
    user.friends.push(friend._id);
    await user.save();

    // 2. Automatically add YOU to THEIR array!
    if (!friend.friends.includes(user._id)) {
      friend.friends.push(user._id);
      await friend.save();
    }

    res.json({ message: 'Friendship forged! Ye are mutually bound.', friend: { _id: friend._id, name: friend.name, email: friend.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error adding friend' });
  }
});
// ============================================
// Get user profile by ID (Must remain at bottom)
// ============================================
router.get('/:id', async (req, res) => {
  try {
    // Populate friends so the frontend profile instantly has them
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('friends', 'name email role reputationScore');
      
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching user profile' });
  }
});

module.exports = router;