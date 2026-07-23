const express = require('express');
const router = express.Router();
const Letter = require('../models/Letter');
const User = require('../models/User');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Get all letters where user is the Sender
router.get('/user/:userId', async (req, res) => {
  try {
    const letters = await Letter.find({
      senderRef: req.params.userId
    }).populate('senderRef', 'name').populate('receiverRef', 'name').populate('mailmanRef', 'name');
    res.json(letters);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sent letters' });
  }
});

// Get all delivered letters for a specific user's Mailbox
router.get('/mailbox/:userId', async (req, res) => {
  try {
    const letters = await Letter.find({
      receiverRef: req.params.userId,
      status: 'delivered'
    }).populate('senderRef', 'name').populate('receiverRef', 'name').populate('mailmanRef', 'name');
    res.json(letters);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching mailbox letters' });
  }
});

// Get active quests (letters in-transit) for a specific mailman
router.get('/mailman/:userId/active', async (req, res) => {
  try {
    const letters = await Letter.find({
      mailmanRef: req.params.userId,
      status: 'in-transit'
    }).populate('senderRef', 'name').populate('receiverRef', 'name');
    res.json(letters);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active quests' });
  }
});

// Create a new letter (or draft)
router.post('/', async (req, res) => {
  try {
    const { senderRef, receiverRef, content, type, scheduledFor, status } = req.body;
    
    // Only generate QR code token if it's being immediately dispatched ('pending')
    const initialStatus = status === 'draft' ? 'draft' : 'pending';
    const qrCodeToken = initialStatus === 'pending' ? uuidv4() : undefined;
    
    const letterData = {
      senderRef,
      content,
      type,
      scheduledFor,
      qrCodeToken,
      status: initialStatus
    };
    
    // Only add receiverRef if it's explicitly provided and not an empty string
    if (receiverRef && receiverRef.trim() !== '') {
      const query = receiverRef.trim();
      const user = await User.findOne({ 
        $or: [{ name: query }, { email: query }] 
      });
      
      if (user) {
        letterData.receiverRef = user._id;
      } else if (mongoose.Types.ObjectId.isValid(query)) {
        letterData.receiverRef = query;
      } else {
        return res.status(400).json({ message: `Could not find any user named "${query}" in the Guild.` });
      }
    }
    
    const newLetter = new Letter(letterData);
    await newLetter.save();
    res.status(201).json(newLetter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating letter' });
  }
});

// Update an existing letter (e.g. edit a draft, or dispatch a draft)
router.put('/:id', async (req, res) => {
  try {
    const { receiverRef, content, status } = req.body;
    const letter = await Letter.findById(req.params.id);
    
    if (!letter) return res.status(404).json({ message: 'Letter not found' });
    
    if (content) letter.content = content;
    
    if (receiverRef && receiverRef.trim() !== '') {
      const query = receiverRef.trim();
      const user = await User.findOne({ 
        $or: [{ name: query }, { email: query }] 
      });
      
      if (user) {
        letter.receiverRef = user._id;
      } else if (mongoose.Types.ObjectId.isValid(query)) {
        letter.receiverRef = query;
      } else {
        return res.status(400).json({ message: `Could not find any user named "${query}" in the Guild.` });
      }
    } else if (receiverRef === '') {
      letter.receiverRef = undefined; // Unset if explicitly empty
    }
    
    // If upgrading from draft to pending, generate the QR code
    if (letter.status === 'draft' && status === 'pending') {
      letter.status = 'pending';
      letter.qrCodeToken = uuidv4();
    }
    
    await letter.save();
    res.json(letter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating letter' });
  }
});

// Delete a drafted letter
router.delete('/:id', async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);
    if (!letter) return res.status(404).json({ message: 'Letter not found' });
    
    // Only allow deletion if it's a draft
    if (letter.status !== 'draft') {
      return res.status(400).json({ message: 'Only drafted letters can be deleted' });
    }
    
    await letter.deleteOne();
    res.json({ message: 'Draft deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting letter' });
  }
});

// Generic endpoint to scan a QR code
// It figures out what to do based on the user's role and the letter's current status
router.post('/scan', async (req, res) => {
  try {
    const { token, userId, role } = req.body;
    
    if (!token) return res.status(400).json({ message: 'Token is required' });
    
    const letter = await Letter.findOne({ qrCodeToken: token });
    if (!letter) {
      return res.status(404).json({ message: 'Invalid QR Code. No letter found.' });
    }
    
    // Scenario 1: Mailman scans a 'pending' letter -> Picks it up
    if (role === 'mailman' && letter.status === 'pending') {
      // If the mailman IS the receiver, just deliver it directly to their mailbox!
      if (letter.receiverRef && letter.receiverRef.toString() === userId) {
        letter.status = 'delivered';
        letter.deliveredAt = Date.now();
        await letter.save();
        return res.json({ message: 'You picked up a letter addressed to thee! It is now in thy Mailbox.', letter });
      }

      letter.mailmanRef = userId;
      letter.status = 'in-transit';
      letter.pickedUpAt = Date.now();
      await letter.save();
      return res.json({ message: 'Letter successfully picked up! Check thy Deliveries.', letter });
    }
    
    // Scenario 2: Receiver scans an 'in-transit' letter -> Delivers it
    if (letter.status === 'in-transit') {
      if (letter.receiverRef && letter.receiverRef.toString() !== userId) {
        return res.status(403).json({ message: 'This letter is not addressed to thee!' });
      }
      
      letter.status = 'delivered';
      letter.deliveredAt = Date.now();
      await letter.save();
      return res.json({ message: 'Letter successfully received! It is now in thy Mailbox.', letter });
    }
    
    if (letter.status === 'delivered') {
      return res.json({ message: 'Letter was already delivered.', letter });
    }
    
    res.status(400).json({ message: 'Action not allowed in current state.', letter });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error scanning QR code' });
  }
});

module.exports = router;
