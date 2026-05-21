// Minimal test to see if [...slug].js handler is invoked
module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Catch-all handler works',
    path: req.url || req.path || 'NO PATH',
    method: req.method
  });
};
