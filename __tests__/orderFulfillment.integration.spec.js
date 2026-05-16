const prisma = require('../src/config/database');
const orderFulfillmentService = require('../src/services/orderFulfillmentService');

jest.setTimeout(20000);

describe('orderFulfillmentService - integration', () => {
  let user;
  let category;
  let product;
  let order;

  beforeAll(async () => {
    // create minimal data
    user = await prisma.user.create({ data: { email: 'test+order@example.com', password: 'x', fullName: 'Test Order' } });
    category = await prisma.productCategory.create({ data: { categoryName: 'Test Cat', businessType: 'FASHION_RETAIL' } });
    product = await prisma.product.create({ data: { categoryId: category.id, productName: 'Test Product', price: 50, stockQuantity: 10, productType: 'KAOS', businessType: 'FASHION_RETAIL' } });

    order = await prisma.order.create({
      data: {
        userId: user.id,
        totalAmount: 50,
        paymentMethod: 'BANK_TRANSFER',
        items: {
          create: [{ productId: product.id, quantity: 1, unitPrice: 50, subtotal: 50 }],
        },
        payment: {
          create: {
            amount: 50,
            method: 'BANK_TRANSFER',
            status: 'COMPLETED',
            transactionId: `tx-${Date.now()}`,
          },
        },
      },
    });
  });

  afterAll(async () => {
    // cleanup
    try {
      await prisma.order.deleteMany({ where: { userId: user.id } });
      await prisma.product.deleteMany({ where: { categoryId: category.id } });
      await prisma.productCategory.delete({ where: { id: category.id } });
      await prisma.user.delete({ where: { id: user.id } });
    } catch (err) {
      // ignore
    }
    await prisma.$disconnect();
  });

  test('PENDING -> CONFIRMED creates status history and notification', async () => {
    // verify initial
    const before = await prisma.order.findUnique({ where: { id: order.id } });
    expect(before.status).toBe('PENDING');

    const updated = await orderFulfillmentService.updateOrderStatus(order.id, 'CONFIRMED', user.id, 'Test confirm', 'Notes');
    expect(updated.status).toBe('CONFIRMED');

    const histories = await prisma.orderStatusHistory.findMany({ where: { orderId: order.id } });
    expect(histories.length).toBeGreaterThanOrEqual(1);

    const notifications = await prisma.orderNotification.findMany({ where: { orderId: order.id } });
    expect(notifications.some(n => n.type === 'CONFIRMED')).toBe(true);
  });
});
