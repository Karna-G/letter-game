const mongoose = require('mongoose');

// Feature: Community Notice Board — Admin-only posting, public viewing
const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 120 },
  content: { type: String, required: true, maxlength: 2000 },
  category: {
    type: String,
    enum: ['announcement', 'update', 'event', 'warning', 'news'],
    default: 'announcement'
  },
  isPinned: { type: Boolean, default: false },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  postedByName: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Notice', noticeSchema);
