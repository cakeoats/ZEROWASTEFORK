const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema for individual order items
const OrderItemSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
        min: 1
    },
    price: {
        type: Number,
        required: true
    }
});

const OrderSchema = new Schema({
    buyer: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    seller: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // For backward compatibility with old orders (single product)
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product'
    },
    quantity: {
        type: Number,
        min: 1
    },
    // New field for multiple products
    products: [OrderItemSchema],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    transactionId: {
        type: String
    },
    shippingAddress: {
        name: String,
        street: String,
        city: String,
        province: String,
        postalCode: String,
        phone: String
    },
    notes: {
        type: String
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

// Update the timestamp when order is modified
OrderSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Order', OrderSchema);