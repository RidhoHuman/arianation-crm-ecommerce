// prisma/seed.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // ============================================================
    // CLEAR EXISTING DATA (in order of dependencies)
    // ============================================================
    console.log('🧹 Clearing existing data...');
    
    await prisma.notification.deleteMany();
    await prisma.adminActivityLog.deleteMany();
    await prisma.productPerformance.deleteMany();
    await prisma.salesAnalytics.deleteMany();
    await prisma.loyaltyRedemption.deleteMany();
    await prisma.loyaltyTransaction.deleteMany();
    await prisma.trackingHistory.deleteMany();
    await prisma.orderTracking.deleteMany();
    await prisma.designFeedback.deleteMany();
    await prisma.designRequest.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.shoppingCart.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.product.deleteMany();
    await prisma.productCategory.deleteMany();
    await prisma.customerMetrics.deleteMany();
    await prisma.designStaffInfo.deleteMany();
    await prisma.customerProfile.deleteMany();
    await prisma.user.deleteMany();

    console.log('✓ Cleared all existing data\n');

    // ============================================================
    // CREATE USERS
    // ============================================================
    console.log('👤 Creating users...');

    // Admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@arianation.com',
        password: await bcrypt.hash('admin123', 10),
        fullName: 'Admin Arianation',
        phone: '081234567890',
        role: 'ADMIN',
        isActive: true,
        emailVerified: new Date()
      }
    });
    console.log('  ✓ Created admin user: admin@arianation.com');

    // Design staff user
    const designStaffUser = await prisma.user.create({
      data: {
        email: 'designer@arianation.com',
        password: await bcrypt.hash('designer123', 10),
        fullName: 'Staff Design Arianation',
        phone: '081234567891',
        role: 'DESIGN_STAFF',
        isActive: true,
        emailVerified: new Date(),
        designStaffInfo: {
          create: {
            specialization: 'Sablon Custom Design',
            avgRating: 4.8,
            totalProjects: 50,
            isAvailable: true
          }
        }
      }
    });
    console.log('  ✓ Created design staff user: designer@arianation.com');

    // Owner user
    const ownerUser = await prisma.user.create({
      data: {
        email: 'owner@arianation.com',
        password: await bcrypt.hash('owner123', 10),
        fullName: 'Owner Arianation',
        phone: '081234567892',
        role: 'OWNER',
        isActive: true,
        emailVerified: new Date()
      }
    });
    console.log('  ✓ Created owner user: owner@arianation.com');

    // Customer users
    const customers = [];
    console.log('  Creating customer users...');
    
    for (let i = 1; i <= 10; i++) {
      const customer = await prisma.user.create({
        data: {
          email: `customer${i}@example.com`,
          password: await bcrypt.hash('password123', 10),
          fullName: `Customer ${i}`,
          phone: `0812345678${String(i).padStart(2, '0')}`,
          role: 'CUSTOMER',
          isActive: true,
          emailVerified: new Date(),
          customerProfile: {
            create: {
              address: `Jalan Merdeka ${i}`,
              city: 'Surabaya',
              postalCode: '60000',
              province: 'Jawa Timur'
            }
          }
        }
      });
      customers.push(customer);
    }
    console.log(`  ✓ Created ${customers.length} customer users\n`);

    // ============================================================
    // CREATE CUSTOMER METRICS & LOYALTY TIERS
    // ============================================================
    console.log('💎 Creating customer metrics & loyalty tiers...');

    // Bronze customer (0-20 transaksi)
    await prisma.customerMetrics.create({
      data: {
        userId: customers[0].id,
        totalTransactions: 5,
        totalSpent: 150000,
        averageOrderValue: 30000,
        currentTier: 'BRONZE',
        loyaltyPoints: 50,
        isCODEligible: false,
        codAutoApproval: false
      }
    });

    // Silver customer (21-50 transaksi)
    await prisma.customerMetrics.create({
      data: {
        userId: customers[1].id,
        totalTransactions: 35,
        totalSpent: 1500000,
        averageOrderValue: 43000,
        currentTier: 'SILVER',
        loyaltyPoints: 200,
        isCODEligible: false,
        codAutoApproval: false
      }
    });

    // Gold customer (51-99 transaksi)
    await prisma.customerMetrics.create({
      data: {
        userId: customers[2].id,
        totalTransactions: 75,
        totalSpent: 3500000,
        averageOrderValue: 47000,
        currentTier: 'GOLD',
        loyaltyPoints: 500,
        isCODEligible: true,
        codAutoApproval: false
      }
    });

    // Platinum customer (100+ transaksi)
    await prisma.customerMetrics.create({
      data: {
        userId: customers[3].id,
        totalTransactions: 125,
        totalSpent: 6500000,
        averageOrderValue: 52000,
        currentTier: 'PLATINUM',
        loyaltyPoints: 1000,
        isCODEligible: true,
        codAutoApproval: true
      }
    });

    // Create metrics for remaining customers
    for (let i = 4; i < customers.length; i++) {
      await prisma.customerMetrics.create({
        data: {
          userId: customers[i].id,
          totalTransactions: Math.floor(Math.random() * 100),
          totalSpent: Math.floor(Math.random() * 5000000),
          averageOrderValue: Math.floor(Math.random() * 50000) + 20000,
          currentTier: 'BRONZE',
          loyaltyPoints: Math.floor(Math.random() * 500),
          isCODEligible: false,
          codAutoApproval: false
        }
      });
    }
    console.log('  ✓ Created customer metrics with all tiers\n');

    // ============================================================
    // CREATE PRODUCT CATEGORIES
    // ============================================================
    console.log('📂 Creating product categories...');

    const fashionCategory = await prisma.productCategory.create({
      data: {
        categoryName: 'Fashion Retail',
        businessType: 'FASHION_RETAIL',
        description: 'Kaos dan atribut supporter sepak bola',
        iconUrl: 'https://via.placeholder.com/50?text=Fashion'
      }
    });

    const sablonCategory = await prisma.productCategory.create({
      data: {
        categoryName: 'Sablon Custom',
        businessType: 'SABLON_SERVICE',
        description: 'Jasa percetakan sablon custom berkualitas',
        iconUrl: 'https://via.placeholder.com/50?text=Sablon'
      }
    });
    console.log('  ✓ Created 2 product categories\n');

    // ============================================================
    // CREATE PRODUCTS
    // ============================================================
    console.log('🛍️  Creating products...');

    const products = [];

    // Fashion products - Kaos
    for (let i = 1; i <= 5; i++) {
      const product = await prisma.product.create({
        data: {
          categoryId: fashionCategory.id,
          productName: `Kaos Supporter ${i}`,
          description: `Kaos supporter berkualitas premium untuk klub favorit Anda`,
          price: 75000 + i * 10000,
          stockQuantity: 100 + i * 20,
          productType: 'KAOS',
          businessType: 'FASHION_RETAIL',
          imageUrl: `https://via.placeholder.com/300?text=Kaos+${i}`,
          isActive: true,
          variants: {
            create: [
              { 
                variantName: 'Size S', 
                sku: `KAOS-${i}-S`, 
                stockQuantity: 20, 
                additionalPrice: 0 
              },
              { 
                variantName: 'Size M', 
                sku: `KAOS-${i}-M`, 
                stockQuantity: 30, 
                additionalPrice: 0 
              },
              { 
                variantName: 'Size L', 
                sku: `KAOS-${i}-L`, 
                stockQuantity: 30, 
                additionalPrice: 0 
              },
              { 
                variantName: 'Size XL', 
                sku: `KAOS-${i}-XL`, 
                stockQuantity: 20, 
                additionalPrice: 5000 
              }
            ]
          }
        }
      });
      products.push(product);
    }

    // Fashion products - Atribut
    for (let i = 1; i <= 3; i++) {
      const product = await prisma.product.create({
        data: {
          categoryId: fashionCategory.id,
          productName: `Atribut Supporter ${i}`,
          description: `Atribut supporter pilihan dengan desain eksklusif`,
          price: 50000 + i * 5000,
          stockQuantity: 150,
          productType: 'ATRIBUT',
          businessType: 'FASHION_RETAIL',
          imageUrl: `https://via.placeholder.com/300?text=Atribut+${i}`,
          isActive: true,
          variants: {
            create: [
              {
                variantName: 'One Size',
                sku: `ATRIBUT-${i}-OS`,
                stockQuantity: 150,
                additionalPrice: 0
              }
            ]
          }
        }
      });
      products.push(product);
    }

    // Sablon service
    const sablonProduct = await prisma.product.create({
      data: {
        categoryId: sablonCategory.id,
        productName: 'Sablon Custom (Per Piece)',
        description: 'Layanan sablon custom sesuai desain Anda dengan kualitas terbaik',
        price: 25000,
        stockQuantity: 999,
        productType: 'SABLON_TEMPLATE',
        businessType: 'SABLON_SERVICE',
        imageUrl: 'https://via.placeholder.com/300?text=Sablon',
        isActive: true,
        variants: {
          create: [
            { 
              variantName: 'Size S', 
              sku: 'SABLON-S', 
              stockQuantity: 999, 
              additionalPrice: 0 
            },
            { 
              variantName: 'Size M', 
              sku: 'SABLON-M', 
              stockQuantity: 999, 
              additionalPrice: 0 
            },
            { 
              variantName: 'Size L', 
              sku: 'SABLON-L', 
              stockQuantity: 999, 
              additionalPrice: 0 
            },
            { 
              variantName: 'Size XL', 
              sku: 'SABLON-XL', 
              stockQuantity: 999, 
              additionalPrice: 2000 
            }
          ]
        }
      }
    });
    products.push(sablonProduct);
    console.log(`  ✓ Created ${products.length} products with variants\n`);

    // ============================================================
    // CREATE SHOPPING CARTS
    // ============================================================
    console.log('🛒 Creating shopping carts...');

    for (let i = 0; i < 3; i++) {
      const variantData = products[0].id;
      
      await prisma.shoppingCart.create({
        data: {
          userId: customers[i].id,
          items: {
            create: {
              productId: products[0].id,
              quantity: 2,
              unitPrice: products[0].price,
              subtotal: products[0].price * 2
            }
          }
        }
      });
    }
    console.log('  ✓ Created shopping carts for 3 customers\n');

    // ============================================================
    // CREATE ORDERS
    // ============================================================
    console.log('📦 Creating orders...');

    // Order 1 - QRIS Payment
    const order1 = await prisma.order.create({
      data: {
        userId: customers[0].id,
        orderNumber: `ORD-${Date.now()}-001`,
        totalAmount: 225000,
        status: 'CONFIRMED',
        paymentMethod: 'QRIS',
        deliveryAddress: 'Jalan Merdeka 1, Surabaya',
        notes: 'Tolong di-wrap dengan rapi',
        items: {
          create: [
            {
              productId: products[0].id,
              quantity: 3,
              unitPrice: products[0].price,
              subtotal: products[0].price * 3
            }
          ]
        }
      }
    });

    // Order 2 - Bank Transfer
    const order2 = await prisma.order.create({
      data: {
        userId: customers[1].id,
        orderNumber: `ORD-${Date.now()}-002`,
        totalAmount: 150000,
        status: 'PENDING',
        paymentMethod: 'BANK_TRANSFER',
        deliveryAddress: 'Jalan Merdeka 2, Surabaya',
        items: {
          create: [
            {
              productId: products[1].id,
              quantity: 2,
              unitPrice: products[1].price,
              subtotal: products[1].price * 2
            }
          ]
        }
      }
    });

    // Order 3 - QRIS with Design Request
    const order3 = await prisma.order.create({
      data: {
        userId: customers[2].id,
        orderNumber: `ORD-${Date.now()}-003`,
        totalAmount: 75000,
        status: 'CONFIRMED',
        paymentMethod: 'QRIS',
        deliveryAddress: 'Jalan Merdeka 3, Surabaya',
        items: {
          create: [
            {
              productId: sablonProduct.id,
              quantity: 3,
              unitPrice: sablonProduct.price,
              subtotal: sablonProduct.price * 3
            }
          ]
        }
      }
    });

    console.log('  ✓ Created 3 orders\n');

    // ============================================================
    // CREATE PAYMENTS
    // ============================================================
    console.log('💳 Creating payments...');

    const payment1 = await prisma.payment.create({
      data: {
        orderId: order1.id,
        amount: order1.totalAmount,
        method: 'QRIS',
        status: 'COMPLETED',
        transactionId: `TXN-${Date.now()}-001`,
        xenditId: `XENDIT-${Date.now()}-001`,
        qrisReference: 'QRIS-REF-001',
        qrisUrl: 'https://qr.xendit.co/qr/test',
        paymentDate: new Date(),
        verifiedAt: new Date(),
        verifiedBy: adminUser.id,
        notes: 'Payment verified automatically'
      }
    });

    const payment2 = await prisma.payment.create({
      data: {
        orderId: order2.id,
        amount: order2.totalAmount,
        method: 'BANK_TRANSFER',
        status: 'PENDING',
        transactionId: `TXN-${Date.now()}-002`,
        bankName: 'Bank Mandiri',
        bankAccount: '1234567890',
        accountName: 'PT Arianation'
      }
    });

    const payment3 = await prisma.payment.create({
      data: {
        orderId: order3.id,
        amount: order3.totalAmount,
        method: 'QRIS',
        status: 'COMPLETED',
        transactionId: `TXN-${Date.now()}-003`,
        xenditId: `XENDIT-${Date.now()}-003`,
        qrisReference: 'QRIS-REF-003',
        qrisUrl: 'https://qr.xendit.co/qr/test',
        paymentDate: new Date(),
        verifiedAt: new Date(),
        verifiedBy: adminUser.id
      }
    });

    console.log('  ✓ Created 3 payments\n');

    // ============================================================
    // CREATE ORDER TRACKING
    // ============================================================
    console.log('📍 Creating order tracking...');

    const tracking1 = await prisma.orderTracking.create({
      data: {
        orderId: order1.id,
        status: 'SHIPPED',
        currentLocation: 'Jakarta',
        carrier: 'JNE',
        trackingNumber: 'JNE12345678',
        estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        history: {
          create: [
            {
              status: 'PROCESSING',
              location: 'Surabaya',
              notes: 'Pesanan sedang diproses'
            },
            {
              status: 'PACKED',
              location: 'Surabaya',
              notes: 'Pesanan sudah di-pack'
            },
            {
              status: 'SHIPPED',
              location: 'Jakarta',
              notes: 'Pesanan dalam perjalanan'
            }
          ]
        }
      }
    });

    console.log('  ✓ Created order tracking\n');

    // ============================================================
    // CREATE DESIGN REQUEST
    // ============================================================
    console.log('🎨 Creating design requests...');

    const designRequest = await prisma.designRequest.create({
      data: {
        orderId: order3.id,
        userId: customers[2].id,
        designTitle: 'Sablon Kaos Supporter AC Milan',
        designDescription: 'Design sablon kaos dengan logo AC Milan di depan dan nama di belakang',
        designFileUrl: 'https://example.com/design.png',
        fileType: 'PNG',
        quantity: 50,
        productTypeForSablon: 'KAOS',
        colorPreferences: 'Merah, Hitam',
        status: 'APPROVED',
        submittedAt: new Date(),
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
        feedback: {
          create: [
            {
              designStaffId: designStaffUser.id,
              feedbackText: 'Design sudah sempurna, siap untuk production',
              feedbackType: 'APPROVED',
              createdAt: new Date()
            }
          ]
        }
      }
    });

    console.log('  ✓ Created design request\n');

    // ============================================================
    // CREATE LOYALTY TRANSACTIONS
    // ============================================================
    console.log('🎁 Creating loyalty transactions...');

    await prisma.loyaltyTransaction.create({
      data: {
        userId: customers[0].id,
        orderId: order1.id,
        transactionType: 'EARNED',
        pointsAmount: 50,
        reason: 'Pembelian order',
        balanceBefore: 0,
        balanceAfter: 50
      }
    });

    console.log('  ✓ Created loyalty transactions\n');

    // ============================================================
    // CREATE NOTIFICATIONS
    // ============================================================
    console.log('🔔 Creating notifications...');

    await prisma.notification.create({
      data: {
        userId: customers[0].id,
        notificationType: 'ORDER_CONFIRMED',
        title: 'Pesanan Dikonfirmasi',
        message: 'Pesanan Anda telah dikonfirmasi dan sedang diproses',
        relatedOrderId: order1.id
      }
    });

    await prisma.notification.create({
      data: {
        userId: customers[1].id,
        notificationType: 'PAYMENT_RECEIVED',
        title: 'Pembayaran Diterima',
        message: 'Pembayaran Anda telah diterima',
        relatedOrderId: order2.id
      }
    });

    console.log('  ✓ Created notifications\n');

    // ============================================================
    // CREATE SALES ANALYTICS
    // ============================================================
    console.log('📊 Creating sales analytics...');

    await prisma.salesAnalytics.create({
      data: {
        date: new Date(),
        totalOrders: 3,
        totalRevenue: order1.totalAmount + order2.totalAmount + order3.totalAmount,
        totalCustomers: 10,
        averageOrderValue: (order1.totalAmount + order2.totalAmount + order3.totalAmount) / 3,
        businessTypeBreakdown: JSON.stringify({
          fashion: 2,
          sablon: 1
        })
      }
    });

    console.log('  ✓ Created sales analytics\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Database seeding completed successfully!');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📋 Test Credentials:');
    console.log('─────────────────────────────────────────────────────');
    console.log('Admin:');
    console.log('  Email: admin@arianation.com');
    console.log('  Password: admin123\n');
    console.log('Designer:');
    console.log('  Email: designer@arianation.com');
    console.log('  Password: designer123\n');
    console.log('Owner:');
    console.log('  Email: owner@arianation.com');
    console.log('  Password: owner123\n');
    console.log('Customer 1:');
    console.log('  Email: customer1@example.com');
    console.log('  Password: password123\n');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });