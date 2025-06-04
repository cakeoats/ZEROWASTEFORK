// backend/middleware/uploadMiddleware.js - SUPABASE INTEGRATED VERSION
const multer = require('multer');
const path = require('path');

// Configure storage - Memory storage untuk Supabase upload
const storage = multer.memoryStorage();

// Enhanced file filter with more validation
const fileFilter = (req, file, cb) => {
  console.log('📁 Processing uploaded file:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });

  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    // Additional validation for supported formats
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      console.log('✅ File accepted:', file.originalname);
      cb(null, true);
    } else {
      console.log('❌ Unsupported image format:', file.mimetype);
      const error = new Error(`Unsupported image format: ${file.mimetype}. Allowed: JPEG, PNG, GIF, WebP`);
      error.code = 'UNSUPPORTED_FORMAT';
      cb(error, false);
    }
  } else {
    console.log('❌ File is not an image:', file.mimetype);
    const error = new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)');
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

// Enhanced multer configuration for Supabase
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file (Supabase default limit)
    files: 5, // Maximum 5 files per upload
    fieldSize: 1024 * 1024, // 1MB field size
    fieldNameSize: 100, // Field name limit
    fields: 10 // Max number of non-file fields
  },
  fileFilter: fileFilter,
  // Additional options for better error handling
  preservePath: false,
  onError: (err, next) => {
    console.error('❌ Multer error:', err);
    next(err);
  }
});

// Custom error handler for better error messages
const handleUploadError = (error) => {
  console.error('💥 Upload middleware error:', error);

  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return {
        status: 400,
        message: 'File too large. Maximum size is 10MB per file.',
        code: 'FILE_TOO_LARGE'
      };

    case 'LIMIT_FILE_COUNT':
      return {
        status: 400,
        message: 'Too many files. Maximum 5 files allowed.',
        code: 'TOO_MANY_FILES'
      };

    case 'LIMIT_UNEXPECTED_FILE':
      return {
        status: 400,
        message: 'Unexpected field name. Use "images" as field name.',
        code: 'UNEXPECTED_FIELD'
      };

    case 'INVALID_FILE_TYPE':
    case 'UNSUPPORTED_FORMAT':
      return {
        status: 400,
        message: error.message,
        code: error.code
      };

    case 'LIMIT_FIELD_COUNT':
      return {
        status: 400,
        message: 'Too many fields in request.',
        code: 'TOO_MANY_FIELDS'
      };

    default:
      return {
        status: 500,
        message: error.message || 'Upload processing error',
        code: 'UPLOAD_ERROR'
      };
  }
};

// Middleware wrapper untuk integrasi dengan Supabase workflow
const createUploadMiddleware = (fieldName = 'images', maxFiles = 5) => {
  return (req, res, next) => {
    console.log(`🔄 Starting upload process for field: ${fieldName}`);
    console.log('📊 Request info:', {
      method: req.method,
      url: req.url,
      contentType: req.get('Content-Type'),
      contentLength: req.get('Content-Length')
    });

    // Use multer's array method for multiple files
    const uploadHandler = upload.array(fieldName, maxFiles);

    uploadHandler(req, res, (err) => {
      if (err) {
        console.error('❌ Multer processing error:', err);
        const errorInfo = handleUploadError(err);

        return res.status(errorInfo.status).json({
          success: false,
          message: errorInfo.message,
          code: errorInfo.code,
          details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
      }

      // Log successful upload info
      if (req.files && req.files.length > 0) {
        console.log('✅ Files processed successfully:');
        req.files.forEach((file, index) => {
          console.log(`   ${index + 1}. ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        });

        // Add file validation summary to request
        req.uploadSummary = {
          totalFiles: req.files.length,
          totalSize: req.files.reduce((sum, file) => sum + file.size, 0),
          fileTypes: [...new Set(req.files.map(file => file.mimetype))]
        };

        console.log('📈 Upload summary:', req.uploadSummary);
      } else {
        console.log('ℹ️ No files in request');
      }

      console.log('✅ Upload middleware completed successfully');
      next();
    });
  };
};

// Default export - untuk kompatibilitas dengan kode lama
module.exports = upload;

// Named exports untuk fleksibilitas
module.exports.createUploadMiddleware = createUploadMiddleware;
module.exports.handleUploadError = handleUploadError;

// Pre-configured middleware untuk berbagai use case
module.exports.uploadImages = createUploadMiddleware('images', 5);
module.exports.uploadSingle = (fieldName = 'image') => {
  return (req, res, next) => {
    const uploadHandler = upload.single(fieldName);

    uploadHandler(req, res, (err) => {
      if (err) {
        const errorInfo = handleUploadError(err);
        return res.status(errorInfo.status).json({
          success: false,
          message: errorInfo.message,
          code: errorInfo.code
        });
      }
      next();
    });
  };
};

// File validation utilities
module.exports.validateFileSize = (maxSizeMB = 10) => {
  return (req, res, next) => {
    if (req.files) {
      const oversizedFiles = req.files.filter(file => file.size > maxSizeMB * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Files exceed ${maxSizeMB}MB limit`,
          oversizedFiles: oversizedFiles.map(f => f.originalname)
        });
      }
    }
    next();
  };
};

module.exports.validateImageDimensions = async (req, res, next) => {
  // This could be enhanced to check image dimensions if needed
  // For now, just pass through
  next();
};

console.log('✅ Upload middleware (Supabase-ready) configured successfully');