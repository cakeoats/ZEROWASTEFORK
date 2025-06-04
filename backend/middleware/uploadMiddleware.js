// backend/middleware/uploadMiddleware.js - SIMPLE VERSION (sementara)
const multer = require('multer');

// Simple memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5,
  },
  fileFilter: (req, file, cb) => {
    console.log('📁 Processing file:', file.originalname, file.mimetype);

    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'), false);
    }
  }
});

// Export the upload function directly
module.exports = upload;