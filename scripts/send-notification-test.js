// scripts/send-notification-test.js
const prisma = require('../src/config/database');
const { queueNotification, sendOrderNotification } = require('../src/services/notificationService');

async function getFallbackOrderId() {
  const latestOrder = await prisma.order.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { id: true, orderNumber: true },
  });

  return latestOrder ? latestOrder.id : null;
}

async function createTestOrder() {
  const uniqueSuffix = Date.now().toString(36);

  let customer = await prisma.user.findFirst({
    where: { role: 'CUSTOMER' },
    select: { id: true, fullName: true, email: true },
  });

  if (!customer) {
    customer = await prisma.user.create({
      data: {
        email: `notif-test-${uniqueSuffix}@example.com`,
        password: 'test12345',
        fullName: 'Notification Test Customer',
        role: 'CUSTOMER',
        isActive: true,
        customerProfile: {
          create: {
            address: 'Alamat test notifikasi',
            city: 'Surabaya',
            postalCode: '60111',
            province: 'Jawa Timur',
          },
        },
      },
      select: { id: true, fullName: true, email: true },
    });
  }

  await prisma.customerMetrics.upsert({
    where: { userId: customer.id },
    update: {},
    create: {
      userId: customer.id,
      totalTransactions: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      currentTier: 'BRONZE',
      loyaltyPoints: 0,
      isCODEligible: false,
      codAutoApproval: false,
    },
  });

  await prisma.shoppingCart.upsert({
    where: { userId: customer.id },
    update: {},
    create: {
      userId: customer.id,
    },
  });

  let product = await prisma.product.findFirst({
    where: { isActive: true },
    select: { id: true, productName: true, price: true },
  });

  if (!product) {
    let category = await prisma.productCategory.findFirst({
      select: { id: true },
    });

    if (!category) {
      category = await prisma.productCategory.create({
        data: {
          categoryName: `Test Category ${uniqueSuffix}`,
          businessType: 'FASHION_RETAIL',
          description: 'Kategori otomatis untuk pengujian notifikasi',
          iconUrl: null,
        },
        select: { id: true },
      });
    }

    product = await prisma.product.create({
      data: {
        categoryId: category.id,
        productName: `Test Product ${uniqueSuffix}`,
        description: 'Produk otomatis untuk pengujian notifikasi',
        price: 50000,
        stockQuantity: 10,
        productType: 'KAOS',
        businessType: 'FASHION_RETAIL',
        imageUrl: null,
        isActive: true,
      },
      select: { id: true, productName: true, price: true },
    });
  }

  const order = await prisma.order.create({
    data: {
      userId: customer.id,
      totalAmount: product.price,
      paymentMethod: 'COD',
      deliveryAddress: 'Alamat test notifikasi',
      notes: 'Order test otomatis untuk NotificationService',
      items: {
        create: [
          {
            productId: product.id,
            quantity: 1,
            unitPrice: product.price,
            subtotal: product.price,
            notes: 'Item test',
          },
        ],
      },
    },
    select: { id: true, orderNumber: true },
  });

  return order;
}

async function main() {
  const providedOrderId = process.argv[2];
  let orderId = providedOrderId || (await getFallbackOrderId());

  if (!orderId) {
    console.log('Tidak ada order di database. Membuat order test otomatis...');
    const testOrder = await createTestOrder();
    orderId = testOrder.id;
    console.log(`Order test dibuat: ${testOrder.orderNumber} (${testOrder.id})`);
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true },
  });

  if (!order) {
    console.log(`Order tidak ditemukan: ${orderId}. Membuat order test otomatis...`);
    const testOrder = await createTestOrder();
    orderId = testOrder.id;
    console.log(`Order test dibuat: ${testOrder.orderNumber} (${testOrder.id})`);
  }

  const activeOrder = order || (await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true },
  }));

  console.log(`Menggunakan order: ${activeOrder.orderNumber} (${activeOrder.id})`);

  const notif = await queueNotification({
    orderId: activeOrder.id,
    type: 'TEST',
    title: 'Test Notification',
    message: 'This is a test notification from NotificationService',
  });

  console.log('Notification queued:', notif.id);

  const res = await sendOrderNotification(notif.id);
  console.log('Send result:', res);

  await prisma.$disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});