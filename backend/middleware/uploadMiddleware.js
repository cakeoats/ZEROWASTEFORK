// backend/middleware/uploadMiddleware.js - UPDATED untuk profile picture
const multer = require('multer');
const path = require('path');

// Enhanced file filter with better validation
const fileFilter = (req, file, cb) => {
  console.log('🔍 File filter check:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });

  // Check if it's an image
  if (file.mimetype.startsWith('image/')) {
    // Additional check for common image extensions
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(fileExtension)) {
      console.log('✅ File type approved:', file.mimetype);
      cb(null, true);
    } else {
      console.log('❌ File extension not allowed:', fileExtension);
      cb(new Error('Only image files with extensions .jpg, .jpeg, .png, .gif, .webp are allowed'), false);
    }
  } else {
    console.log('❌ File type not allowed:', file.mimetype);
    cb(new Error('Only image files are allowed'), false);
  }
};

// Memory storage configuration (for Supabase upload)
const storage = multer.memoryStorage();

// Create multer instance with comprehensive configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5, // Maximum 5 files
    fields: 10, // Maximum 10 form fields
    fieldNameSize: 100, // Maximum field name size
    fieldSize: 1024 * 1024 // Maximum field value size (1MB)
  },
  fileFilter: fileFilter
});

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  console.error('📁 Upload error details:', {
    code: error.code,
    message: error.message,
    field: error.field,
    storageErrors: error.storageErrors
  });

  // Handle different types of upload errors
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File terlalu besar. Maksimal 10MB per file.',
          code: 'FILE_TOO_LARGE'
        });

      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Terlalu banyak file. Maksimal 5 file.',
          code: 'TOO_MANY_FILES'
        });

      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Field file tidak diizinkan. Gunakan "images" untuk product atau "profilePicture" untuk profile.',
          code: 'UNEXPECTED_FIELD'
        });

      case 'LIMIT_PART_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Terlalu banyak bagian dalam form.',
          code: 'TOO_MANY_PARTS'
        });

      case 'LIMIT_FIELD_KEY':
        return res.status(400).json({
          success: false,
          message: 'Nama field terlalu panjang.',
          code: 'FIELD_NAME_TOO_LONG'
        });

      case 'LIMIT_FIELD_VALUE':
        return res.status(400).json({
          success: false,
          message: 'Nilai field terlalu besar.',
          code: 'FIELD_VALUE_TOO_LARGE'
        });

      case 'LIMIT_FIELD_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Terlalu banyak field dalam form.',
          code: 'TOO_MANY_FIELDS'
        });

      default:
        return res.status(400).json({
          success: false,
          message: `Upload error: ${error.message}`,
          code: error.code
        });
    }
  }

  // Handle custom validation errors
  if (error.message.includes('Only image files')) {
    return res.status(400).json({
      success: false,
      message: 'Hanya file gambar yang diperbolehkan (JPG, PNG, GIF, WebP).',
      code: 'INVALID_FILE_TYPE'
    });
  }

  // Handle other errors
  return res.status(500).json({
    success: false,
    message: 'Upload error occurred',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
};

// Enhanced logging middleware
const logUploadDetails = (req, res, next) => {
  const startTime = Date.now();

  // Log request details
  console.log('📤 Upload request started:', {
    method: req.method,
    url: req.originalUrl,
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    userAgent: req.get('User-Agent')?.substring(0, 100),
    timestamp: new Date().toISOString()
  });

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function (body) {
    const duration = Date.now() - startTime;
    console.log('📤 Upload request completed:', {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      success: body?.success !== false,
      filesProcessed: req.files?.length || (req.file ? 1 : 0)
    });
    return originalJson.call(this, body);
  };

  next();
};

// Create different upload handlers
const createUploadMiddleware = (fieldName, maxCount = 1) => {
  console.log('🔧 Creating upload middleware for field:', fieldName, 'maxCount:', maxCount);

  if (maxCount === 1) {
    // Single file upload (for profile pictures)
    return [
      logUploadDetails,
      upload.single(fieldName),
      handleUploadError
    ];
  } else {
    // Multiple file upload (for products)
    return [
      logUploadDetails,
      upload.array(fieldName, maxCount),
      handleUploadError
    ];
  }
};

// Specific middleware for different use cases
const uploadProfilePicture = createUploadMiddleware('profilePicture', 1);
const uploadProductImages = createUploadMiddleware('images', 5);

// Legacy support - single file upload
const uploadImages = upload.array('images', 5);

// Validation middleware for profile picture
const validateProfilePicture = (req, res, next) => {
  console.log('🔍 Validating profile picture...');

  if (!req.file) {
    console.log('❌ No profile picture file provided');
    return res.status(400).json({
      success: false,
      message: 'Profile picture file is required'
    });
  }

  const file = req.file;

  // Additional validations
  if (file.size > 5 * 1024 * 1024) { // 5MB limit for profile pictures
    console.log('❌ Profile picture too large:', file.size);
    return res.status(400).json({
      success: false,
      message: 'Profile picture size must be less than 5MB'
    });
  }

  // Check image dimensions (optional)
  // This would require image processing library like sharp

  console.log('✅ Profile picture validation passed');
  next();
};

// Validation middleware for product images
const validateProductImages = (req, res, next) => {
  console.log('🔍 Validating product images...');

  if (!req.files || req.files.length === 0) {
    console.log('❌ No product images provided');
    return res.status(400).json({
      success: false,
      message: 'At least one product image is required'
    });
  }

  const files = req.files;

  // Validate each file
  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (file.size > 10 * 1024 * 1024) { // 10MB limit per image
      console.log('❌ Product image too large:', file.originalname, file.size);
      return res.status(400).json({
        success: false,
        message: `Image ${file.originalname} is too large. Maximum size is 10MB per image.`
      });
    }
  }

  console.log('✅ Product images validation passed');
  next();
};

module.exports = {
  // Main upload handlers
  uploadProfilePicture,
  uploadProductImages,
  uploadImages, // Legacy support

  // Validation middleware
  validateProfilePicture,
  validateProductImages,

  // Error handler
  handleUploadError,

  // Factory function
  createUploadMiddleware,

  // Raw multer instance (if needed)
  upload
};