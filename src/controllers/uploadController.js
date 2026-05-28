const { createSignedUrl } = require('../middleware/upload');
const knex = require('../config/knex');
const { AuthenticationError, AuthorizationError, NotFoundError } = require('../utils/errors');
const sendSuccess = (res, data, message) => res.json({ success: true, data, message });

/**
 * GET /api/uploads/signed-url?type=products|designs&filename=...&expires=60
 */
const getSignedUrl = async (req, res, next) => {
  try {
    const { type, filename, expires } = req.query;
    if (!type || !filename) {
      return res.status(400).json({ success: false, message: 'Missing type or filename' });
    }

    const allowed = ['products', 'designs'];
    if (!allowed.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid type' });
    }

    // Ownership / role checks
    if (type === 'designs') {
      // Find design request that references this filename
      const designRequest = await knex('designRequest')
        .where('designFile', 'like', `%${filename}%`)
        .first();
      if (!designRequest) {
        throw new NotFoundError('Design file not found');
      }

      // Customers can only request signed URLs for their own design requests
      if (req.user.role === 'CUSTOMER' && designRequest.userId !== req.user.id) {
        throw new AuthorizationError('You do not have access to this file');
      }
    }

    if (type === 'products') {
      // Only ADMIN or OWNER may request product image signed URLs
      if (!['ADMIN', 'OWNER'].includes(req.user.role)) {
        throw new AuthorizationError('Only admin/owner can request product image URLs');
      }

      const product = await knex('product')
        .where('imageUrl', 'like', `%${filename}%`)
        .first();
      if (!product) {
        throw new NotFoundError('Product image not found');
      }
    }

    const key = `${type}/${filename}`;
    const ttl = parseInt(expires, 10) || 60; // seconds

    const url = await createSignedUrl(key, ttl);

    return sendSuccess(res, { url }, 'Signed URL generated');
  } catch (error) {
    next(error);
  }
};

module.exports = { getSignedUrl };
