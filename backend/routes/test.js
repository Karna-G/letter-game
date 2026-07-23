const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Test route to check database connection
router.get('/db-status', async (req, res) => {
    try {
        const usersCount = await User.countDocuments();
        res.json({
            status: 'Database is connected',
            usersCount: usersCount,
            database: 'letter-game',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
            status: 'Database error'
        });
    }
});

// Simple ping test
router.get('/ping', (req, res) => {
    res.json({
        message: 'pong',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;