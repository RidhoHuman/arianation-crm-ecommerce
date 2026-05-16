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
  ].filter(Boolean).join('\n');

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
  const orderNumber = order?.orderNumber || notification?.order?.orderNumber || notification?.orderId;

  switch (notification?.type) {
    case 'CONFIRMED':
      return buildBaseTemplate({
        title: 'Pesanan Anda Telah Dikonfirmasi',
        message: 'Pembayaran Anda telah kami terima dan pesanan sedang kami siapkan.',
        orderNumber,
        customerName,
        ctaText: 'Lihat Pesanan',
        ctaUrl: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/orders/${notification.orderId}` : null,
      });
    case 'PROCESSING':
      return buildBaseTemplate({
        title: 'Pesanan Sedang Diproses',
        message: 'Tim kami sedang menyiapkan pesanan Anda untuk tahap pengiriman berikutnya.',
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
      return buildBaseTemplate({
        title: 'Pesanan Telah Diterima',
        message: 'Pesanan Anda telah diterima. Terima kasih telah berbelanja di Arianation.',
        orderNumber,
        customerName,
      });
    case 'CANCELLED':
      return buildBaseTemplate({
        title: 'Pesanan Dibatalkan',
        message: 'Pesanan Anda telah dibatalkan. Silakan hubungi tim kami jika Anda memerlukan bantuan.',
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

module.exports = {
  formatCurrency,
  renderOrderNotificationEmail,
};