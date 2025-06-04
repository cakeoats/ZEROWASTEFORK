// backend/middleware/uploadMiddleware.js - SUPABASE VERSION
const multer = require('multer');

// PENTING: Gunakan memory storage untuk serverless functions
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 5, // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    console.log('📁 Processing file:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    // Hanya izinkan file gambar
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      console.log('❌ File type not allowed:', file.mimetype);
      cb(new Error('Hanya file gambar yang diizinkan (JPG, PNG, GIF)'), false);
    }
  }
});

// Error handler untuk multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('❌ Multer Error:', err);

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File terlalu besar. Maksimal 5MB per file.'
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
    console.error('❌ Upload Error:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'Error saat upload file'
    });
  }

  next();
};

module.exports = upload;
module.exports.handleMulterError = handleMulterError;