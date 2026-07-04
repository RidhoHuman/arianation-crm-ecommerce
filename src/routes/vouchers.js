const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');
const { authenticate, authorize } = require('../middleware/auth');

const { rateLimit } = require('express-rate-limit');

// Rate limiter khusus untuk validasi voucher:
// Maksimal 5 percobaan gagal per IP dalam 1 menit. 
// Jika lebih, diblokir selama 15 menit.
const validateVoucherLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit blokir (waktu cooldown)
  limit: 5, // Limit 5 percobaan
  skipSuccessfulRequests: true, // HANYA hitung jika validasi GAGAL (status >= 400)
  message: {
    success: false,
    message: "Terlalu banyak percobaan kode voucher yang salah. Silakan coba lagi setelah 15 menit."
  }
});

// Public endpoint (kustomer bisa validasi tanpa login / dengan login)
router.post('/validate', validateVoucherLimiter, voucherController.validateVoucher);
router.get('/active', voucherController.getActiveVouchers);

// Admin endpoints
router.use(authenticate, authorize('ADMIN', 'OWNER'));
router.get('/', voucherController.getAllVouchers);
router.post('/', voucherController.createVoucher);
router.put('/:id', voucherController.updateVoucher);
router.delete('/:id', voucherController.deleteVoucher);

module.exports = router;
