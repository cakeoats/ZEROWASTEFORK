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
  status: { type: String, enum: ['active', 'sold', 'inactive'], default: 'active' },
});

// Menambahkan virtuals untuk mendapatkan URL gambar lengkap
ProductSchema.virtual('imageUrls').get(function () {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  return this.images.map(img => `${baseUrl}/${img}`);
});

// Pastikan virtual termasuk saat mengubah ke JSON
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', ProductSchema);