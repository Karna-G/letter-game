const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// ============================================
// MIDDLEWARE: Verify JWT & extract user
// ============================================
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id || decoded._id || decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

function adminOnly(req, res, next) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Only the Royal Postmaster may proclaim notices.' });
  }
  next();
}

// ============================================
// GET /api/notices — All notices (public, newest first, pinned first)
// ============================================
router.get('/', async (req, res) => {
  try {
    const notices = await Notice.find()
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(100);
    res.json(notices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notices' });
  }
});

// ============================================
// POST /api/notices — Admin creates a notice
// ============================================
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { title, content, category, isPinned } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }

    const admin = await User.findById(req.userId).select('name');
    if (!admin) return res.status(404).json({ message: 'Admin user not found.' });

    const notice = new Notice({
      title: title.trim().slice(0, 120),
      content: content.trim().slice(0, 2000),
      category: category || 'announcement',
      isPinned: isPinned === true,
      postedBy: req.userId,
      postedByName: admin.name
    });

    await notice.save();

    // Broadcast via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('new-notice', notice);
    }

    res.status(201).json({ message: 'Notice proclaimed to the realm!', notice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to post notice' });
  }
});

// ============================================
// PATCH /api/notices/:id/pin — Admin toggles pin
// ============================================
router.patch('/:id/pin', authMiddleware, adminOnly, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ message: 'Notice not found.' });
    notice.isPinned = !notice.isPinned;
    await notice.save();

    const io = req.app.get('io');
    if (io) io.emit('notice-updated', notice);

    res.json({ message: notice.isPinned ? 'Notice pinned to the board.' : 'Notice unpinned.', notice });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle pin' });
  }
});

// ============================================
// DELETE /api/notices/:id — Admin deletes a notice
// ============================================
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) return res.status(404).json({ message: 'Notice not found.' });

    const io = req.app.get('io');
    if (io) io.emit('notice-deleted', { id: req.params.id });

    res.json({ message: 'Notice removed from the board.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete notice' });
  }
});

module.exports = router;
