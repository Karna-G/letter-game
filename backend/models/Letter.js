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

  // Feature 27: Physical Freehand Handwritten Letters
  isHandwritten: { type: Boolean, default: false },
  handwrittenPages: [{
    pageNumber: { type: Number, default: 1 },
    imageData: { type: String }, // Base64 data URL of rendered canvas strokes
    strokesData: { type: String }, // Serialized JSON string of stroke vectors
    inkColor: { type: String, default: '#1A1A1A' },
    parchmentPaper: { type: String, default: 'vintage-cream' }
  }],
  handwritingStyle: { 
    type: String, 
    default: 'freehand' 
  },
  inkColor: { 
    type: String, 
    default: 'iron-gall' 
  },
  parchmentPaper: { 
    type: String, 
    default: 'vintage-cream' 
  },

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
  abandonReason: { type: String, default: 'Forsaken by recipient in mailbox' },

  // Feature: Delivery Proof to Central Hub
  deliveryProof: {
    status: { 
      type: String, 
      enum: ['none', 'pending_verification', 'verified', 'declined'], 
      default: 'none' 
    },
    authenticationCode: { type: String },
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    declinedReason: { type: String },
    penaltyApplied: { type: Boolean, default: false },
    mailmanRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    handoverCoordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Letter', letterSchema);
