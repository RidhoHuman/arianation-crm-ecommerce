module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Test routing pattern works',
    path: req.url,
    method: req.method
  });
};
