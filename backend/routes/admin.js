const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const Letter = require('../models/Letter');

// 1. Promote to Admin (Backdoor)
router.get('/promote/:email', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { email: req.params.email }, 
      { role: 'admin' }, 
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Success! You are now the Postmaster General.', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error promoting user' });
  }
});

// 2. Get Campus Postal Stats
router.get('/stats', async (req, res) => {
  try {
    const totalStudents = await User.countDocuments(); // Counts everyone
    const totalMailmen = await User.countDocuments({ role: 'mailman' });
    const totalLetters = await Letter.countDocuments();
    const lettersInTransit = await Letter.countDocuments({ status: 'in-transit' });
    
    res.json({ totalStudents, totalMailmen, totalLetters, lettersInTransit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching campus stats' });
  }
});

// 3. The Overseer's Log (Upgraded to fetch actual names)
router.get('/letters', async (req, res) => {
  try {
    // .populate() tells the database to fetch the actual User data attached to the letter
    const recentLetters = await Letter.find()
      .sort({ createdAt: -1 })
      .populate('sender', 'name email')
      .populate('receiver', 'name email');
    res.json(recentLetters);
  } catch (error) {
    // Fallback just in case your teammates didn't set up the database relationships yet
    try {
        const recentLetters = await Letter.find().sort({ createdAt: -1 });
        res.json(recentLetters);
    } catch (fallbackError) {
        res.status(500).json({ message: 'Error fetching letters' });
    }
  }
});

// 4. Staff Directory
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// 5. Role Manager
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const updatedUser = await User.findByIdAndUpdate(req.params.id, { role: role }, { new: true });
    res.json({ message: 'Role updated successfully', user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating role' });
  }
});

// 6. NEW: THE BAN HAMMER
router.put('/users/:id/ban', async (req, res) => {
  try {
    const { years, days, hours, minutes } = req.body;
    
    // Calculate the exact future date they are banned until
    const banDate = new Date();
    banDate.setFullYear(banDate.getFullYear() + Number(years || 0));
    banDate.setDate(banDate.getDate() + Number(days || 0));
    banDate.setHours(banDate.getHours() + Number(hours || 0));
    banDate.setMinutes(banDate.getMinutes() + Number(minutes || 0));

    // Save the restriction to the database
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { restrictedUntil: banDate }, 
      { new: true }
    );
    res.json({ message: 'The Ban Hammer has spoken.', user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error banning user' });
  }
});

module.exports = router;