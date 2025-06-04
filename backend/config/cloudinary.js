// backend/config/cloudinary.js (FILE BARU)
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test connection
const testConnection = async () => {
    try {
        const result = await cloudinary.api.ping();
        console.log('✅ Cloudinary connected successfully:', result);
    } catch (error) {
        console.error('❌ Cloudinary connection failed:', error.message);
    }
};

// Call test on startup
if (process.env.NODE_ENV !== 'test') {
    testConnection();
}

module.exports = cloudinary;