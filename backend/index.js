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

const User = require('./models/User');
const Letter = require('./models/Letter');

// In-memory active map users tracking: userId -> userData
const activeMapUsers = new Map();
// socketId -> userId
const userSocketMap = new Map();
// In-memory diary sessions: roomKey -> { currentWriterId, currentWriterName, activeUsers, inkContent, inkState }
const diarySessions = new Map();

// Attach io, activeMapUsers, and userSocketMap instances to express app
app.set('io', io);
app.set('activeMapUsers', activeMapUsers);
app.set('userSocketMap', userSocketMap);
app.set('diarySessions', diarySessions);

const { evaluateProximity } = require('./proximityService');

// ============================================
// ROUTES
// ============================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/letters', require('./routes/letters'));
app.use('/api/users', require('./routes/users'));
app.use('/api/test', require('./routes/test'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notices', require('./routes/notices')); // Feature: Community Notice Board
app.use('/api/gazettes', require('./routes/gazettes')); // Feature 17: Postmaster's Phantom Gazette

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

  // User registers their active presence anywhere in the application upon login / connection
  socket.on('register-user', async (data) => {
    if (!data || !data.userId) return;
    const userId = String(data.userId);
    userSocketMap.set(socket.id, userId);

    try {
      const userDoc = await User.findById(userId).select('name role rank xp reputationScore location pickupAlertSettings');
      if (!userDoc) return;

      const userLat = (typeof data.lat === 'number' && data.lat !== 0) 
        ? data.lat 
        : (userDoc.location?.coordinates?.[1] || 51.5074);
      const userLng = (typeof data.lng === 'number' && data.lng !== 0) 
        ? data.lng 
        : (userDoc.location?.coordinates?.[0] || -0.1278);

      if (typeof data.lat === 'number' && typeof data.lng === 'number' && (data.lat !== 0 || data.lng !== 0)) {
        await User.findByIdAndUpdate(userId, {
          location: { type: 'Point', coordinates: [data.lng, data.lat] }
        });
      }

      const userPayload = {
        socketId: socket.id,
        userId: userId,
        _id: userId,
        name: userDoc.name || data.name || 'Courier',
        role: userDoc.role || data.role || 'sender',
        rank: userDoc.rank || 'Royal Courier',
        xp: userDoc.xp || 0,
        reputationScore: userDoc.reputationScore || 0,
        lat: userLat,
        lng: userLng,
        location: { type: 'Point', coordinates: [userLng, userLat] },
        lastUpdated: Date.now()
      };

      activeMapUsers.set(userId, userPayload);
      console.log(`[REALM] User presence registered: "${userDoc.name}" (${userDoc.role}) [${userLat}, ${userLng}]`);

      // Broadcast new active user immediately to all open maps
      socket.broadcast.emit('user-joined-map', userPayload);
      io.emit('map-users-sync', Array.from(activeMapUsers.values()));

      // Evaluate proximity right away!
      evaluateProximity(userId, userLat, userLng, userDoc.role, io, activeMapUsers, userSocketMap);
    } catch (e) {
      console.error('Error registering user socket presence:', e);
    }
  });

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

    // 3. Evaluate real-time courier pickup proximity
    evaluateProximity(userId, data.lat, data.lng, userPayload.role, io, activeMapUsers, userSocketMap);
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
    const role = existing?.role || data.role || 'sender';

    if (existing) {
      existing.lat = data.lat;
      existing.lng = data.lng;
      existing.location = { type: 'Point', coordinates: [data.lng, data.lat] };
      existing.lastUpdated = Date.now();
      existing.socketId = socket.id;
      activeMapUsers.set(userId, existing);
    }
    userSocketMap.set(socket.id, userId);

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

    // Evaluate real-time courier pickup proximity
    evaluateProximity(userId, data.lat, data.lng, role, io, activeMapUsers, userSocketMap);
  });

  // Feature: Scribe sends an explicit Pickup Request to a specific real Mailman ("Please take my letter")
  socket.on('scribe-request-pickup', async (data) => {
    if (!data || !data.mailmanId || !data.senderId) return;
    const mailmanId = String(data.mailmanId);
    const senderId = String(data.senderId);

    try {
      const senderDoc = await User.findById(senderId).select('name role');
      const senderName = senderDoc?.name || data.senderName || 'Noble Scribe';

      // Find target mailman's connected socket(s)
      const mailmanSockets = [];
      for (const [sId, uId] of userSocketMap.entries()) {
        if (String(uId) === mailmanId) mailmanSockets.push(sId);
      }

      // Query letter details
      let letterInfo = null;
      if (data.letterId) {
        letterInfo = await Letter.findById(data.letterId).populate('receiverRef', 'name');
      } else {
        letterInfo = await Letter.findOne({ senderRef: senderId, status: 'pending' }).sort({ createdAt: -1 }).populate('receiverRef', 'name');
      }

      const requestPayload = {
        requestId: data.requestId || `req-${Date.now()}`,
        senderId: senderId,
        senderName: senderName,
        mailmanId: mailmanId,
        letterId: letterInfo?._id?.toString() || data.letterId || '',
        letterToken: letterInfo?.qrCodeToken || data.letterToken || '',
        letterRecipient: letterInfo?.receiverRef?.name || 'Intended Recipient',
        letterContentSnippet: letterInfo?.content ? (letterInfo.content.slice(0, 75) + '...') : 'Sealed Royal Missive',
        distanceMeters: typeof data.distanceMeters === 'number' ? data.distanceMeters : 0,
        message: data.message || `Noble Courier, please accept custody of my sealed missive.`,
        timestamp: new Date().toISOString()
      };

      console.log(`[HANDOVER REQUEST] Scribe "${senderName}" (${senderId}) sent pickup ping to Mailman (${mailmanId}). Sockets count: ${mailmanSockets.length}`);

      for (const sId of mailmanSockets) {
        io.to(sId).emit('courier-received-pickup-request', requestPayload);
      }
    } catch (err) {
      console.error('Error handling scribe-request-pickup:', err);
    }
  });

  // Feature: Mailman accepts or declines the Scribe's Pickup Request
  socket.on('mailman-respond-pickup', async (data) => {
    if (!data || !data.senderId || !data.mailmanId) return;
    const senderId = String(data.senderId);
    const mailmanId = String(data.mailmanId);
    const accepted = !!data.accepted;

    try {
      const senderSockets = [];
      for (const [sId, uId] of userSocketMap.entries()) {
        if (String(uId) === senderId) senderSockets.push(sId);
      }

      const mailmanDoc = await User.findById(mailmanId).select('name role');
      const mailmanName = mailmanDoc?.name || data.mailmanName || 'Royal Mailman';

      let letterToken = '';
      if (data.letterId) {
        const letter = await Letter.findById(data.letterId);
        if (letter) {
          letterToken = letter.qrCodeToken;
        }
      }

      const responsePayload = {
        requestId: data.requestId,
        accepted: accepted,
        mailmanId: mailmanId,
        mailmanName: mailmanName,
        letterId: data.letterId,
        letterToken: letterToken,
        message: accepted
          ? `🎉 Royal Mailman ${mailmanName} agreed to take thy missive! Present thy QR Seal for physical scanning.`
          : `Royal Mailman ${mailmanName} is currently unable to take thy letter.`
      };

      console.log(`[HANDOVER RESPONSE] Mailman "${mailmanName}" agreed=${accepted} to meet Scribe (${senderId}) for QR scan`);

      for (const sId of senderSockets) {
        io.to(sId).emit('scribe-pickup-response', responsePayload);
      }
    } catch (err) {
      console.error('Error handling mailman-respond-pickup:', err);
    }
  });

  // ============================================
  // --- TOM RIDDLE'S DIARY REAL-TIME PROTOCOL ---
  // ============================================

  // Join a 1-on-1 magical diary room
  socket.on('join-diary-session', (data) => {
    if (!data || !data.roomKey || !data.userId) return;
    const { roomKey, userId, userName } = data;
    const room = `diary:${roomKey}`;
    socket.join(room);

    let session = diarySessions.get(roomKey);
    if (!session) {
      session = {
        roomKey,
        currentWriterId: null,
        currentWriterName: null,
        activeUsers: new Map(), // userId -> { socketId, userName, isTyping: false }
        inkContent: '',
        inkState: 'blank' // 'blank' | 'writing' | 'inscribed' | 'absorbing'
      };
      diarySessions.set(roomKey, session);
    }

    session.activeUsers.set(String(userId), {
      socketId: socket.id,
      userId: String(userId),
      userName: userName || 'Fellow Scribe',
      lastSeen: Date.now()
    });

    const activeList = Array.from(session.activeUsers.values());

    // Send initial session state to user
    socket.emit('diary-session-state', {
      roomKey,
      currentWriterId: session.currentWriterId,
      currentWriterName: session.currentWriterName,
      activeUsers: activeList,
      inkContent: session.inkContent,
      inkState: session.inkState
    });

    // Notify others in the room
    socket.to(room).emit('diary-presence-update', {
      roomKey,
      activeUsers: activeList,
      event: 'user-joined',
      userName
    });

    console.log(`[DIARY] Scribe "${userName}" (${userId}) entered magical diary session "${roomKey}"`);
  });

  // Leave diary room
  socket.on('leave-diary-session', (data) => {
    if (!data || !data.roomKey || !data.userId) return;
    const { roomKey, userId, userName } = data;
    const room = `diary:${roomKey}`;
    socket.leave(room);

    const session = diarySessions.get(roomKey);
    if (session) {
      session.activeUsers.delete(String(userId));
      if (session.currentWriterId === String(userId)) {
        session.currentWriterId = null;
        session.currentWriterName = null;
        session.inkState = 'blank';
        io.to(room).emit('diary-lock-released', { roomKey });
      }

      const activeList = Array.from(session.activeUsers.values());
      socket.to(room).emit('diary-presence-update', {
        roomKey,
        activeUsers: activeList,
        event: 'user-left',
        userName
      });

      if (session.activeUsers.size === 0) {
        diarySessions.delete(roomKey);
      }
    }
  });

  // Acquire quill pen lock (concurrency control: only 1 writer at a time)
  socket.on('diary-request-lock', (data) => {
    if (!data || !data.roomKey || !data.userId) return;
    const { roomKey, userId, userName } = data;
    const room = `diary:${roomKey}`;
    const session = diarySessions.get(roomKey);

    if (!session) return;

    if (!session.currentWriterId || session.currentWriterId === String(userId)) {
      session.currentWriterId = String(userId);
      session.currentWriterName = userName || 'Fellow Scribe';
      session.inkState = 'writing';

      io.to(room).emit('diary-lock-acquired', {
        roomKey,
        currentWriterId: session.currentWriterId,
        currentWriterName: session.currentWriterName
      });
    } else {
      socket.emit('diary-lock-denied', {
        roomKey,
        heldBy: session.currentWriterName
      });
    }
  });

  // Release quill pen lock
  socket.on('diary-release-lock', (data) => {
    if (!data || !data.roomKey || !data.userId) return;
    const { roomKey, userId } = data;
    const room = `diary:${roomKey}`;
    const session = diarySessions.get(roomKey);

    if (session && session.currentWriterId === String(userId)) {
      session.currentWriterId = null;
      session.currentWriterName = null;
      session.inkState = 'blank';

      io.to(room).emit('diary-lock-released', { roomKey });
    }
  });

  // Streaming real-time ink draft keystrokes
  socket.on('diary-ink-update', (data) => {
    if (!data || !data.roomKey || !data.userId) return;
    const { roomKey, userId, inkText } = data;
    const room = `diary:${roomKey}`;
    const session = diarySessions.get(roomKey);

    if (session && session.currentWriterId === String(userId)) {
      session.inkContent = inkText;
      socket.to(room).emit('diary-ink-stream', {
        roomKey,
        userId,
        inkText
      });
    }
  });

  // Inscribe text into parchment: triggers absorption and fading animation
  socket.on('diary-submit-ink', (data) => {
    if (!data || !data.roomKey || !data.userId) return;
    const { roomKey, userId, userName, inkText } = data;
    const room = `diary:${roomKey}`;
    const session = diarySessions.get(roomKey);

    if (session && session.currentWriterId === String(userId)) {
      session.inkContent = inkText;
      session.inkState = 'absorbing';

      io.to(room).emit('diary-ink-inscribed', {
        roomKey,
        authorId: userId,
        authorName: userName || 'Fellow Scribe',
        inkText,
        inscribedAt: Date.now()
      });
    }
  });

  // Ink has finished fading & absorbing: resets page to blank and yields turn
  socket.on('diary-ink-erased', (data) => {
    if (!data || !data.roomKey) return;
    const { roomKey } = data;
    const room = `diary:${roomKey}`;
    const session = diarySessions.get(roomKey);

    if (session) {
      session.inkContent = '';
      session.inkState = 'blank';
      session.currentWriterId = null;
      session.currentWriterName = null;

      io.to(room).emit('diary-page-cleared', {
        roomKey,
        clearedAt: Date.now()
      });
    }
  });

  // User explicitly leaves the map, disables location, or logs out
  socket.on('leave-map', async (data) => {
    const userId = data?.userId ? String(data.userId) : userSocketMap.get(socket.id);
    if (userId) {
      activeMapUsers.delete(userId);
      userSocketMap.delete(socket.id);

      // Clean up any active diary sessions this user was in
      for (const [rKey, sess] of diarySessions.entries()) {
        if (sess.activeUsers.has(userId)) {
          sess.activeUsers.delete(userId);
          if (sess.currentWriterId === userId) {
            sess.currentWriterId = null;
            sess.currentWriterName = null;
            sess.inkState = 'blank';
            io.to(`diary:${rKey}`).emit('diary-lock-released', { roomKey: rKey });
          }
          io.to(`diary:${rKey}`).emit('diary-presence-update', {
            roomKey: rKey,
            activeUsers: Array.from(sess.activeUsers.values()),
            event: 'user-left'
          });
        }
      }

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
      
      // Clean up any active diary sessions
      for (const [rKey, sess] of diarySessions.entries()) {
        if (sess.activeUsers.has(userId)) {
          sess.activeUsers.delete(userId);
          if (sess.currentWriterId === userId) {
            sess.currentWriterId = null;
            sess.currentWriterName = null;
            sess.inkState = 'blank';
            io.to(`diary:${rKey}`).emit('diary-lock-released', { roomKey: rKey });
          }
          io.to(`diary:${rKey}`).emit('diary-presence-update', {
            roomKey: rKey,
            activeUsers: Array.from(sess.activeUsers.values()),
            event: 'user-left'
          });
        }
      }

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

// Graceful shutdown handlers (ensures port 5000 is released cleanly on Windows & nodemon restarts)
function gracefulShutdown(signal) {
  server.close(() => {
    if (signal === 'SIGUSR2') {
      process.kill(process.pid, 'SIGUSR2');
    } else {
      process.exit(0);
    }
  });
}

process.once('SIGUSR2', () => gracefulShutdown('SIGUSR2'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));