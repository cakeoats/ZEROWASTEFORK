// backend/controller/productController.js - FIXED VERSION (Upload Function Only)
const Product = require('../models/product');
const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

// Get bucket name from config
const BUCKET_NAME = supabase.BUCKET_NAME || 'product-image';

const uploadProduct = async (req, res) => {
  try {
    console.log('📤 Product upload request received');
    console.log('👤 User ID from token:', req.user?._id);
    console.log('👤 User object:', {
      id: req.user?._id,
      username: req.user?.username,
      email: req.user?.email
    });
    console.log('📝 Body data:', req.body);
    console.log('📂 Files:', req.files ? req.files.length : 0);

    // FIXED: Enhanced authentication check
    if (!req.user || !req.user._id) {
      console.log('❌ Authentication failed - no user in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required - user not found in request'
      });
    }

    const userId = req.user._id;
    const { name, description, price, category, stock, condition, tipe } = req.body;

    console.log('🔍 Processing upload with data:', {
      userId: userId.toString(),
      name,
      price,
      category,
      condition,
      tipe,
      filesCount: req.files?.length || 0
    });

    // Validate required fields
    if (!name || !price || !category || !condition || !tipe) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        required: ['name', 'price', 'category', 'condition', 'tipe'],
        received: { name: !!name, price: !!price, category: !!category, condition: !!condition, tipe: !!tipe }
      });
    }

    // Validate files
    if (!req.files || req.files.length === 0) {
      console.log('❌ No files uploaded');
      return res.status(400).json({
        success: false,
        message: 'At least one image is required'
      });
    }

    console.log(`📁 Uploading ${req.files.length} files to Supabase bucket: ${BUCKET_NAME}...`);

    // Upload images to Supabase
    const uploadedImageUrls = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      try {
        // Generate unique filename with user folder structure
        const fileExtension = file.originalname.split('.').pop().toLowerCase();
        const fileName = `${userId}/${uuidv4()}.${fileExtension}`;

        console.log(`📤 Uploading file ${i + 1}/${req.files.length}: ${fileName}`);
        console.log(`   📄 Original: ${file.originalname}`);
        console.log(`   📊 Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        console.log(`   🏷️ Type: ${file.mimetype}`);

        // Upload to Supabase Storage using the configured bucket
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          });

        if (uploadError) {
          console.error('❌ Supabase upload error:', uploadError);
          throw new Error(`Failed to upload ${file.originalname}: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(fileName);

        if (!urlData?.publicUrl) {
          throw new Error(`Failed to get public URL for ${file.originalname}`);
        }

        uploadedImageUrls.push(urlData.publicUrl);
        console.log(`✅ File ${i + 1} uploaded successfully`);
        console.log(`   🌐 Public URL: ${urlData.publicUrl}`);

      } catch (fileError) {
        console.error(`❌ Error uploading file ${i + 1} (${file.originalname}):`, fileError);

        // Clean up already uploaded files if there's an error
        if (uploadedImageUrls.length > 0) {
          console.log('🧹 Cleaning up uploaded files...');
          await cleanupUploadedFiles(uploadedImageUrls);
        }

        return res.status(500).json({
          success: false,
          message: `Failed to upload ${file.originalname}: ${fileError.message}`,
          uploadedCount: i,
          totalFiles: req.files.length
        });
      }
    }

    console.log(`✅ All ${uploadedImageUrls.length} files uploaded successfully`);
    console.log('💾 Creating product in database...');

    // FIXED: Create new product with explicit seller_id assignment
    const productData = {
      seller_id: userId, // FIXED: Explicitly set seller_id
      name: name.trim(),
      description: description ? description.trim() : '',
      price: parseFloat(price),
      category: category.toLowerCase(),
      images: uploadedImageUrls,
      stock: parseInt(stock) || 1,
      condition,
      tipe,
      status: 'active', // FIXED: Explicitly set status
      isVisible: true,   // FIXED: Explicitly set visibility
    };

    console.log('💾 Creating product with data:', productData);

    const newProduct = new Product(productData);

    // Save to database
    const savedProduct = await newProduct.save();

    console.log('✅ Product saved successfully');
    console.log(`   🆔 Product ID: ${savedProduct._id}`);
    console.log(`   👤 Seller ID: ${savedProduct.seller_id}`);
    console.log(`   📷 Images saved: ${uploadedImageUrls.length}`);

    // FIXED: Populate seller data for response
    await savedProduct.populate('seller_id', 'username full_name email');

    // Prepare response
    const responseProduct = {
      ...savedProduct.toObject(),
      imageUrls: uploadedImageUrls,
      imageUrl: uploadedImageUrls[0] // First image as main image
    };

    console.log('📋 Final product response:', {
      id: responseProduct._id,
      name: responseProduct.name,
      seller_id: responseProduct.seller_id,
      images: responseProduct.images?.length || 0,
      status: responseProduct.status,
      isVisible: responseProduct.isVisible
    });

    res.status(201).json({
      success: true,
      message: 'Product uploaded successfully',
      product: responseProduct,
      uploadSummary: {
        totalImages: uploadedImageUrls.length,
        bucket: BUCKET_NAME,
        uploadTimestamp: new Date().toISOString(),
        seller_id: userId.toString() // FIXED: Include seller_id in response for verification
      }
    });

  } catch (error) {
    console.error('💥 Error uploading product:', error);

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }

    // Handle Supabase specific errors
    if (error.message && error.message.includes('Supabase')) {
      return res.status(500).json({
        success: false,
        message: 'File upload service error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Upload service temporarily unavailable'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload product',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Helper function to clean up uploaded files in case of error
const cleanupUploadedFiles = async (imageUrls) => {
  try {
    if (!imageUrls || imageUrls.length === 0) return;

    console.log(`🧹 Cleaning up ${imageUrls.length} uploaded files...`);

    const filePaths = imageUrls.map(url => {
      // Extract file path from Supabase URL
      // URL format: https://project.supabase.co/storage/v1/object/public/bucket/path
      const urlParts = url.split('/');
      const bucketIndex = urlParts.findIndex(part => part === BUCKET_NAME);
      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        return urlParts.slice(bucketIndex + 1).join('/');
      }
      return null;
    }).filter(Boolean);

    if (filePaths.length > 0) {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(filePaths);

      if (error) {
        console.error('❌ Error during cleanup:', error);
      } else {
        console.log(`✅ Cleanup completed: ${filePaths.length} files removed`);
      }
    }
  } catch (cleanupError) {
    console.error('❌ Cleanup error:', cleanupError);
  }
};

module.exports = {
  uploadProduct,
  getProductDetail,
  getAllProducts,
  updateProduct,
  deleteProduct
};