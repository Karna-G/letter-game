const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./db');

const app = express();

// Connect to MongoDB Atlas
connectDB();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Attach io and activeMapUsers instances to express app
app.set('io', io);

const User = require('./models/User');

// In-memory active map users tracking: userId -> userData
const activeMapUsers = new Map();
// socketId -> userId
const userSocketMap = new Map();

app.set('activeMapUsers', activeMapUsers);

// Clear stale ghost coordinates on startup
mongoose.connection.once('open', async () => {
  try {
    await User.updateMany({}, { location: { type: 'Point', coordinates: [0, 0] } });
  } catch (e) {}
});

// ============================================
// ROUTES
// ============================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/letters', require('./routes/letters'));
app.use('/api/users', require('./routes/users'));
app.use('/api/test', require('./routes/test'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notices', require('./routes/notices')); // Feature: Community Notice Board

// Basic status route
app.get('/api/status', (req, res) => {
  res.json({
    status: 'Backend is running',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    database: mongoose.connection.name || 'Not connected',
    activeMapUsersCount: activeMapUsers.size
  });
});

// ============================================
// SERVE REACT FRONTEND IN PRODUCTION
// ============================================
const frontendBuild = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendBuild));

// For any route not matched by the API, send the React app
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(frontendBuild, 'index.html'));
});

// ============================================
// SOCKET.IO CONFIGURATION (Real-Time Realm Presence)
// ============================================
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // User joins live realm map with coordinates
  socket.on('join-map', async (data) => {
    if (!data || !data.userId || typeof data.lat !== 'number' || typeof data.lng !== 'number') return;
    const userId = String(data.userId);

    const userPayload = {
      socketId: socket.id,
      userId: userId,
      _id: userId,
      name: data.name || 'Anonymous Guild Member',
      role: data.role || 'sender',
      rank: data.rank || 'Novice',
      xp: data.xp || 0,
      reputationScore: data.reputationScore || 0,
      noteStatus: data.noteStatus || '',
      noteStatusPrivacy: data.noteStatusPrivacy || 'public',
      noteStatusExpiresAt: data.noteStatusExpiresAt || null,
      noteStatusMood: data.noteStatusMood || 'quill',
      lat: data.lat,
      lng: data.lng,
      location: {
        type: 'Point',
        coordinates: [data.lng, data.lat]
      },
      lastUpdated: Date.now()
    };

    activeMapUsers.set(userId, userPayload);
    userSocketMap.set(socket.id, userId);

    // Save coordinates in DB
    try {
      await User.findByIdAndUpdate(userId, {
        location: { type: 'Point', coordinates: [data.lng, data.lat] }
      });
    } catch (e) {}

    // 1. Sync full active user list to the joining user
    const allActive = Array.from(activeMapUsers.values());
    socket.emit('map-users-sync', allActive);

    // 2. Broadcast this new user instantly to everyone else on the map
    socket.broadcast.emit('user-joined-map', userPayload);
  });

  // User updates their live note status in real-time
  socket.on('update-note-status', (data) => {
    if (!data || !data.userId) return;
    const userId = String(data.userId);
    const existing = activeMapUsers.get(userId);
    if (existing) {
      existing.noteStatus = data.noteStatus || '';
      existing.noteStatusPrivacy = data.noteStatusPrivacy || 'public';
      existing.noteStatusExpiresAt = data.noteStatusExpiresAt || null;
      existing.noteStatusMood = data.noteStatusMood || 'quill';
      activeMapUsers.set(userId, existing);
    }
    io.emit('user-note-updated', {
      userId,
      noteStatus: data.noteStatus || '',
      noteStatusPrivacy: data.noteStatusPrivacy || 'public',
      noteStatusExpiresAt: data.noteStatusExpiresAt || null,
      noteStatusMood: data.noteStatusMood || 'quill'
    });
  });

  // User updates their live GPS location as they physically move
  socket.on('update-location', async (data) => {
    if (!data || !data.userId || typeof data.lat !== 'number' || typeof data.lng !== 'number') return;
    const userId = String(data.userId);

    const existing = activeMapUsers.get(userId);
    if (existing) {
      existing.lat = data.lat;
      existing.lng = data.lng;
      existing.location = { type: 'Point', coordinates: [data.lng, data.lat] };
      existing.lastUpdated = Date.now();
      existing.socketId = socket.id;
      activeMapUsers.set(userId, existing);
    }

    // Broadcast live coordinates to all other clients instantly
    socket.broadcast.emit('user-moved', {
      userId: userId,
      lat: data.lat,
      lng: data.lng,
      location: { type: 'Point', coordinates: [data.lng, data.lat] }
    });

    // Save to DB asynchronously
    try {
      await User.findByIdAndUpdate(userId, {
        location: { type: 'Point', coordinates: [data.lng, data.lat] }
      });
    } catch (e) {}
  });

  // User explicitly leaves the map, disables location, or logs out
  socket.on('leave-map', async (data) => {
    const userId = data?.userId ? String(data.userId) : userSocketMap.get(socket.id);
    if (userId) {
      activeMapUsers.delete(userId);
      userSocketMap.delete(socket.id);

      // Clear coordinates in DB
      try {
        await User.findByIdAndUpdate(userId, {
          location: { type: 'Point', coordinates: [0, 0] }
        });
      } catch (e) {}

      // Broadcast removal instantly to all other clients
      io.emit('user-left-map', { userId: userId });
      console.log(`[MAP] User left & removed from realm: ${userId}`);
    }
  });

  // Socket disconnected (tab closed, navigating away, network dropped)
  socket.on('disconnect', async () => {
    console.log('User socket disconnected:', socket.id);
    const userId = userSocketMap.get(socket.id);
    if (userId) {
      userSocketMap.delete(socket.id);
      
      // Check if user still has another active socket (e.g. page transition or multi-tab)
      const stillActive = Array.from(userSocketMap.values()).includes(userId);
      if (!stillActive) {
        activeMapUsers.delete(userId);
        try {
          await User.findByIdAndUpdate(userId, {
            location: { type: 'Point', coordinates: [0, 0] }
          });
        } catch (e) {}

        // Broadcast removal instantly
        io.emit('user-left-map', { userId: userId });
        console.log(`[MAP] User completely offline & removed: ${userId}`);
      }
    }
  });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});