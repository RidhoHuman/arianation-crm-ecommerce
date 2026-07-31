const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0));
}

function buildBaseTemplate({ title, message, orderNumber, customerName, ctaText, ctaUrl }) {
  const safeTitle = title || 'Pemberitahuan Order';
  const safeMessage = message || '';
  const orderLabel = orderNumber ? `Order #${orderNumber}` : 'Order Arianation';
  const greetingName = customerName || 'Pelanggan';

  const text = [
    `Halo ${greetingName},`,
    '',
    safeTitle,
    safeMessage,
    orderNumber ? `Nomor order: ${orderNumber}` : null,
    ctaUrl ? `Tautan: ${ctaUrl}` : null,
    '',
    'Terima kasih,',
    'Tim Arianation',
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 640px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px;">
      <div style="margin-bottom: 20px;">
        <div style="font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: #6b7280;">Arianation Notification</div>
        <h1 style="margin: 8px 0 0; font-size: 24px;">${safeTitle}</h1>
        <p style="margin: 8px 0 0; color: #4b5563;">${orderLabel}</p>
      </div>
      <p style="margin: 0 0 16px;">Halo ${greetingName},</p>
      <p style="margin: 0 0 16px;">${safeMessage}</p>
      ${ctaUrl ? `<p style="margin: 24px 0;"><a href="${ctaUrl}" style="background:#111827;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;display:inline-block;">${ctaText || 'Lihat Detail'}</a></p>` : ''}
      <p style="margin: 24px 0 0; color: #6b7280;">Terima kasih,<br/>Tim Arianation</p>
    </div>
  `;

  return { subject: safeTitle, text, html };
}

function renderOrderNotificationEmail({ notification, customer, order }) {
  const customerName = customer?.fullName || 'Pelanggan';
  const orderNumber =
    order?.orderNumber || notification?.order?.orderNumber || notification?.orderId;

  switch (notification?.type) {
    case 'CONFIRMED':
      return buildBaseTemplate({
        title: 'Pesanan Anda Telah Dikonfirmasi',
        message: 'Pembayaran Anda telah kami terima dan pesanan sedang kami siapkan.',
        orderNumber,
        customerName,
        ctaText: 'Lihat Pesanan',
        ctaUrl: process.env.FRONTEND_URL
          ? `${process.env.FRONTEND_URL}/orders/${notification.orderId}`
          : null,
      });
    case 'PROCESSING':
      const isPickupProcess = order?.deliveryType === 'PICKUP' || order?.shippingCourier === 'SELF_PICKUP';
      return buildBaseTemplate({
        title: 'Pesanan Sedang Diproses',
        message: isPickupProcess 
          ? 'Tim kami sedang menyiapkan pesanan Anda. Kami akan memberitahu Anda segera setelah pesanan siap untuk diambil di toko.'
          : 'Tim kami sedang menyiapkan pesanan Anda untuk tahap pengiriman berikutnya.',
        orderNumber,
        customerName,
      });
    case 'READY_FOR_DELIVERY':
      return buildBaseTemplate({
        title: 'Pesanan Siap Dikirim',
        message: 'Pesanan Anda sudah selesai disiapkan dan siap diserahkan ke kurir.',
        orderNumber,
        customerName,
      });
    case 'SHIPPED':
      return buildBaseTemplate({
        title: 'Pesanan Telah Dikirim',
        message: 'Pesanan Anda sudah dikirim. Silakan cek status pengiriman secara berkala.',
        orderNumber,
        customerName,
      });
    case 'DELIVERED':
      const isPickup = order?.deliveryType === 'PICKUP';
      return buildBaseTemplate({
        title: isPickup ? 'Pesanan Telah Diambil' : 'Pesanan Telah Diterima',
        message: isPickup
          ? 'Terima kasih telah berkunjung dan mengambil pesanan Anda di Arianation!'
          : 'Pesanan Anda telah diterima. Terima kasih telah berbelanja di Arianation.',
        orderNumber,
        customerName,
      });
    case 'CANCELLED':
      return buildBaseTemplate({
        title: 'Pesanan Dibatalkan',
        message:
          'Pesanan Anda telah dibatalkan. Silakan hubungi tim kami jika Anda memerlukan bantuan.',
        orderNumber,
        customerName,
      });
    case 'FAILED':
      return buildBaseTemplate({
        title: 'Terjadi Kendala pada Pesanan',
        message: 'Terdapat kendala pada pesanan Anda. Tim kami akan menindaklanjuti lebih lanjut.',
        orderNumber,
        customerName,
      });
    case 'TEST':
    default:
      return buildBaseTemplate({
        title: notification?.title || 'Test Notification',
        message: notification?.message || 'Notifikasi uji dari sistem Arianation.',
        orderNumber,
        customerName,
      });
  }
}

function renderPromoEmail({ subject, message, useTemplate = true }) {
  const safeSubject = subject || 'Promo Spesial Arianation';
  const safeMessage = message || '';

  // Parse newlines to <br> for HTML rendering if user inputs manual text
  const htmlMessage = safeMessage.replace(/\n/g, '<br/>');

  let html;
  if (useTemplate) {
    html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <!-- Header -->
        <div style="background: #000000; padding: 24px; text-align: center;">
          <img src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="AriaNation Banner" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 16px;" />
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px;">ARIANATION</h1>
        </div>
        
        <!-- Body -->
        <div style="padding: 32px 24px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
          <p style="font-size: 16px;">${htmlMessage}</p>
          <div style="text-align: center; margin-top: 32px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="background-color: #8c1515; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">BELANJA SEKARANG</a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f3f4f6; padding: 24px; text-align: center; font-size: 12px; color: #6b7280; border: 1px solid #e5e7eb; border-top: none;">
          <p>Anda menerima email ini karena berlangganan newsletter AriaNation.</p>
          <p>&copy; ${new Date().getFullYear()} AriaNation. All rights reserved.</p>
        </div>
      </div>
    `;
  } else {
    // Plain HTML without wrapper, just basic formatting
    html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto;">
        ${htmlMessage}
      </div>
    `;
  }

  const text = safeMessage;

  return { subject: safeSubject, text, html };
}

module.exports = {
  formatCurrency,
  renderOrderNotificationEmail,
  renderPromoEmail,
};
