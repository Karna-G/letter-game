const mongoose = require('mongoose');

const letterSchema = new mongoose.Schema({
  senderRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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
    enum: ['standard', 'bottle', 'dead', 'capsule', 'schrodinger', 'dibbyuk'], 
    default: 'standard' 
  },
  
  // Timestamps
  pickedUpAt: { type: Date },
  deliveredAt: { type: Date },
  scheduledFor: { type: Date }, // For time capsule
  
  // Game mechanics
  weatherDelayEvents: [{ type: String }],
  qrCodeToken: { type: String }, // Token to verify delivery
  
}, { timestamps: true });

module.exports = mongoose.model('Letter', letterSchema);
