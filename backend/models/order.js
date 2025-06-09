// backend/models/order.js - UPDATED untuk Order History
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // For single product orders
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  // For multiple product orders (cart)
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    }
  }],
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled', 'completed'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  paymentMethod: {
    type: String,
    default: 'midtrans'
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  notes: {
    type: String,
    maxlength: 500
  },
  // NEW: Additional fields for order history
  paidAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancelReason: {
    type: String,
    maxlength: 200
  },
  // Midtrans payment data
  midtransData: {
    snapToken: String,
    redirectUrl: String,
    paymentType: String,
    bankCode: String,
    vaNumber: String,
    statusCode: String,
    statusMessage: String,
    transactionTime: Date,
    settlementTime: Date,
    expiryTime: Date
  }
}, {
  timestamps: true
});

// Index untuk performa query yang lebih baik
orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ seller: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ transactionId: 1 });

// Virtual untuk order type
orderSchema.virtual('orderType').get(function () {
  return this.products && this.products.length > 0 ? 'cart' : 'single';
});

// Virtual untuk duration
orderSchema.virtual('duration').get(function () {
  const endDate = this.completedAt || this.cancelledAt || new Date();
  const startDate = this.createdAt;
  return Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)); // days
});

// Method untuk calculate total amount
orderSchema.methods.calculateTotal = function () {
  if (this.products && this.products.length > 0) {
    return this.products.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
  return this.totalAmount;
};

// Method untuk update status dengan timestamp
orderSchema.methods.updateStatus = function (newStatus, additionalData = {}) {
  this.status = newStatus;

  switch (newStatus) {
    case 'paid':
      this.paidAt = new Date();
      break;
    case 'completed':
      this.completedAt = new Date();
      break;
    case 'cancelled':
      this.cancelledAt = new Date();
      if (additionalData.reason) {
        this.cancelReason = additionalData.reason;
      }
      break;
  }

  // Update midtrans data if provided
  if (additionalData.midtransData) {
    this.midtransData = { ...this.midtransData, ...additionalData.midtransData };
  }

  return this.save();
};

// Static method untuk get order statistics
orderSchema.statics.getStatsByUser = async function (userId) {
  const stats = await this.aggregate([
    { $match: { buyer: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ]);

  const totalOrders = await this.countDocuments({ buyer: userId });
  const totalSpent = await this.aggregate([
    {
      $match: {
        buyer: mongoose.Types.ObjectId(userId),
        status: { $in: ['paid', 'completed'] }
      }
    },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);

  return {
    totalOrders,
    totalSpent: totalSpent[0]?.total || 0,
    byStatus: stats.reduce((acc, stat) => {
      acc[stat._id] = {
        count: stat.count,
        totalAmount: stat.totalAmount
      };
      return acc;
    }, {})
  };
};

// Pre-save middleware untuk data consistency
orderSchema.pre('save', function (next) {
  // Ensure we have either product or products
  if (!this.product && (!this.products || this.products.length === 0)) {
    return next(new Error('Order must have either a product or products array'));
  }

  // If it's a cart order, calculate total from products
  if (this.products && this.products.length > 0) {
    this.totalAmount = this.calculateTotal();
  }

  // Set seller from product if not already set
  if (!this.seller && this.product) {
    // This will be populated by the controller
  }

  next();
});

// Post-save middleware untuk logging
orderSchema.post('save', function (doc) {
  console.log(`📋 Order ${doc.transactionId} saved with status: ${doc.status}`);
});

// Instance method untuk generate order summary
orderSchema.methods.getOrderSummary = function () {
  const productCount = this.products ? this.products.length : 1;
  const mainProduct = this.product || (this.products && this.products[0]?.product);

  return {
    orderId: this.transactionId,
    status: this.status,
    totalAmount: this.totalAmount,
    productCount,
    mainProductName: mainProduct?.name || 'Unknown Product',
    orderDate: this.createdAt,
    lastUpdate: this.updatedAt
  };
};

// Export with proper error handling
module.exports = mongoose.model('Order', orderSchema);