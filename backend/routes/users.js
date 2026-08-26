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
router.post('/:id/friends/add', async (req, res) => {
  try {
    const { friendCode } = req.body; 
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
    if (friend._id.toString() === user._id.toString()) return res.status(400).json({ message: 'Thou cannot add thyself as a friend.' });
    if (user.friends.includes(friend._id)) return res.status(400).json({ message: 'This traveller is already in thy fellowship.' });

    // Add friend to array and save
    user.friends.push(friend._id);
    await user.save();

    res.json({ message: 'Friend added to thy fellowship!', friend: { _id: friend._id, name: friend.name, email: friend.email } });
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