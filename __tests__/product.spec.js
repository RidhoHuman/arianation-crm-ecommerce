const productService = require('../src/services/productService');
const knex = require('../src/config/knex');

describe('productService', () => {
  const mockCategoryId = 'cat-123';

  beforeEach(async () => {
    // Clear product and productCategory tables
    await knex('product').delete();
    await knex('productCategory').delete();

    // Create a mock category
    await knex('productCategory').insert({
      id: mockCategoryId,
      categoryName: 'T-Shirt',
      businessType: 'FASHION_RETAIL',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe('create()', () => {
    test('should create a product successfully', async () => {
      const productData = {
        categoryId: mockCategoryId,
        productName: 'Arianation Classic Tee',
        description: 'Super comfortable custom tee',
        price: 150000.0,
        stockQuantity: 50,
        productType: 'RETAIL',
        imageUrl: 'https://supabase.co/img.jpg',
        businessType: 'FASHION_RETAIL',
        isActive: true,
      };

      const createdProduct = await productService.create(productData);

      expect(createdProduct).toBeDefined();
      expect(createdProduct.id).toBeDefined();
      expect(createdProduct.productName).toBe(productData.productName);
      expect(createdProduct.price).toBe(productData.price);
      expect(createdProduct.imageUrl).toBe(productData.imageUrl);

      // Verify DB entry
      const dbProduct = await knex('product').where('id', createdProduct.id).first();
      expect(dbProduct).toBeDefined();
      expect(dbProduct.productName).toBe(productData.productName);
    });
  });

  describe('findById()', () => {
    test('should retrieve product by ID', async () => {
      const id = 'prod-111';
      await knex('product').insert({
        id,
        categoryId: mockCategoryId,
        productName: 'Find Product',
        description: 'Find desc',
        price: 120000,
        stockQuantity: 10,
        productType: 'RETAIL',
        businessType: 'FASHION_RETAIL',
        imageUrl: '',
        isActive: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const product = await productService.findById(id);
      expect(product).toBeDefined();
      expect(product.productName).toBe('Find Product');
    });

    test('should return null if product not found', async () => {
      const product = await productService.findById('non-existent-id');
      expect(product).toBeNull();
    });
  });

  describe('findMany() and count()', () => {
    beforeEach(async () => {
      await knex('product').insert([
        {
          id: 'p1',
          categoryId: mockCategoryId,
          productName: 'Polo Shirt',
          description: 'Nice Polo',
          price: 180000,
          stockQuantity: 20,
          productType: 'RETAIL',
          businessType: 'FASHION_RETAIL',
          imageUrl: '',
          isActive: 1,
          createdAt: new Date(Date.now() - 10000),
          updatedAt: new Date(),
        },
        {
          id: 'p2',
          categoryId: 'other-cat',
          productName: 'Custom Hoodie',
          description: 'Sablon hoodie',
          price: 250000,
          stockQuantity: 5,
          productType: 'CUSTOM',
          businessType: 'FASHION_RETAIL',
          imageUrl: '',
          isActive: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    });

    test('should return all products and count correctly', async () => {
      const products = await productService.findMany();
      expect(products.length).toBe(2);

      const total = await productService.count();
      expect(total).toBe(2);
    });

    test('should filter by categoryId', async () => {
      const products = await productService.findMany({ category: mockCategoryId });
      expect(products.length).toBe(1);
      expect(products[0].id).toBe('p1');

      const total = await productService.count({ category: mockCategoryId });
      expect(total).toBe(1);
    });

    test('should filter by isActive status', async () => {
      const activeProducts = await productService.findMany({ isActive: true });
      expect(activeProducts.length).toBe(1);
      expect(activeProducts[0].id).toBe('p1');

      const total = await productService.count({ isActive: false });
      expect(total).toBe(1);
    });

    test('should search by name or description', async () => {
      const searchRes = await productService.findMany({ search: 'Polo' });
      expect(searchRes.length).toBe(1);
      expect(searchRes[0].id).toBe('p1');

      const searchRes2 = await productService.findMany({ search: 'Sablon' });
      expect(searchRes2.length).toBe(1);
      expect(searchRes2[0].id).toBe('p2');
    });
  });

  describe('update() and updateStock()', () => {
    const id = 'prod-update-test';

    beforeEach(async () => {
      await knex('product').insert({
        id,
        categoryId: mockCategoryId,
        productName: 'Update Me',
        description: 'Before update',
        price: 100000,
        stockQuantity: 10,
        productType: 'RETAIL',
        businessType: 'FASHION_RETAIL',
        imageUrl: '',
        isActive: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    test('update should modify product details', async () => {
      const updated = await productService.update(id, { productName: 'Updated Product Name', price: 105000 });
      expect(updated.productName).toBe('Updated Product Name');
      expect(updated.price).toBe(105000);
    });

    test('updateStock should modify stock quantity', async () => {
      const updated = await productService.updateStock(id, 15);
      expect(updated.stockQuantity).toBe(15);
    });
  });

  describe('delete(), deactivate(), activate()', () => {
    const id = 'prod-delete-test';

    beforeEach(async () => {
      await knex('product').insert({
        id,
        categoryId: mockCategoryId,
        productName: 'Delete Me',
        description: 'Delete test',
        price: 100000,
        stockQuantity: 10,
        productType: 'RETAIL',
        businessType: 'FASHION_RETAIL',
        imageUrl: '',
        isActive: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    test('deactivate and activate should toggle status', async () => {
      await productService.deactivate(id);
      let p = await productService.findById(id);
      expect(p.isActive === 0 || p.isActive === false).toBe(true);

      await productService.activate(id);
      p = await productService.findById(id);
      expect(p.isActive === 1 || p.isActive === true).toBe(true);
    });

    test('delete should remove product from db', async () => {
      const deleted = await productService.delete(id);
      expect(deleted).toBe(true);

      const p = await productService.findById(id);
      expect(p).toBeNull();
    });
  });

  describe('findByCategory()', () => {
    test('should return active products in the category', async () => {
      await knex('product').insert([
        {
          id: 'cat-p1',
          categoryId: mockCategoryId,
          productName: 'Active Shirt',
          price: 100000,
          stockQuantity: 10,
          productType: 'RETAIL',
          businessType: 'FASHION_RETAIL',
          isActive: 1,
        },
        {
          id: 'cat-p2',
          categoryId: mockCategoryId,
          productName: 'Inactive Shirt',
          price: 100000,
          stockQuantity: 10,
          productType: 'RETAIL',
          businessType: 'FASHION_RETAIL',
          isActive: 0,
        },
      ]);

      const products = await productService.findByCategory(mockCategoryId);
      expect(products.length).toBe(1);
      expect(products[0].id).toBe('cat-p1');
    });
  });
});
