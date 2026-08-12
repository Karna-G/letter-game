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
  sealedAt: { type: Date }, // When the letter moved from draft -> pending (dispatched)
  pickedUpAt: { type: Date },
  deliveredAt: { type: Date },
  firstReadAt: { type: Date }, // When the receiver first opened a delivered letter
  scheduledFor: { type: Date }, // For time capsule

  // Game mechanics
  weatherDelayEvents: [{ type: String }],
  qrCodeToken: { type: String }, // Token to verify delivery
  burnAfterReading: { type: Boolean, default: false }, // Feature 22: ink fades & letter is destroyed after reading

}, { timestamps: true });

module.exports = mongoose.model('Letter', letterSchema);
