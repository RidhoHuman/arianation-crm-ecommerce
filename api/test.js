// api/test.js - Minimal test handler for Vercel
// This just returns JSON without any dependencies

module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Test endpoint working',
    timestamp: new Date(),
  });
};
