const midtransClient = require('midtrans-client');

// Create Core API / Snap instance
const isProd = process.env.MIDTRANS_IS_PRODUCTION === 'true';

const snap = new midtransClient.Snap({
  isProduction: isProd,
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-YOUR_SERVER_KEY',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-YOUR_CLIENT_KEY'
});

const coreApi = new midtransClient.CoreApi({
  isProduction: isProd,
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-YOUR_SERVER_KEY',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-YOUR_CLIENT_KEY'
});

module.exports = {
  snap,
  coreApi
};
