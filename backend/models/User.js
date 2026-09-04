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
  penaltiesCount: { type: Number, default: 0 },
  deliveryPenalties: [{
    letterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Letter' },
    reason: { type: String },
    xpDeducted: { type: Number, default: 15 },
    penalizedAt: { type: Date, default: Date.now }
  }],
  
  // Social/Community & Feature: Interactive Cartographic Note Status
  noteStatus: { type: String, default: '' },
  noteStatusPrivacy: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
  noteStatusCreatedAt: { type: Date, default: null },
  noteStatusExpiresAt: { type: Date, default: null },
  noteStatusMood: { type: String, default: 'quill' },
  mailboxPet: { type: String, enum: ['pigeon', 'cat', 'fox', 'owl', 'none'], default: 'pigeon' },
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
  lastDybbukAt: { type: Date },

  // Feature: Letter Pickup Radius Alerts Preferences
  pickupAlertSettings: {
    enabled: { type: Boolean, default: true },
    radiusMeters: { type: Number, default: 250 },
    soundEnabled: { type: Boolean, default: true },
    notifyAllCouriers: { type: Boolean, default: false } // false: only when has pending letters; true: any postman
  }
}, { timestamps: true });

userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);