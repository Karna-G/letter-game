const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Letter = require('../models/Letter');

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

// Get user profile by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching user profile' });
  }
});

module.exports = router;
