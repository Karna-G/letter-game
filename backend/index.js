const express = require('express');
const http = require('http');
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

// ============================================
// ROUTES - Add all your routes here
// ============================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/letters', require('./routes/letters'));

// Test route
app.use('/api/test', require('./routes/test'));

// Basic status route
app.get('/api/status', (req, res) => {
  res.json({
    status: 'Backend is running',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    database: mongoose.connection.name || 'Not connected'
  });
});

// ============================================
// SOCKET.IO CONFIGURATION
// ============================================
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('update-location', (data) => {
    io.emit(`location-update-${data.mailmanId}`, data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// ============================================
// START SERVER - Listen on all interfaces
// ============================================
const PORT = process.env.PORT || 5000;

// Listen on 0.0.0.0 to accept connections from any IP
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`🌐 http://127.0.0.1:${PORT}`);
  console.log(`🌐 http://${require('os').networkInterfaces()['Ethernet']?.[0]?.address || 'your-ip'}:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});