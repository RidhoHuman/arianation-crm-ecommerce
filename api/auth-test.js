// api/auth-test.js - Test auth routing specifically
module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth test endpoint - if you see this, direct routing works',
    request: {
      method: req.method,
      url: req.url,
      path: req.path,
      query: req.query,
      params: req.params,
    },
    handler: 'auth-test.js (direct route)',
  });
};
