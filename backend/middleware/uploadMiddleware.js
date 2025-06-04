// backend/middleware/uploadMiddleware.js (REPLACE SELURUH ISI FILE)
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
    // Hanya izinkan file gambar
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diizinkan'), false);
    }
  }
});

module.exports = upload;