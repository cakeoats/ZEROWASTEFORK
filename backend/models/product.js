// backend/models/product.js - UPDATED dengan status field untuk tracking produk terjual
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

  // UPDATED: Enhanced status field
  status: {
    type: String,
    enum: ['active', 'sold', 'inactive', 'deleted'],
    default: 'active'
  },

  // NEW: Additional fields untuk tracking
  soldAt: { type: Date }, // Tanggal produk terjual
  soldTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Pembeli
  orderId: { type: String }, // ID order Midtrans

  // NEW: Visibility control
  isVisible: { type: Boolean, default: true }, // Apakah produk visible di listing

  // NEW: Deletion info (soft delete)
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deleteReason: { type: String }
}, {
  timestamps: true // Akan menambahkan createdAt dan updatedAt otomatis
});

// Index untuk performa query yang lebih baik
ProductSchema.index({ seller_id: 1, status: 1 });
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ status: 1, isVisible: 1 });
ProductSchema.index({ createdAt: -1 });

// Virtual untuk mendapatkan URL gambar lengkap
ProductSchema.virtual('imageUrls').get(function () {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  return this.images.map(img => `${baseUrl}/${img}`);
});

// Virtual untuk check apakah produk available
ProductSchema.virtual('isAvailable').get(function () {
  return this.status === 'active' && this.isVisible && !this.deletedAt;
});

// Virtual untuk status display
ProductSchema.virtual('statusDisplay').get(function () {
  switch (this.status) {
    case 'active': return 'Available';
    case 'sold': return 'Sold';
    case 'inactive': return 'Inactive';
    case 'deleted': return 'Deleted';
    default: return 'Unknown';
  }
});

// Method untuk menandai produk sebagai terjual
ProductSchema.methods.markAsSold = function (buyerId, orderId) {
  this.status = 'sold';
  this.soldAt = new Date();
  this.soldTo = buyerId;
  this.orderId = orderId;
  this.isVisible = false; // Hide dari listing setelah terjual

  return this.save();
};

// Method untuk soft delete
ProductSchema.methods.softDelete = function (deletedBy, reason) {
  this.status = 'deleted';
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.deleteReason = reason;
  this.isVisible = false;

  return this.save();
};

// Method untuk restore produk
ProductSchema.methods.restore = function () {
  this.status = 'active';
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  this.deleteReason = undefined;
  this.isVisible = true;

  return this.save();
};

// Static method untuk get active products only
ProductSchema.statics.getActiveProducts = function (filter = {}) {
  return this.find({
    ...filter,
    status: 'active',
    isVisible: true,
    deletedAt: { $exists: false }
  });
};

// Static method untuk get sold products
ProductSchema.statics.getSoldProducts = function (filter = {}) {
  return this.find({
    ...filter,
    status: 'sold'
  });
};

// Pre-save middleware untuk logging
ProductSchema.pre('save', function (next) {
  // Log status changes
  if (this.isModified('status')) {
    console.log(`📦 Product ${this.name} status changed to: ${this.status}`);

    // Auto-hide jika status bukan active
    if (this.status !== 'active') {
      this.isVisible = false;
    }
  }

  // Auto-set soldAt jika status berubah ke sold
  if (this.isModified('status') && this.status === 'sold' && !this.soldAt) {
    this.soldAt = new Date();
  }

  next();
});

// Post-save middleware untuk cleanup dan logging
ProductSchema.post('save', function (doc) {
  if (doc.status === 'sold') {
    console.log(`✅ Product ${doc.name} marked as sold at ${doc.soldAt}`);
  }
});

// Query middleware untuk default filtering (hanya tampilkan active products)
ProductSchema.pre(/^find/, function (next) {
  // Jangan apply filter otomatis jika sudah ada filter status
  if (!this.getQuery().status && !this.getQuery()._id) {
    // Default: hanya tampilkan produk yang available
    this.find({
      status: { $ne: 'deleted' },
      isVisible: true,
      deletedAt: { $exists: false }
    });
  }
  next();
});

// Pastikan virtual termasuk saat mengubah ke JSON
ProductSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    // Remove sensitive fields dari response
    delete ret.__v;
    delete ret.deletedBy;
    delete ret.deleteReason;

    // Add computed fields
    ret.isAvailable = doc.isAvailable;
    ret.statusDisplay = doc.statusDisplay;

    return ret;
  }
});

ProductSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', ProductSchema);