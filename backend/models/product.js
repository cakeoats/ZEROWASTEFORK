const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  seller_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  images: [{ type: String }],
  stock: { type: Number, default: 1 },
  condition: { type: String, enum: ['new', 'used'], required: true },
  tipe: { type: String, enum: ['Sell', 'Donation', 'Swap'], required: true },
  status: { type: String, enum: ['active', 'sold' , 'inactive'], default: 'active' },
});

module.exports = mongoose.model('Product', ProductSchema);
