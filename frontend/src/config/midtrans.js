const MIDTRANS_CONFIG = {
  development: {
    scriptUrl: 'https://app.sandbox.midtrans.com/snap/snap.js',
    clientKey: 'SB-Mid-client-FHBq0wtUSyCEStlH', // Pastikan ini benar
    isProduction: false
  },
  production: {
    scriptUrl: 'https://app.midtrans.com/snap/snap.js',
    clientKey: 'Mid-client-axaDAjpfCGFhcFrJ', // Untuk production nanti
    isProduction: true
  }
};

// PERBAIKAN: Gunakan environment variable jika ada
const environment = process.env.NODE_ENV || 'development';
const clientKeyFromEnv = process.env.REACT_APP_MIDTRANS_CLIENT_KEY_SANDBOX;

// Override dengan environment variable jika tersedia
if (clientKeyFromEnv && environment === 'development') {
  MIDTRANS_CONFIG.development.clientKey = clientKeyFromEnv;
}

export const midtransConfig = MIDTRANS_CONFIG[environment];

// TAMBAHAN: Validasi client key
if (!midtransConfig.clientKey) {
  console.error('❌ Midtrans client key tidak ditemukan!');
  console.error('Periksa konfigurasi di file ini atau environment variable');
}

export default midtransConfig;