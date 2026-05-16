const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { email: 'test@test.com' } });
    if (!user) {
      console.log('User not found');
      return;
    }
    await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } });
    console.log('User promoted to ADMIN');

    let category = await prisma.productCategory.findFirst({ where: { categoryName: 'Default' } });
    if (!category) {
      category = await prisma.productCategory.create({ data: { categoryName: 'Default', businessType: 'FASHION_RETAIL' } });
      console.log('Category created', category.id);
    }

    const product = await prisma.product.create({
      data: {
        categoryId: category.id,
        productName: 'Dev T-Shirt',
        description: 'A test T-shirt for development',
        price: 120000,
        stockQuantity: 100,
        productType: 'KAOS',
        imageUrl: '/products/dev-tshirt.jpg',
        businessType: 'FASHION_RETAIL',
      }
    });
    console.log('Product created', product.id);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();