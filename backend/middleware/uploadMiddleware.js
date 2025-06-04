// backend/middleware/uploadMiddleware.js - DEBUG VERSION
const multer = require('multer');

// PENTING: Gunakan memory storage untuk serverless functions
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Increase to 10MB untuk testing
    files: 5, // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    console.log('📁 MULTER - Processing file:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      encoding: file.encoding
    });

    // Hanya izinkan file gambar
    if (file.mimetype.startsWith('image/')) {
      console.log('✅ MULTER - File accepted:', file.originalname);
      cb(null, true);
    } else {
      console.log('❌ MULTER - File type not allowed:', file.mimetype);
      cb(new Error('Hanya file gambar yang diizinkan (JPG, PNG, GIF)'), false);
    }
  }
});

// Debug middleware untuk log request
const debugRequest = (req, res, next) => {
  console.log('🔍 DEBUG - Request received:');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Content-Type:', req.get('Content-Type'));
  console.log('Content-Length:', req.get('Content-Length'));
  console.log('Body keys:', Object.keys(req.body || {}));
  console.log('Files before multer:', req.files ? req.files.length : 'undefined');

  // Log headers (without sensitive data)
  const safeHeaders = { ...req.headers };
  if (safeHeaders.authorization) {
    safeHeaders.authorization = 'Bearer [HIDDEN]';
  }
  console.log('Headers:', safeHeaders);

  next();
};

// Enhanced error handler
const handleMulterError = (err, req, res, next) => {
  console.log('🔍 DEBUG - After multer processing:');
  console.log('Files received:', req.files ? req.files.length : 'undefined');
  console.log('Body after multer:', req.body);

  if (req.files) {
    req.files.forEach((file, index) => {
      console.log(`File ${index + 1}:`, {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer ? `${file.buffer.length} bytes` : 'no buffer'
      });
    });
  }

  if (err instanceof multer.MulterError) {
    console.error('❌ MULTER ERROR:', err);

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File terlalu besar. Maksimal 10MB per file.'
      });
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Terlalu banyak file. Maksimal 5 file.'
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Error saat upload file: ' + err.message
    });
  }

  if (err) {
    console.error('❌ UPLOAD ERROR:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'Error saat upload file'
    });
  }

  next();
};

module.exports = upload;
module.exports.handleMulterError = handleMulterError;
module.exports.debugRequest = debugRequest;