const mongoose = require('mongoose');

const thoughtSchema = new mongoose.Schema({
  userRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  authorAlias: { type: String, default: 'A Wandering Soul' },
  avatarIcon: { type: String, default: '🕯️' },
  content: { type: String, required: true },
  inkColor: { type: String, default: '#D4AF37' },
  resonanceBadge: { type: String, default: '🕯️' },
  createdAt: { type: Date, default: Date.now }
});

const resonatorSchema = new mongoose.Schema({
  userRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reaction: { 
    type: String, 
    enum: ['fire', 'rose', 'withered', 'neutral'], 
    required: true 
  },
  createdAt: { type: Date, default: Date.now }
});

const namelessLetterSchema = new mongoose.Schema({
  // Private sender reference solely for the author to see "My Nameless Letters"
  // NEVER exposed publicly in API responses
  senderRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Topic of the letter chosen by the author
  topic: { type: String, default: 'Whisper of the Realm', trim: true },
  
  authorAlias: { type: String, default: 'A Nameless Scribe' },
  authorAvatarIcon: { type: String, default: '🕯️' },
  
  content: { type: String, required: true },
  font: { type: String, default: 'Cinzel' },
  fontSize: { type: String, default: 'medium' },
  
  // Feature: Freehand Handwritten Manuscript
  isHandwritten: { type: Boolean, default: false },
  handwrittenPages: [{
    pageNumber: { type: Number, default: 1 },
    imageData: { type: String },
    strokesData: { type: String },
    inkColor: { type: String, default: '#1A1A1A' },
    parchmentPaper: { type: String, default: 'vintage-cream' }
  }],
  
  inkColor: { type: String, default: 'iron-gall' },
  parchmentPaper: { type: String, default: 'vintage-cream' },
  sealColor: { type: String, default: '#7A1E2E' },
  sealStamp: { type: String, default: 'wax-seal' },
  
  ambientTheme: { 
    type: String, 
    enum: ['midnight', 'candlelight', 'ethereal', 'parchment', 'solitude'], 
    default: 'midnight' 
  },
  
  // Thoughts / reflections left by anonymous visitors (Read-only for author, no replies, 1 per user)
  thoughts: [thoughtSchema],
  
  // Users who resonated (1 resonance per user, author cannot resonate)
  resonators: [resonatorSchema],
  
  // Anonymous resonance counters: Fire, Rose, Withered, Neutral
  resonances: {
    fire: { type: Number, default: 0 },
    rose: { type: Number, default: 0 },
    withered: { type: Number, default: 0 },
    neutral: { type: Number, default: 0 }
  },
  
  viewsCount: { type: Number, default: 0 },
  
  // 15-day lifespan
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) 
  }
}, { timestamps: true });

// Optional index for automatic cleanup of expired letters
namelessLetterSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('NamelessLetter', namelessLetterSchema);
