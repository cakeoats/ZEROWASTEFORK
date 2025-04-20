const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/product');
const User = require('../models/User');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  }
};

const seedProducts = async () => {
  await connectDB();

  try {
    const seller = await User.findOne();
    if (!seller) {
      console.log('⚠️ No user found. Please create a user first.');
      return;
    }

    const products = [
      {
        seller_id: seller._id,
        name: 'Sepeda Gunung MXV23',
        description: 'Sepeda bekas terawat, cocok untuk olahraga harian.',
        price: 850000,
        category: 'Olahraga',
        images: ['/images/sepeda.jpg'],
        stock: 1,
        condition: 'used',
        tipe: 'Sell',
        status: 'active',
      },
      {
        seller_id: seller._id,
        name: 'Buku Novel Dilan',
        description: 'Novel cinta remaja hits, kondisi masih oke!',
        price: 25000,
        category: 'Buku',
        images: ['/images/dilan.jpg'],
        stock: 1,
        condition: 'used',
        tipe: 'Sell',
        status: 'active',
      },
      {
        seller_id: seller._id,
        name: 'Kaos Polos Putih',
        description: 'Kaos cotton combed, nyaman dan adem dipakai.',
        price: 15000,
        category: 'Pakaian',
        images: ['/images/kaos-putih.jpg'],
        stock: 3,
        condition: 'used',
        tipe: 'Donation',
        status: 'active',
      },
      {
        seller_id: seller._id,
        name: 'Meja Belajar Minimalis',
        description: 'Meja belajar kayu bekas, cocok untuk pelajar.',
        price: 120000,
        category: 'Furniture',
        images: ['/images/meja.jpg'],
        stock: 1,
        condition: 'used',
        tipe: 'Sell',
        status: 'active',
      },
      {
        seller_id: seller._id,
        name: 'Rak Buku Besi 3 Susun',
        description: 'Rak besi bekas, masih kokoh, warna hitam.',
        price: 70000,
        category: 'Furniture',
        images: ['/images/rak.jpg'],
        stock: 1,
        condition: 'used',
        tipe: 'Sell',
        status: 'active',
      },
      {
        seller_id: seller._id,
        name: 'Celana Jeans Levis',
        description: 'Celana jeans pria, size 32, kondisi mulus.',
        price: 30000,
        category: 'Pakaian',
        images: ['/images/jeans.jpg'],
        stock: 2,
        condition: 'used',
        tipe: 'Swap',
        status: 'active',
      },
      {
        seller_id: seller._id,
        name: 'Boneka Teddy Bear Jumbo',
        description: 'Boneka besar untuk hadiah atau pajangan.',
        price: 45000,
        category: 'Mainan',
        images: ['/images/teddy.jpg'],
        stock: 1,
        condition: 'used',
        tipe: 'Donation',
        status: 'active',
      },
      {
        seller_id: seller._id,
        name: 'Laptop ASUS X441N',
        description: 'Laptop lama masih bisa digunakan untuk mengetik.',
        price: 1100000,
        category: 'Elektronik',
        images: ['/images/laptop.jpg'],
        stock: 1,
        condition: 'used',
        tipe: 'Sell',
        status: 'active',
      },
      {
        seller_id: seller._id,
        name: 'Kipas Angin Maspion',
        description: 'Kipas angin meja, warna biru, 2 level kecepatan.',
        price: 90000,
        category: 'Elektronik',
        images: ['/images/kipas.jpg'],
        stock: 1,
        condition: 'used',
        tipe: 'Sell',
        status: 'active',
      },
      {
        seller_id: seller._id,
        name: 'Tas Ransel Eiger',
        description: 'Tas outdoor bekas tapi masih kuat dan kokoh.',
        price: 135000,
        category: 'Aksesoris',
        images: ['/images/eiger.jpg'],
        stock: 1,
        condition: 'used',
        tipe: 'Sell',
        status: 'active',
      },
    ];

    await Product.insertMany(products);
    console.log('✅ 10 dummy products inserted!');
  } catch (err) {
    console.error('❌ Seeder error:', err);
  } finally {
    mongoose.connection.close();
  }
};

seedProducts();
