const Product = require('../models/product');
const User = require('../models/User');

const getProductDetail = async (req, res) => {
    try {
      // Populate both username and full_name to be safe
      const product = await Product.findById(req.params.id).populate('seller_id', 'username full_name phone');
      if (!product) return res.status(404).json({ message: 'Product not found' });
  
      res.json(product);
    } catch (err) {
      console.error('Error fetching product detail:', err);
      res.status(500).json({ message: 'Server error' });
    }
  };

module.exports = { getProductDetail };
