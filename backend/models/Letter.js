const mongoose = require('mongoose');

const letterSchema = new mongoose.Schema({
  senderRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional for 'bottle' or 'dybbuk' spectral letters
  receiverRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional for 'bottle' letters
  mailmanRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  content: { type: String, required: true },
  
  status: { 
    type: String, 
    enum: ['draft', 'pending', 'in-transit', 'delivered', 'ignored', 'burned', 'torn'], 
    default: 'draft' 
  },
  
  type: { 
    type: String, 
    enum: ['standard', 'bottle', 'dead', 'capsule', 'schrodinger', 'dybbuk', 'dibbyuk'], 
    default: 'standard' 
  },

  // Feature 25: Spectral / Fabricated Dybbuk Sender
  spectralSender: {
    name: { type: String },
    title: { type: String },
    avatar: { type: String },
    realmOrigin: { type: String }
  },

  // Feature 26: Schrödinger's Quantum Superposition Letter
  schrodingerVariants: [{
    mood: { type: String },
    label: { type: String },
    content: { type: String }
  }],
  schrodingerState: {
    type: String,
    enum: ['superposition', 'collapsed'],
    default: 'superposition'
  },
  collapsedVariant: {
    mood: { type: String },
    label: { type: String },
    content: { type: String }
  },
  collapsedAt: { type: Date },

  // Feature: Message in a Bottle & Ocean Drift
  isAnonymous: { type: Boolean, default: false },
  bottleMoniker: { type: String },
  bottleStyle: { 
    type: String, 
    enum: ['emerald', 'sapphire', 'amber', 'crystal'], 
    default: 'emerald' 
  },
  bottleWaxColor: { type: String, default: 'gold' },
  bottleDrift: {
    originLocation: {
      lat: { type: Number },
      lng: { type: Number },
      name: { type: String }
    },
    destinationLocation: {
      lat: { type: Number },
      lng: { type: Number },
      name: { type: String }
    },
    distanceKm: { type: Number, default: 0 },
    driftStatus: { 
      type: String, 
      enum: ['drifting', 'washed_ashore', 'uncorked'], 
      default: 'drifting' 
    },
    tossedAt: { type: Date },
    washedAshoreAt: { type: Date },
    uncorkedAt: { type: Date },
    tideLogs: [{
      timestamp: { type: Date, default: Date.now },
      stage: { type: String },
      text: { type: String },
      lat: { type: Number },
      lng: { type: Number }
    }]
  },
  
  // Timestamps & Read Status
  isRead: { type: Boolean, default: false },
  sealedAt: { type: Date }, // When the letter moved from draft -> pending (dispatched)
  pickedUpAt: { type: Date },
  deliveredAt: { type: Date },
  firstReadAt: { type: Date }, // When the receiver first opened a delivered letter
  scheduledFor: { type: Date }, // For time capsule

  // Game mechanics
  weatherDelayEvents: [{ type: String }],
  qrCodeToken: { type: String }, // Token to verify delivery
  burnAfterReading: { type: Boolean, default: false }, // Feature 22: ink fades & letter is destroyed after reading
  burnTimerSeconds: { type: Number, default: 60 }, // Configurable burn duration in seconds
  senderLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },

  // Typography & Script Aesthetics
  font: { type: String, default: 'Cinzel' },
  fontSize: { type: String, default: 'medium' },

  // Postmaster's Riddle & Recall / Tearing Mechanics
  isTorn: { type: Boolean, default: false },
  tornAt: { type: Date },
  recalledAt: { type: Date },
  postmasterRiddleAttempt: { 
    type: String, 
    enum: ['none', 'recalled', 'torn'], 
    default: 'none' 
  },

  // Trash / Soft Deletion Mechanics
  trashedBySender: { type: Boolean, default: false },
  trashedByReceiver: { type: Boolean, default: false },
  trashedAt: { type: Date },

  // Feature: The Dead Letter Office (Abandoned & Unclaimed Public Archive)
  isAbandoned: { type: Boolean, default: false },
  abandonedAt: { type: Date },
  abandonedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  abandonReason: { type: String, default: 'Forsaken by recipient in mailbox' }
}, { timestamps: true });

module.exports = mongoose.model('Letter', letterSchema);
