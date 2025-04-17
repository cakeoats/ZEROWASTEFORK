const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['Sell', 'Donation', 'Swap'],
      required: true
    },
    status: {
      type: String,
      enum: ['menunggu', 'diproses', 'selesai', 'dibatalkan'],
      default: 'menunggu'
    },
    additionalInfo: {
      barterItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Jika barter, menyimpan barang yang ditawarkan sebagai barter
        required: function () {
          return this.type === 'Swap';
        }
      },
      donationMessage: {
        type: String, // Jika donasi, menyimpan pesan dari pemberi donasi
        required: function () {
          return this.type === 'Donation';
        }
      }
    }
  },
  {
    timestamps: true // Otomatis menambahkan createdAt dan updatedAt
  }
);

module.exports = mongoose.model('Transaction', TransactionSchema);
