const knex = require('../src/config/knex');
const orderFulfillmentService = require('../src/services/orderFulfillmentService');
const cuid = require('cuid');

jest.setTimeout(20000);

describe('orderFulfillmentService - integration', () => {
  let user;
  let category;
  let product;
  let order;
  const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const testEmail = `test+order-${runId}@example.com`;
  const testCategoryName = `Test Cat ${runId}`;

  beforeAll(async () => {
    // create minimal data
    const userId = cuid();
    user = {
      id: userId,
      email: testEmail,
      password: 'x',
      fullName: 'Test Order',
    };
    await knex('user').insert({
      id: user.id,
      email: user.email,
      password: user.password,
      fullName: user.fullName,
      role: 'CUSTOMER',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const categoryId = cuid();
    category = {
      id: categoryId,
      categoryName: testCategoryName,
      businessType: 'FASHION_RETAIL',
    };
    await knex('productCategory').insert({
      id: category.id,
      categoryName: category.categoryName,
      businessType: category.businessType,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const productId = cuid();
    product = {
      id: productId,
      categoryId: category.id,
      productName: 'Test Product',
      price: 50,
      stockQuantity: 10,
      productType: 'KAOS',
      businessType: 'FASHION_RETAIL',
    };
    await knex('product').insert({
      id: product.id,
      categoryId: product.categoryId,
      productName: product.productName,
      price: product.price,
      stockQuantity: product.stockQuantity,
      productType: product.productType,
      businessType: product.businessType,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const orderId = cuid();
    order = {
      id: orderId,
      orderNumber: `ORDER-${Date.now()}`,
      userId: user.id,
      totalAmount: 50,
      paymentMethod: 'BANK_TRANSFER',
      status: 'PENDING',
    };
    await knex('order').insert({
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      status: order.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Insert order item
    await knex('orderItem').insert({
      id: cuid(),
      orderId: order.id,
      productId: product.id,
      quantity: 1,
      unitPrice: 50,
      subtotal: 50,
      createdAt: new Date(),
    });

    // Insert payment
    await knex('payment').insert({
      id: cuid(),
      orderId: order.id,
      amount: 50,
      method: 'BANK_TRANSFER',
      status: 'COMPLETED',
      transactionId: `tx-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  afterAll(async () => {
    // cleanup
    try {
      if (user?.id) {
        await knex('orderItem').where('orderId', order.id).del();
        await knex('payment').where('orderId', order.id).del();
        await knex('orderStatusHistory').where('orderId', order.id).del();
        await knex('orderNotification').where('orderId', order.id).del();
        await knex('order').where('userId', user.id).del();
        await knex('product').where('categoryId', category.id).del();
        await knex('productCategory').where('id', category.id).del();
        await knex('user').where('id', user.id).del();
      }
    } catch (err) {
      // ignore
    }
  });

  test('PENDING -> CONFIRMED creates status history and notification', async () => {
    // verify initial
    const before = await knex('order').select('status').where('id', order.id).first();
    expect(before.status).toBe('PENDING');

    const updated = await orderFulfillmentService.updateOrderStatus(
      order.id,
      'CONFIRMED',
      user.id,
      'Test confirm',
      'Notes'
    );
    expect(updated.status).toBe('CONFIRMED');

    const histories = await knex('orderStatusHistory').select('id').where('orderId', order.id);
    expect(histories.length).toBeGreaterThanOrEqual(1);

    const notifications = await knex('customerNotification')
      .select('type')
      .where('referenceId', order.id);
    expect(notifications.some((n) => n.type === 'CONFIRMED')).toBe(true);
  });
});
