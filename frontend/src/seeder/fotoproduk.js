const fs = require('fs');
const path = require('path');
const https = require('https');

const images = [
  { filename: 'sepeda.jpg', url: 'https://images.unsplash.com/photo-1605711160720-7b9c82dc4b8a' },
  { filename: 'dilan.jpg', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794' },
  { filename: 'kaos-putih.jpg', url: 'https://images.unsplash.com/photo-1618354691373-7f7bdf164cf7' },
  { filename: 'meja.jpg', url: 'https://images.unsplash.com/photo-1598300058175-08bc876ca0f1' },
  { filename: 'rak.jpg', url: 'https://images.unsplash.com/photo-1584941571062-7f73dc12b64d' },
  { filename: 'jeans.jpg', url: 'https://images.unsplash.com/photo-1602810316897-91da58e53a36' },
  { filename: 'teddy.jpg', url: 'https://images.unsplash.com/photo-1607083202884-c4e3cba16cba' },
  { filename: 'laptop.jpg', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8' },
  { filename: 'kipas.jpg', url: 'https://images.unsplash.com/photo-1600423115367-66c2b56c8884' },
  { filename: 'eiger.jpg', url: 'https://images.unsplash.com/photo-1532153955177-f59af40d6472' },
];

const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded: ${path.basename(filepath)}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlinkSync(filepath);
      console.error(`❌ Error downloading ${url}:`, err.message);
      reject(err);
    });
  });
};

(async () => {
  const publicPath = path.resolve(__dirname, '../../public/images');
  if (!fs.existsSync(publicPath)) fs.mkdirSync(publicPath, { recursive: true });

  for (const img of images) {
    const filepath = path.join(publicPath, img.filename);
    if (!fs.existsSync(filepath)) {
      try {
        await downloadImage(img.url, filepath);
      } catch (err) {
        console.error('Failed to download:', img.filename);
      }
    } else {
      console.log(`🟡 Already exists: ${img.filename}`);
    }
  }

  console.log('📦 All images ready in /public/images/');
})();
