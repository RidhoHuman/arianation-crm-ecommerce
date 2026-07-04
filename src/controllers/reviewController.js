const knex = require('../config/knex');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../middleware/errorHandler');

// Kustomer: Membuat ulasan
const createReview = async (req, res, next) => {
  try {
    const { productId, orderId, rating, comment, imageUrl } = req.body;
    const userId = req.user.id; // Asumsikan user id dari auth middleware

    if (!productId || !orderId || !rating || !comment) {
      throw new BadRequestError('Product ID, Order ID, Rating, dan Comment wajib diisi');
    }

    if (rating < 1 || rating > 5) {
      throw new BadRequestError('Rating harus antara 1 dan 5');
    }

    // 1. Validasi Kepemilikan & Status Pesanan
    const order = await knex('order')
      .where('id', orderId)
      .andWhere('userId', userId)
      .first();

    if (!order) {
      throw new ForbiddenError('Anda tidak memiliki akses ke pesanan ini');
    }

    // Pastikan order status adalah DELIVERED (Selesai)
    if (order.status !== 'DELIVERED') {
      throw new BadRequestError('Ulasan hanya bisa diberikan untuk pesanan yang sudah selesai (DELIVERED)');
    }

    // Pastikan produk ada di dalam order
    const orderItem = await knex('orderItem')
      .where('orderId', orderId)
      .andWhere('productId', productId)
      .first();

    if (!orderItem) {
      throw new BadRequestError('Produk tidak ditemukan dalam pesanan Anda');
    }

    // Pastikan belum pernah review produk ini dari order ini
    const existingReview = await knex('product_review')
      .where('orderId', orderId)
      .andWhere('productId', productId)
      .first();

    if (existingReview) {
      throw new BadRequestError('Anda sudah memberikan ulasan untuk produk ini pada pesanan ini');
    }

    // 2. Tentukan Poin Insentif (1 Poin = Rp 10 -> 500 Poin = Rp 5000, 100 Poin = Rp 1000)
    // Sesuai masukan QC:
    const pointsAwarded = imageUrl ? 500 : 100;

    // 3. Simpan Ulasan
    await knex('product_review').insert({
      productId,
      userId,
      orderId,
      rating,
      comment,
      imageUrl: imageUrl || null,
      pointsAwarded,
      isVerified: true
    });

    // 4. Tambahkan Poin ke User
    await knex('user')
      .where('id', userId)
      .increment('rewardPoints', pointsAwarded);

    // Ambil data user terbaru untuk kembalian
    const updatedUser = await knex('user').where('id', userId).first();

    res.status(201).json({
      success: true,
      message: `Ulasan berhasil dikirim. Anda mendapatkan ${pointsAwarded} Poin!`,
      data: {
        pointsAwarded,
        newTotalPoints: updatedUser.rewardPoints
      }
    });
  } catch (error) {
    next(error);
  }
};

// Publik: Melihat ulasan sebuah produk
const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    // Ambil review beserta nama user
    const reviews = await knex('product_review')
      .join('user', 'product_review.userId', '=', 'user.id')
      .where('product_review.productId', productId)
      .select(
        'product_review.*',
        'user.fullName as userName'
      )
      .orderBy('product_review.created_at', 'desc');

    // Hitung rata-rata
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0 
      ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        reviews,
        stats: {
          totalReviews,
          avgRating: Number(avgRating)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Mendapatkan semua ulasan (dengan filter opsional)
const getAllReviewsAdmin = async (req, res, next) => {
  try {
    const reviews = await knex('product_review')
      .join('user', 'product_review.userId', '=', 'user.id')
      .join('product', 'product_review.productId', '=', 'product.id')
      .select(
        'product_review.*',
        'user.fullName as userName',
        'user.email as userEmail',
        'product.productName'
      )
      .orderBy('product_review.created_at', 'desc');

    res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Menghapus ulasan (Spam / Kata-kata kotor)
const deleteReviewAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await knex('product_review').where({ id }).first();
    
    if (!review) {
      throw new NotFoundError('Ulasan tidak ditemukan');
    }

    await knex('product_review').where({ id }).del();

    res.status(200).json({
      success: true,
      message: 'Ulasan berhasil dihapus'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getProductReviews,
  getAllReviewsAdmin,
  deleteReviewAdmin
};
