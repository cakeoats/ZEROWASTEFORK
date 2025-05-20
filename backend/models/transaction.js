const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransactionSchema = new Schema({
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'expired', 'challenge'],
    default: 'pending'
  },
  snapToken: {
    type: String
  },
  paymentType: {
    type: String
  },
  paymentCode: {
    type: String
  },
  paidAt: {
    type: Date
  },
  expiredAt: {
    type: Date
  },
  midtransResponse: {
    type: Object
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the timestamp when transaction is modified
TransactionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();

  // If status changed to success, update paidAt
  if (this.isModified('status') && this.status === 'success') {
    this.paidAt = Date.now();
  }

  next();
});

module.exports = mongoose.model('Transaction', TransactionSchema);