const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['sender', 'receiver', 'mailman', 'admin'], default: 'sender' },
  restrictedUntil: { type: Date, default: null }, //fahim's additional code for feature 7: User Restriction System
  
  // Geospatial location
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  
  // Reputation & Rewards
  reputationScore: { type: Number, default: 0 }, // Feature 8: Sender Reputation Score
  lettersSent: { type: Number, default: 0 }, // Count of dispatched (non-draft) letters, unlocks free stamps
  stamps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Stamp' }],
  
  // Mailman specific fields
  xp: { type: Number, default: 0 },
  rank: { type: String, default: 'Novice' },
  badges: [{ type: String }],
  deliveriesCompleted: { type: Number, default: 0 },
  
  // Social/Community & Feature: Interactive Cartographic Note Status
  noteStatus: { type: String, default: '' },
  noteStatusPrivacy: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
  noteStatusCreatedAt: { type: Date, default: null },
  noteStatusExpiresAt: { type: Date, default: null },
  noteStatusMood: { type: String, default: 'quill' },
  lastLogin: { type: Date, default: Date.now },
  
  // --- THE FRIENDS & REQUESTS SYSTEM ---
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequestsReceived: [{
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  friendRequestsSent: [{
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],

  // Feature 25: Dybbuk Letter Auto-Manifestation Mode
  dybbukMode: { type: Boolean, default: false },
  lastDybbukAt: { type: Date }
}, { timestamps: true });

userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);