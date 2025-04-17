const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  buyer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  seller_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  messages: [
    {
      sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', ChatSchema);
