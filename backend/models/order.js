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
  }
}, {
  timestamps: true
});

// Index for better query performance
orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ seller: 1, createdAt: -1 });
orderSchema.index({ transactionId: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

// Virtual for order type
orderSchema.virtual('orderType').get(function() {
  return this.products && this.products.length > 0 ? 'cart' : 'single';
});

// Method to calculate total amount
orderSchema.methods.calculateTotal = function() {
  if (this.products && this.products.length > 0) {
    return this.products.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
  return this.totalAmount;
};

// Pre-save middleware to ensure data consistency
orderSchema.pre('save', function(next) {
  // Ensure we have either product or products
  if (!this.product && (!this.products || this.products.length === 0)) {
    return next(new Error('Order must have either a product or products array'));
  }
  
  // If it's a cart order, calculate total from products
  if (this.products && this.products.length > 0) {
    this.totalAmount = this.calculateTotal();
  }
  
  next();
});

module.exports = mongoose.model('Order', orderSchema);