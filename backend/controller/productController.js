// backend/controller/productController.js - DEBUG VERSION
const Product = require('../models/product');
const User = require('../models/User');
const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

const uploadProduct = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('📤 CONTROLLER - Upload request from user:', userId);

    // ENHANCED DEBUG LOGGING
    console.log('🔍 CONTROLLER - Request analysis:');
    console.log('Headers:', req.headers);
    console.log('Content-Type:', req.get('Content-Type'));
    console.log('Content-Length:', req.get('Content-Length'));
    console.log('Body keys:', Object.keys(req.body || {}));
    console.log('Files object:', req.files);
    console.log('Files count:', req.files ? req.files.length : 'undefined');
    console.log('Files array check:', Array.isArray(req.files));

    // Log each file in detail
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        console.log(`📁 File ${index + 1} details:`, {
          fieldname: file.fieldname,
          originalname: file.originalname,
          encoding: file.encoding,
          mimetype: file.mimetype,
          buffer: file.buffer ? `Buffer(${file.buffer.length} bytes)` : 'NO BUFFER',
          size: file.size,
          destination: file.destination,
          filename: file.filename,
          path: file.path
        });
      });
    } else {
      console.log('❌ NO FILES RECEIVED - Possible causes:');
      console.log('1. Frontend not sending files correctly');
      console.log('2. Multer not processing files');
      console.log('3. Content-Type header issues');
      console.log('4. File size too large');
      console.log('5. Network issues during upload');
    }

    // Ambil data form
    const {
      name,
      description,
      price,
      category,
      stock,
      condition,
      tipe,
    } = req.body;

    console.log('📋 CONTROLLER - Product data:', {
      name,
      price,
      category,
      condition,
      tipe,
      description: description ? description.substring(0, 50) + '...' : 'No description'
    });

    // Validasi minimal field yang wajib
    if (!name || !price || !category || !condition || !tipe) {
      console.log('❌ CONTROLLER - Validation failed: missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Field wajib harus diisi',
        missing: {
          name: !name,
          price: !price,
          category: !category,
          condition: !condition,
          tipe: !tipe
        },
        debug: {
          receivedBody: req.body,
          receivedFiles: req.files ? req.files.length : 0
        }
      });
    }

    // Validasi gambar dengan detailed error
    if (!req.files || req.files.length === 0) {
      console.log('❌ CONTROLLER - Validation failed: no images uploaded');

      // Return detailed error untuk debugging
      return res.status(400).json({
        success: false,
        message: 'Minimal 1 gambar harus diupload',
        debug: {
          filesReceived: req.files ? req.files.length : 0,
          filesObject: req.files,
          contentType: req.get('Content-Type'),
          contentLength: req.get('Content-Length'),
          bodyKeys: Object.keys(req.body || {}),
          possible_issues: [
            'Frontend tidak mengirim file dengan benar',
            'Multer tidak memproses file',
            'Content-Type header bermasalah',
            'File terlalu besar',
            'Network timeout saat upload'
          ]
        }
      });
    }

    console.log('🔄 CONTROLLER - Starting image upload to Supabase...');

    // Upload images to Supabase Storage
    const imageUrls = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      try {
        // Generate unique filename
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${userId}/${Date.now()}-${uuidv4()}.${fileExt}`;

        console.log(`📤 CONTROLLER - Uploading image ${i + 1}/${req.files.length} to Supabase:`, fileName);
        console.log('File buffer size:', file.buffer ? file.buffer.length : 'NO BUFFER');

        if (!file.buffer) {
          throw new Error('File buffer is missing - multer memory storage issue');
        }

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('product-images') // Bucket name
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('❌ CONTROLLER - Supabase upload error:', error);
          throw new Error(`Supabase upload failed: ${error.message}`);
        }

        console.log('✅ CONTROLLER - File uploaded to Supabase:', data);

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        const publicUrl = urlData.publicUrl;
        console.log('🔗 CONTROLLER - Public URL generated:', publicUrl);

        imageUrls.push(publicUrl);

      } catch (uploadError) {
        console.error('❌ CONTROLLER - Error uploading image:', uploadError);

        // Clean up any successfully uploaded images
        for (const url of imageUrls) {
          try {
            const path = url.split('/product-images/')[1];
            await supabase.storage.from('product-images').remove([path]);
            console.log('🧹 Cleaned up:', path);
          } catch (cleanupError) {
            console.error('❌ Cleanup error:', cleanupError);
          }
        }

        return res.status(500).json({
          success: false,
          message: 'Gagal upload gambar: ' + uploadError.message,
          debug: {
            uploadError: uploadError.message,
            imageIndex: imageUrls.length,
            fileName: file.originalname,
            fileSize: file.size,
            hasBuffer: !!file.buffer
          }
        });
      }
    }

    console.log('✅ CONTROLLER - All images uploaded successfully:', imageUrls);

    // Create new product with Supabase URLs
    const newProduct = new Product({
      seller_id: userId,
      name,
      description,
      price: parseFloat(price),
      category,
      images: imageUrls, // Array of Supabase URLs
      stock: parseInt(stock) || 1,
      condition,
      tipe,
    });

    console.log('💾 CONTROLLER - Saving product to database...');
    await newProduct.save();
    console.log('✅ CONTROLLER - Product saved with ID:', newProduct._id);

    // Return product with image URLs
    const productObj = newProduct.toObject();
    productObj.imageUrls = imageUrls;
    productObj.imageUrl = imageUrls[0]; // First image as main

    res.status(201).json({
      success: true,
      message: 'Product uploaded successfully',
      product: productObj
    });

  } catch (error) {
    console.error('💥 CONTROLLER - Upload product error:', error);
    console.error('💥 CONTROLLER - Error stack:', error.stack);

    res.status(500).json({
      success: false,
      message: 'Failed to upload product',
      error: error.message,
      debug: {
        errorType: error.constructor.name,
        errorMessage: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
};

// ... other functions remain the same
const getProductDetail = async (req, res) => {
  try {
    const productId = req.params.id;
    console.log('🔍 Fetching product detail for ID:', productId);

    const product = await Product.findById(productId)
      .populate('seller_id', 'username full_name phone email')
      .lean();

    if (!product) {
      console.log('❌ Product not found:', productId);
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.images && product.images.length > 0) {
      product.imageUrls = product.images;
      product.imageUrl = product.images[0];
    } else {
      product.imageUrls = [];
      product.imageUrl = null;
    }

    console.log('✅ Product detail fetched successfully');
    res.json(product);
  } catch (err) {
    console.error('💥 Error fetching product detail:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    console.log('📋 Fetching products with filters:', { category, search, sort });

    let filter = {};

    if (category && category !== 'All') {
      filter.category = { $regex: new RegExp(category, 'i') };
    }

    if (search) {
      filter.name = { $regex: new RegExp(search, 'i') };
    }

    let sortOption = {};
    if (sort === 'price-asc') {
      sortOption = { price: 1 };
    } else if (sort === 'price-desc') {
      sortOption = { price: -1 };
    } else {
      sortOption = { createdAt: -1 };
    }

    const products = await Product.find(filter)
      .sort(sortOption)
      .populate('seller_id', 'username full_name')
      .lean();

    console.log('📦 Found', products.length, 'products');

    const productsWithImageUrls = products.map(product => {
      if (product.images && product.images.length > 0) {
        product.imageUrls = product.images;
        product.imageUrl = product.images[0];
      } else {
        product.imageUrls = [];
        product.imageUrl = null;
      }
      return product;
    });

    console.log('✅ Products processed with image URLs');
    res.json(productsWithImageUrls);
  } catch (error) {
    console.error('💥 Error fetching products:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  uploadProduct,
  getProductDetail,
  getAllProducts
};