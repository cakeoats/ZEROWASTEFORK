// backend/models/order.js - UPDATED untuk mendukung Cart Orders

const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
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

  // Single product order (traditional)
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: function () {
      return !this.isCartOrder; // Required only if not a cart order
    }
  },
  quantity: {
    type: Number,
    default: 1,
    required: function () {
      return !this.isCartOrder; // Required only if not a cart order
    }
  },

  // Cart order (multiple products)
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
      required: true,
      min: 0
    }
  }],

  // Order metadata
  isCartOrder: {
    type: Boolean,
    default: false
  },

  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },

  status: {
    type: String,
    enum: ['pending', 'paid', 'completed', 'cancelled'],
    default: 'pending'
  },

  transactionId: {
    type: String,
    required: true,
    unique: true
  },

  paymentMethod: {
    type: String,
    enum: ['midtrans', 'manual', 'cash'],
    default: 'midtrans'
  },

  // Midtrans specific data
  midtransData: {
    snapToken: String,
    redirectUrl: String,
    expiryTime: Date,
    paymentType: String,
    transactionTime: Date,
    settlementTime: Date,
    statusCode: String,
    statusMessage: String
  },

  // Shipping information
  shippingAddress: {
    street: String,
    city: String,
    country: String,
    postalCode: String
  },

  // Order tracking
  reason: String, // For cancelled orders
  cancelledAt: Date,
  completedAt: Date,

  // Audit trail
  statusHistory: [{
    status: String,
    changedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
OrderSchema.index({ buyer: 1, status: 1 });
OrderSchema.index({ seller: 1, status: 1 });
OrderSchema.index({ transactionId: 1 });
OrderSchema.index({ createdAt: -1 });

// Virtual for backward compatibility
OrderSchema.virtual('order_id').get(function () {
  return this.transactionId;
});

// Method to update order status with history tracking
OrderSchema.methods.updateStatus = async function (newStatus, additionalData = {}) {
  console.log(`📋 Updating order ${this.transactionId} status: ${this.status} → ${newStatus}`);

  // Add to status history
  this.statusHistory.push({
    status: this.status,
    changedAt: new Date(),
    reason: additionalData.reason || `Status changed to ${newStatus}`
  });

  // Update main status
  this.status = newStatus;

  // Set completion time
  if (newStatus === 'completed') {
    this.completedAt = new Date();
  }

  // Set cancellation time and reason
  if (newStatus === 'cancelled') {
    this.cancelledAt = new Date();
    if (additionalData.reason) {
      this.reason = additionalData.reason;
    }
  }

  // Update Midtrans data if provided
  if (additionalData.midtransData) {
    this.midtransData = { ...this.midtransData, ...additionalData.midtransData };
  }

  // Save changes
  await this.save();

  console.log(`✅ Order ${this.transactionId} status updated to: ${newStatus}`);
  return this;
};

// Method to get order items (works for both single and cart orders)
OrderSchema.methods.getOrderItems = function () {
  if (this.isCartOrder && this.products && this.products.length > 0) {
    return this.products;
  } else if (this.product) {
    return [{
      product: this.product,
      quantity: this.quantity,
      price: this.totalAmount // For single product orders
    }];
  }
  return [];
};

// Pre-save validation
OrderSchema.pre('save', function (next) {
  // Ensure either single product or cart products are set
  if (!this.isCartOrder && !this.product) {
    return next(new Error('Single product orders must have a product'));
  }

  if (this.isCartOrder && (!this.products || this.products.length === 0)) {
    return next(new Error('Cart orders must have at least one product'));
  }

  // Validate cart order total amount
  if (this.isCartOrder && this.products && this.products.length > 0) {
    const calculatedTotal = this.products.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    // Allow small tolerance for rounding differences
    if (Math.abs(calculatedTotal - this.totalAmount) > 1) {
      return next(new Error(`Total amount mismatch: calculated ${calculatedTotal}, provided ${this.totalAmount}`));
    }
  }

  next();
});

// Static method to find orders by user with proper population
OrderSchema.statics.findByUser = function (userId, options = {}) {
  const {
    status,
    sort = { createdAt: -1 },
    limit,
    skip,
    populate = true
  } = options;

  let query = this.find({ buyer: userId });

  if (status && status !== 'all') {
    query = query.where({ status });
  }

  if (populate) {
    query = query
      .populate({
        path: 'product',
        select: 'name price images category condition tipe'
      })
      .populate({
        path: 'products.product',
        select: 'name price images category condition tipe'
      })
      .populate({
        path: 'seller',
        select: 'username full_name email'
      });
  }

  query = query.sort(sort);

  if (skip) query = query.skip(skip);
  if (limit) query = query.limit(limit);

  return query;
};

// Export model
module.exports = mongoose.model('Order', OrderSchema);