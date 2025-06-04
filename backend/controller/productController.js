// backend/controller/productController.js - CONFIGURED FOR BUCKET: product-image
const Product = require('../models/product');
const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

// Get bucket name from config
const BUCKET_NAME = supabase.BUCKET_NAME || 'product-image';

const uploadProduct = async (req, res) => {
  try {
    console.log('📤 Product upload request received');
    console.log('👤 User ID:', req.user?._id);
    console.log('📝 Body data:', req.body);
    console.log('📂 Files:', req.files ? req.files.length : 0);

    // Check authentication
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userId = req.user._id;
    const { name, description, price, category, stock, condition, tipe } = req.body;

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

    // Create new product with uploaded image URLs
    const newProduct = new Product({
      seller_id: userId,
      name: name.trim(),
      description: description ? description.trim() : '',
      price: parseFloat(price),
      category: category.toLowerCase(),
      images: uploadedImageUrls,
      stock: parseInt(stock) || 1,
      condition,
      tipe,
      status: 'active'
    });

    // Save to database
    const savedProduct = await newProduct.save();

    console.log('✅ Product saved successfully');
    console.log(`   🆔 Product ID: ${savedProduct._id}`);
    console.log(`   📷 Images saved: ${uploadedImageUrls.length}`);

    // Populate seller data for response
    await savedProduct.populate('seller_id', 'username full_name');

    // Prepare response
    const responseProduct = {
      ...savedProduct.toObject(),
      imageUrls: uploadedImageUrls,
      imageUrl: uploadedImageUrls[0] // First image as main image
    };

    res.status(201).json({
      success: true,
      message: 'Product uploaded successfully',
      product: responseProduct,
      uploadSummary: {
        totalImages: uploadedImageUrls.length,
        bucket: BUCKET_NAME,
        uploadTimestamp: new Date().toISOString()
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

// Helper function to extract file path from Supabase URL
const extractFilePathFromUrl = (url) => {
  try {
    // URL format: https://project.supabase.co/storage/v1/object/public/bucket/path
    const urlParts = url.split('/');
    const bucketIndex = urlParts.findIndex(part => part === BUCKET_NAME);

    if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
      return urlParts.slice(bucketIndex + 1).join('/');
    }

    return null;
  } catch (error) {
    console.error('❌ Error extracting file path:', error);
    return null;
  }
};

const getProductDetail = async (req, res) => {
  try {
    const productId = req.params.id;
    console.log('🔍 Fetching product detail for ID:', productId);

    const product = await Product.findById(productId)
      .populate('seller_id', 'username full_name phone email')
      .lean();

    if (!product) {
      console.log('❌ Product not found');
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Add image URLs for backward compatibility
    if (product.images && product.images.length > 0) {
      product.imageUrls = product.images;
      product.imageUrl = product.images[0];
    }

    console.log(`✅ Product found: ${product.name}`);
    console.log(`   📷 Images: ${product.images?.length || 0}`);

    res.json(product);

  } catch (err) {
    console.error('💥 Error fetching product:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const getAllProducts = async (req, res) => {
  try {
    console.log('📋 Fetching all products with filters:', req.query);

    const { category, search, sort } = req.query;
    let filter = { status: 'active' }; // Only show active products

    // Category filter
    if (category && category !== 'All') {
      filter.category = { $regex: new RegExp(category, 'i') };
    }

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: new RegExp(search, 'i') } },
        { description: { $regex: new RegExp(search, 'i') } }
      ];
    }

    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'price-asc':
        sortOption = { price: 1 };
        break;
      case 'price-desc':
        sortOption = { price: -1 };
        break;
      case 'newest':
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    const products = await Product.find(filter)
      .sort(sortOption)
      .populate('seller_id', 'username full_name')
      .lean();

    // Add image URLs for each product
    const productsWithImageUrls = products.map(product => {
      if (product.images && product.images.length > 0) {
        product.imageUrls = product.images;
        product.imageUrl = product.images[0];
      }
      return product;
    });

    console.log(`✅ Found ${productsWithImageUrls.length} products`);
    res.json(productsWithImageUrls);

  } catch (error) {
    console.error('💥 Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user._id;

    console.log(`🔄 Update product request for ID: ${productId}`);

    // Find existing product
    const existingProduct = await Product.findById(productId);

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user owns the product
    if (existingProduct.seller_id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    const { name, description, price, category, condition, tipe, imagesToDelete } = req.body;

    // Start with existing images
    let updatedImages = [...existingProduct.images];

    // Handle image deletion
    if (imagesToDelete) {
      try {
        const toDelete = JSON.parse(imagesToDelete);

        // Remove from Supabase
        if (toDelete.length > 0) {
          console.log(`🗑️ Deleting ${toDelete.length} images from Supabase...`);

          const filePaths = toDelete
            .map(url => extractFilePathFromUrl(url))
            .filter(Boolean);

          if (filePaths.length > 0) {
            const { error: deleteError } = await supabase.storage
              .from(BUCKET_NAME)
              .remove(filePaths);

            if (deleteError) {
              console.error('❌ Error deleting images from Supabase:', deleteError);
            } else {
              console.log(`✅ Deleted ${filePaths.length} images from Supabase`);
            }
          }

          // Remove from array
          updatedImages = updatedImages.filter(img => !toDelete.includes(img));
        }
      } catch (parseError) {
        console.error('❌ Error parsing imagesToDelete:', parseError);
      }
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      console.log(`📤 Uploading ${req.files.length} new images...`);

      for (const file of req.files) {
        try {
          const fileExtension = file.originalname.split('.').pop().toLowerCase();
          const fileName = `${userId}/${uuidv4()}.${fileExtension}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, file.buffer, {
              contentType: file.mimetype,
              upsert: false
            });

          if (uploadError) {
            console.error('❌ Upload error:', uploadError);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);

          if (urlData?.publicUrl) {
            updatedImages.push(urlData.publicUrl);
            console.log(`✅ New image uploaded: ${file.originalname}`);
          }
        } catch (uploadError) {
          console.error(`❌ Error uploading ${file.originalname}:`, uploadError);
        }
      }
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        name: name || existingProduct.name,
        description: description !== undefined ? description : existingProduct.description,
        price: price ? parseFloat(price) : existingProduct.price,
        category: category || existingProduct.category,
        condition: condition || existingProduct.condition,
        tipe: tipe || existingProduct.tipe,
        images: updatedImages
      },
      { new: true }
    ).populate('seller_id', 'username full_name');

    console.log(`✅ Product updated successfully`);
    console.log(`   📷 Final image count: ${updatedImages.length}`);

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: {
        ...updatedProduct.toObject(),
        imageUrls: updatedImages,
        imageUrl: updatedImages[0]
      }
    });

  } catch (error) {
    console.error('💥 Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user._id;

    console.log(`🗑️ Delete product request for ID: ${productId}`);

    // Find product
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership
    if (product.seller_id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    // Delete images from Supabase
    if (product.images && product.images.length > 0) {
      console.log(`🗑️ Deleting ${product.images.length} images from Supabase...`);

      const filePaths = product.images
        .map(url => extractFilePathFromUrl(url))
        .filter(Boolean);

      if (filePaths.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove(filePaths);

        if (deleteError) {
          console.error('❌ Error deleting images:', deleteError);
        } else {
          console.log(`✅ Deleted ${filePaths.length} images from Supabase`);
        }
      }
    }

    // Delete product from database
    await Product.findByIdAndDelete(productId);

    console.log(`✅ Product deleted successfully: ${product.name}`);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('💥 Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  uploadProduct,
  getProductDetail,
  getAllProducts,
  updateProduct,
  deleteProduct
};