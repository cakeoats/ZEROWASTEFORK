// backend/models/product.js - OPTIMIZED untuk category stats yang akurat
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  seller_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: {
    type: String,
    required: true,
    index: true // FIXED: Add index untuk performance category queries
  },
  images: [{ type: String }],
  stock: { type: Number, default: 1 },
  condition: { type: String, enum: ['new', 'used'], required: true },
  tipe: { type: String, enum: ['Sell', 'Donation', 'Swap'], required: true },

  // UPDATED: Enhanced status field
  status: {
    type: String,
    enum: ['active', 'sold', 'inactive', 'deleted'],
    default: 'active',
    index: true // FIXED: Add index untuk filtering performance
  },

  // NEW: Additional fields untuk tracking
  soldAt: { type: Date }, // Tanggal produk terjual
  soldTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Pembeli
  orderId: { type: String }, // ID order Midtrans

  // NEW: Visibility control
  isVisible: {
    type: Boolean,
    default: true,
    index: true // FIXED: Add index untuk filtering
  }, // Apakah produk visible di listing

  // NEW: Deletion info (soft delete)
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deleteReason: { type: String }
}, {
  timestamps: true // Akan menambahkan createdAt dan updatedAt otomatis
});

// FIXED: Enhanced indexes untuk performa query yang lebih baik
ProductSchema.index({ seller_id: 1, status: 1 });
ProductSchema.index({ category: 1, status: 1, isVisible: 1 }); // COMPOUND INDEX untuk category stats
ProductSchema.index({ status: 1, isVisible: 1, deletedAt: 1 }); // COMPOUND INDEX untuk active products
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ price: 1 }); // For price sorting
ProductSchema.index({ condition: 1 });
ProductSchema.index({ tipe: 1 });

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

// FIXED: Static method untuk get active products only dengan filter yang benar
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

// FIXED: Static method untuk category stats yang akurat
ProductSchema.statics.getCategoryStats = async function () {
  try {
    console.log('📊 Getting category statistics...');

    const stats = await this.aggregate([
      {
        // FIXED: Filter untuk hanya produk yang aktif dan visible
        $match: {
          status: { $ne: 'deleted' },
          isVisible: { $ne: false },
          deletedAt: { $exists: false },
          category: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    console.log('✅ Category stats result:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Error in getCategoryStats:', error);
    throw error;
  }
};

// FIXED: Static method untuk detailed category stats
ProductSchema.statics.getDetailedCategoryStats = async function () {
  try {
    const stats = await this.aggregate([
      {
        $match: {
          status: { $ne: 'deleted' },
          isVisible: { $ne: false },
          deletedAt: { $exists: false }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          averagePrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          newItems: {
            $sum: {
              $cond: [{ $eq: ['$condition', 'new'] }, 1, 0]
            }
          },
          usedItems: {
            $sum: {
              $cond: [{ $eq: ['$condition', 'used'] }, 1, 0]
            }
          },
          sellItems: {
            $sum: {
              $cond: [{ $eq: ['$tipe', 'Sell'] }, 1, 0]
            }
          },
          donationItems: {
            $sum: {
              $cond: [{ $eq: ['$tipe', 'Donation'] }, 1, 0]
            }
          },
          swapItems: {
            $sum: {
              $cond: [{ $eq: ['$tipe', 'Swap'] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    return stats;
  } catch (error) {
    console.error('❌ Error in getDetailedCategoryStats:', error);
    throw error;
  }
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

  // FIXED: Normalize category untuk consistency
  if (this.isModified('category') && this.category) {
    this.category = this.category.trim();
  }

  next();
});

// Post-save middleware untuk cleanup dan logging
ProductSchema.post('save', function (doc) {
  if (doc.status === 'sold') {
    console.log(`✅ Product ${doc.name} marked as sold at ${doc.soldAt}`);
  }
});

// FIXED: Query middleware untuk default filtering hanya pada find() biasa
ProductSchema.pre(/^find/, function (next) {
  // Jangan apply filter otomatis untuk aggregation atau jika sudah ada filter status
  if (this.getQuery().status !== undefined || this.getQuery()._id || this.op === 'aggregate') {
    return next();
  }

  // Default: hanya tampilkan produk yang available untuk public queries
  this.find({
    status: { $ne: 'deleted' },
    isVisible: true,
    deletedAt: { $exists: false }
  });

  next();
});

// FIXED: Method untuk count products by category (bypassing query middleware)
ProductSchema.statics.countByCategory = async function () {
  try {
    // Bypass query middleware dengan menggunakan aggregation
    const result = await this.aggregate([
      {
        $match: {
          status: { $ne: 'deleted' },
          isVisible: { $ne: false },
          deletedAt: { $exists: false },
          category: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Convert to object untuk easier access
    const categoryCount = {};
    result.forEach(item => {
      categoryCount[item._id] = item.count;
    });

    return categoryCount;
  } catch (error) {
    console.error('❌ Error counting by category:', error);
    return {};
  }
};

// Method untuk get all categories with counts
ProductSchema.statics.getAllCategoriesWithCount = async function () {
  try {
    const stats = await this.getCategoryStats();

    // Transform ke format yang lebih user-friendly
    const categoriesWithCount = stats.map(stat => ({
      name: stat._id,
      count: stat.count,
      percentage: 0 // Will be calculated
    }));

    // Calculate percentages
    const totalProducts = categoriesWithCount.reduce((sum, cat) => sum + cat.count, 0);
    categoriesWithCount.forEach(cat => {
      cat.percentage = totalProducts > 0 ? ((cat.count / totalProducts) * 100).toFixed(1) : 0;
    });

    return {
      categories: categoriesWithCount,
      totalProducts,
      totalCategories: categoriesWithCount.length
    };
  } catch (error) {
    console.error('❌ Error getting all categories with count:', error);
    return {
      categories: [],
      totalProducts: 0,
      totalCategories: 0
    };
  }
};

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

// FIXED: Add a method to refresh category cache if needed
ProductSchema.statics.refreshCategoryCache = async function () {
  try {
    console.log('🔄 Refreshing category cache...');
    const stats = await this.getCategoryStats();
    console.log('✅ Category cache refreshed:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Error refreshing category cache:', error);
    throw error;
  }
};

module.exports = mongoose.model('Product', ProductSchema);