require('dotenv').config();
const knex = require('./src/config/knex');
const cuid = require('cuid');

async function testVoucherLogic() {
  console.log('--- 🧪 UJI COBA VOUCHER & CHECKOUT ENGINE ---');
  
  try {
    // 1. Buat Data Voucher Dummy (Simulasi Admin)
    const testCode = 'TEST50';
    console.log(`\n[1] Mengecek/Membuat Voucher [${testCode}]...`);
    
    // Hapus jika sudah ada dari tes sebelumnya
    await knex('voucher').where('code', testCode).delete();
    
    const voucherId = cuid();
    await knex('voucher').insert({
      id: voucherId,
      code: testCode,
      type: 'PERCENTAGE', // Diskon 50%
      value: 50, 
      minPurchase: 100000, // Minimal belanja 100rb
      maxDiscount: 50000,  // Maksimal potongan 50rb
      usageLimit: 10,
      usedCount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log(`✅ Voucher berhasil dibuat! (ID: ${voucherId})`);
    
    // 2. Simulasi Logic Order Controller (Tanpa hit endpoint Express)
    console.log('\n[2] Simulasi Perhitungan Diskon Berjenjang (Checkout)...');
    
    const cartTotal = 200000; // Total barang di keranjang
    const tierDiscountPercentage = 10; // Asumsi kustomer adalah GOLD (Diskon 10%)
    const usePoints = true;
    const userRewardPoints = 50; // Kustomer punya 50 Poin = Rp 50.000
    
    console.log(`- Harga Dasar Keranjang  : Rp ${cartTotal.toLocaleString('id-ID')}`);
    
    let finalAmount = cartTotal;
    
    // Tahap 1: Potong Diskon Tier
    const tierDiscountAmount = Math.floor(cartTotal * (tierDiscountPercentage / 100));
    finalAmount -= tierDiscountAmount;
    console.log(`- [STEP 1] Diskon Tier (GOLD 10%) : -Rp ${tierDiscountAmount.toLocaleString('id-ID')} -> Sisa: Rp ${finalAmount.toLocaleString('id-ID')}`);
    
    // Tahap 2: Potong Voucher
    let voucherDiscountAmount = 0;
    const voucher = await knex('voucher').where('code', testCode).first();
    
    if (voucher && voucher.isActive && finalAmount >= voucher.minPurchase) {
      if (voucher.type === 'PERCENTAGE') {
        voucherDiscountAmount = Math.floor(finalAmount * (voucher.value / 100));
        // Cek Max Discount
        if (voucher.maxDiscount > 0 && voucherDiscountAmount > voucher.maxDiscount) {
          voucherDiscountAmount = Number(voucher.maxDiscount);
        }
      }
      
      if (voucherDiscountAmount > finalAmount) {
        voucherDiscountAmount = finalAmount;
      }
      finalAmount -= voucherDiscountAmount;
      console.log(`- [STEP 2] Kupon ${testCode} (Max 50K)   : -Rp ${voucherDiscountAmount.toLocaleString('id-ID')} -> Sisa: Rp ${finalAmount.toLocaleString('id-ID')}`);
    } else {
      console.log('- [STEP 2] Kupon tidak memenuhi syarat (GAGAL)');
    }
    
    // Tahap 3: Potong Aria Points
    let pointsToDeduct = 0;
    if (usePoints && userRewardPoints > 0) {
      const discountFromPoints = userRewardPoints * 1000;
      if (discountFromPoints > finalAmount) {
        pointsToDeduct = Math.ceil(finalAmount / 1000);
      } else {
        pointsToDeduct = userRewardPoints;
      }
      const actualPointDiscount = pointsToDeduct * 1000;
      finalAmount -= actualPointDiscount;
      console.log(`- [STEP 3] Tukar ${pointsToDeduct} Aria Points  : -Rp ${actualPointDiscount.toLocaleString('id-ID')} -> Sisa: Rp ${finalAmount.toLocaleString('id-ID')}`);
    }
    
    // Tahap 4: Failsafe Floor Limit
    if (finalAmount < 0) {
      console.log(`⚠️ TAGIHAN MINUS TERDETEKSI (Rp ${finalAmount.toLocaleString('id-ID')}) -> MENGAKTIFKAN FLOOR LIMIT`);
      finalAmount = 0;
    }
    
    console.log(`\n========================================`);
    console.log(`💰 TAGIHAN AKHIR (Yg dikirim ke Xendit): Rp ${finalAmount.toLocaleString('id-ID')}`);
    console.log(`========================================`);
    
    if (finalAmount === 80000) {
      console.log('✅ UJI COBA SUKSES: Matematika bekerja dengan presisi!');
    } else {
      console.log('❌ UJI COBA GAGAL: Ada yang salah dengan kalkulasinya.');
    }
    
  } catch (error) {
    console.error('❌ Error Terjadi:', error);
  } finally {
    process.exit();
  }
}

testVoucherLogic();
