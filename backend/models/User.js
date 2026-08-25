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
  
  // Social/Community
  noteStatus: { type: String, default: '' },
  lastLogin: { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);
