const express = require('express');
const router = express.Router();
const Gazette = require('../models/Gazette');
const { checkAndGenerateGazettes, generateSpecialGazette } = require('../gazetteEngine');
const jwt = require('jsonwebtoken');

// Middleware: Authenticate User
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No authentication token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.id || decoded._id || decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// GET /api/gazettes — Get all gazette editions for user (auto-generates pending)
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Auto-check and generate any seasonal or milestone editions
    await checkAndGenerateGazettes(req.userId);

    const gazettes = await Gazette.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Gazette.countDocuments({ userId: req.userId, isRead: false });

    res.json({
      gazettes,
      unreadCount,
      totalCount: gazettes.length
    });
  } catch (err) {
    console.error('Error fetching gazettes:', err);
    res.status(500).json({ error: 'Server error fetching Phantom Gazettes' });
  }
});

// GET /api/gazettes/unread-count — For fast navbar badge lookup
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    // Also trigger background check
    await checkAndGenerateGazettes(req.userId);
    const count = await Gazette.countDocuments({ userId: req.userId, isRead: false });
    res.json({ unreadCount: count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching unread gazettes count' });
  }
});

// GET /api/gazettes/latest — Get user's most recent gazette edition
router.get('/latest', authMiddleware, async (req, res) => {
  try {
    await checkAndGenerateGazettes(req.userId);

    const latest = await Gazette.findOne({ userId: req.userId })
      .sort({ createdAt: -1 });

    if (!latest) {
      return res.status(404).json({ message: 'No Gazette editions available yet.' });
    }

    res.json(latest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching latest Gazette' });
  }
});

// GET /api/gazettes/:id — Get specific edition
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const gazette = await Gazette.findOne({ _id: req.params.id, userId: req.userId });
    if (!gazette) {
      return res.status(404).json({ message: 'Gazette edition not found' });
    }
    res.json(gazette);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching Gazette edition' });
  }
});

// PATCH /api/gazettes/:id/read — Mark edition as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const gazette = await Gazette.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!gazette) {
      return res.status(404).json({ message: 'Gazette edition not found' });
    }

    res.json({
      message: 'Gazette marked as read in the Sovereign Archive',
      gazette
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error marking Gazette as read' });
  }
});

// POST /api/gazettes/generate-special — Summon a special on-demand bulletin
router.post('/generate-special', authMiddleware, async (req, res) => {
  try {
    const specialGazette = await generateSpecialGazette(req.userId);
    res.status(201).json({
      message: '📰 An extraordinary Gazette Broadside has rolled off the Postmaster’s printing press!',
      gazette: specialGazette
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error generating special Gazette' });
  }
});

module.exports = router;