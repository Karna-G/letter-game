const mongoose = require('mongoose');

const gazetteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  editionCode: { type: String, required: true }, // e.g. "season_autumn_2026_09", "milestone_letters_10"
  editionNumber: { type: Number, default: 1 },
  volume: { type: String, default: 'Vol. XVIII' },
  title: { type: String, required: true, default: "THE POSTMASTER'S PHANTOM GAZETTE" },
  headline: { type: String, required: true },
  subtitle: { type: String },
  date: { type: Date, default: Date.now },
  formattedDateStr: { type: String },
  category: {
    type: String,
    enum: ['Seasonal Chronicle', 'Postal Mystery', 'Milestone Decree', 'Philatelic Gazette', 'Celestial Dispatch', 'Special Bulletin'],
    default: 'Seasonal Chronicle'
  },
  weatherForecast: { type: String },
  leadStory: {
    heading: { type: String, required: true },
    content: { type: String, required: true },
    woodcutIllustration: { type: String, default: 'quill' } // 'quill', 'pigeon', 'wax_seal', 'owl', 'ship', 'carriage'
  },
  editorialQuote: {
    quote: { type: String },
    author: { type: String, default: 'The Postmaster General' }
  },
  communityHighlights: [{
    title: { type: String },
    body: { type: String }
  }],
  userPostalJourney: {
    lettersSent: { type: Number, default: 0 },
    lettersReceived: { type: Number, default: 0 },
    reputationScore: { type: Number, default: 0 },
    deliveriesCompleted: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    rank: { type: String, default: 'Novice Scribe' },
    unreadMailboxCount: { type: Number, default: 0 },
    milestoneAchieved: { type: String }
  },
  fictionalPostalClassifieds: [{
    tag: { type: String },
    text: { type: String }
  }],
  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null }
}, { timestamps: true });

gazetteSchema.index({ userId: 1, editionCode: 1 }, { unique: true });

module.exports = mongoose.model('Gazette', gazetteSchema);