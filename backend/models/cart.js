const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CartItemSchema = new Schema({
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

const CartSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [CartItemSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    // You can add additional fields as needed, such as:
    totalAmount: {
        type: Number,
        default: 0
    }
});

// Pre-save middleware to update totalAmount before saving
CartSchema.pre('save', function (next) {
    this.updatedAt = Date.now();

    // Calculate total amount
    this.totalAmount = this.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);

    next();
});

module.exports = mongoose.model('Cart', CartSchema);