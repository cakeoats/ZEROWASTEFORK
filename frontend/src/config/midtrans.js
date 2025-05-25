const MIDTRANS_CONFIG = {
  development: {
    scriptUrl: 'https://app.sandbox.midtrans.com/snap/snap.js',
    clientKey: 'SB-Mid-client-FHBq0wtUSyCEStlH',
    isProduction: false
  },
  production: {
    scriptUrl: 'https://app.midtrans.com/snap/snap.js', 
    clientKey: 'Mid-client-axaDAjpfCGFhcFrJ',
    isProduction: true
  }
};

// Get current environment
const environment = process.env.NODE_ENV || 'development';
export const midtransConfig = MIDTRANS_CONFIG[environment];

export default midtransConfig;