// api/routes-test.js - Test specific route handling
module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Routes test endpoint',
    request: {
      method: req.method,
      url: req.url,
      path: req.path,
      query: req.query,
      params: req.params,
    },
    handler: 'routes-test.js',
  });
};
