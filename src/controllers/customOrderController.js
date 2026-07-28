const knex = require('../config/knex');
const { sendCreated, sendSuccess } = require('../utils/response');
const { MESSAGES } = require('../utils/constants');
const { Xendit } = require('xendit-node');
const paymentService = require('../services/paymentService');
const notificationService = require('../services/notificationService');
const { BadRequestError, NotFoundError } = require('../utils/errors');

const createCustomOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = req.body;
    
    const quantity = parseInt(data.quantity) || 1;
    const colors = parseInt(data.numberOfColors) || 1;
    let selectedPositions = [];
    if (data.printPosition) {
      selectedPositions = data.printPosition.split(',').map(s => s.trim()).filter(Boolean);
    }
    
    let basePrice = 0;
    let techPrice = 0;
    
    if (data.productTypeForSablon) {
      const product = await knex('product').where('id', data.productTypeForSablon).first();
      if (product) basePrice = parseFloat(product.price) || 0;
    }
    
    if (data.printTechnique) {
      const technique = await knex('print_techniques').where('name', data.printTechnique).first();
      if (technique) {
        const baseTechPrice = parseFloat(technique.basePrice) || 0;
        
        const multiplierSisi = selectedPositions.length > 0 ? selectedPositions.length : 1;
        if (technique.pricingType === 'fixed') {
          techPrice = baseTechPrice;
        } else if (technique.pricingType === 'color_based') {
          techPrice = baseTechPrice * colors * multiplierSisi;
        } else if (technique.pricingType === 'area_based') {
          const matrix = typeof technique.priceMatrix === 'string' ? JSON.parse(technique.priceMatrix) : technique.priceMatrix;
          const currentSize = data.printSize;
          if (matrix && currentSize && matrix[currentSize] !== undefined) {
             techPrice = parseFloat(matrix[currentSize]) * multiplierSisi;
          } else {
             techPrice = baseTechPrice * multiplierSisi;
          }
        }
      }
    }
    
    const estimatedUnit = basePrice + techPrice;
    const estimatedTotal = estimatedUnit * quantity;
    
    // Parse files from multipart upload
    let mockupPreviewUrl = null;
    let designFileUrl = null;
    
    if (req.files && req.files.length > 0) {
      const mockupFile = req.files.find(f => f.fieldname === 'mockupPreview');
      if (mockupFile) mockupPreviewUrl = mockupFile.url;
      
      const mainDesign = req.files.find(f => f.fieldname === 'designFile');
      if (mainDesign) designFileUrl = mainDesign.url;
    }
    
    const requestData = {
      id: require('cuid')(),
      userId,
      designTitle: data.designTitle,
      purpose: data.purpose || null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      productTypeForSablon: data.productTypeForSablon || null,
      quantity,
      sizeBreakdown: data.sizeBreakdown || null,
      colorPreferences: data.colorPreferences || null,
      printSize: data.printSize || null,
      printPosition: data.printPosition || null,
      printTechnique: data.printTechnique || null,
      numberOfColors: colors,
      picName: data.picName || null,
      whatsappNumber: data.whatsappNumber || null,
      shippingAddress: data.shippingAddress || null,
      shippingNotes: data.shippingNotes || null,
      designDescription: data.designDescription || null,
      mockupPreviewUrl,
      canvasMetadata: data.canvasMetadata || null,
      designFileUrl,
      fileType: 'CUSTOM_SABLON', // Added default fileType to satisfy DB constraints
      estimatedPrice: estimatedTotal,
      status: 'SUBMITTED',
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await knex('designRequest').insert(requestData);
    
    // Audit log
    await knex('auditLog')
      .insert({
        id: require('cuid')(),
        userId,
        action: 'CUSTOM_ORDER_CREATED',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .catch(() => {});

    // Customer Notification
    try {
      const user = await knex('user').where('id', userId).first();
      await notificationService.queueCustomerNotification({
        referenceId: requestData.id,
        referenceType: 'DESIGN_REQUEST',
        userId,
        recipientEmail: user ? user.email : null,
        type: 'SUBMITTED',
        title: 'Permintaan Custom Sablon 🎨',
        message: `Permintaan desain sablon Anda "${data.designTitle}" telah berhasil dikirim dan sedang menunggu tinjauan admin.`,
      });
    } catch (notifErr) {
      console.error('Failed to queue Sablon SUBMITTED notification:', notifErr.message);
    }

    // Admin Notification
    try {
      await knex('admin_notifications').insert({
        title: 'Pesanan Sablon Baru!',
        message: `Permintaan Custom Sablon "${data.designTitle}" menunggu untuk ditinjau.`,
        type: 'NEW_ORDER',
        isRead: false
      });
    } catch (err) {
      console.error('Failed to create Admin notification for Sablon:', err.message);
    }

    return sendCreated(res, requestData, 'Custom order submitted successfully');
  } catch (error) {
    next(error);
  }
};

const generateSablonPayment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params; 
    const { paymentMethod, usePoints, paymentType = 'DP', shippingCost, shippingCourier, deliveryAddress, deliveryType } = req.body;

    const user = await knex('user').where('id', userId).first();
    const order = await knex('order').where('id', orderId).where('userId', userId).first();

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.status !== 'CONFIRMED' && order.status !== 'PENDING') {
      throw new BadRequestError('Order must be in CONFIRMED or PENDING status to generate payment');
    }

    if (!order.totalAmount || order.totalAmount <= 0) {
      throw new BadRequestError('Order total is 0. Please wait for admin approval.');
    }

    let grandTotal = Number(order.totalAmount);
    let pointsToDeduct = 0;
    
    let exchangeRate = 10;
    let maxPercent = 50;
    try {
      const exchangeSetting = await knex('store_settings').where('settingKey', 'points_exchange_rate').first();
      const maxSetting = await knex('store_settings').where('settingKey', 'max_points_discount_percentage').first();
      if (exchangeSetting && !isNaN(Number(exchangeSetting.settingValue))) exchangeRate = Number(exchangeSetting.settingValue);
      if (maxSetting && !isNaN(Number(maxSetting.settingValue))) maxPercent = Number(maxSetting.settingValue);
    } catch(e) {
      console.log('Error fetching point settings:', e);
    }

    if (usePoints && user && user.rewardPoints > 0) {
      const maxAllowedDiscount = (grandTotal * maxPercent) / 100;
      const totalPointsValue = user.rewardPoints * exchangeRate;
      let discountFromPoints = 0;
      
      if (totalPointsValue > maxAllowedDiscount) {
        discountFromPoints = maxAllowedDiscount;
        pointsToDeduct = Math.ceil(maxAllowedDiscount / exchangeRate);
      } else if (totalPointsValue > grandTotal) {
        discountFromPoints = grandTotal;
        pointsToDeduct = Math.ceil(grandTotal / exchangeRate);
      } else {
        discountFromPoints = totalPointsValue;
        pointsToDeduct = user.rewardPoints;
      }
      
      grandTotal -= (pointsToDeduct * exchangeRate);
    }

    if (grandTotal < 0) grandTotal = 0;

    const isFull = paymentType === 'FULL';
    const amountToPay = isFull ? grandTotal : Math.floor(grandTotal / 2);
    
    // Shipping Fee (Front-loaded)
    let finalShippingCost = shippingCost ? Number(shippingCost) : 0;
    let finalAmount = amountToPay + finalShippingCost;

    // 1. STATE LOCKING - DATABASE TRANSACTION & ORDER UPDATE
    await knex.transaction(async (trx) => {
      // Deduct Points
      if (pointsToDeduct > 0) {
        await trx('user').where('id', userId).decrement('rewardPoints', pointsToDeduct);
        await trx('pointHistory').insert({
          id: require('cuid')(),
          userId,
          points: pointsToDeduct,
          type: 'SPENT',
          description: `${isFull ? 'Lunas' : 'DP'} Sablon untuk pesanan ${orderId.slice(0, 8)}`,
          createdAt: new Date(),
        });
      }

      // Update Order Details
      await trx('order').where('id', orderId).update({
        deliveryAddress: deliveryAddress ? JSON.stringify(deliveryAddress) : null,
        deliveryType: deliveryType || 'SHIPPING',
        shippingCourier: shippingCourier || null,
        shippingCost: finalShippingCost,
        paymentOption: isFull ? 'LUNAS' : 'DP_50',
        productPaymentStatus: 'PENDING',
        shippingPaymentStatus: 'PENDING',
        updatedAt: new Date()
      });
    });

    // 2. CALL XENDIT AFTER TRANSACTION
    let paymentUrl = null;
    let xenditId = null;

    try {
      const customerNameParts = user?.fullName ? user.fullName.split(' ') : [];
      const customer = {
        givenNames: customerNameParts[0] || 'Customer',
        ...(customerNameParts.length > 1 && { surname: customerNameParts.slice(1).join(' ') }),
        email: user.email,
        mobileNumber: user.phone || '081234567890'
      };

      const paymentId = require('cuid')();
      const invoiceType = isFull ? 'LUNAS' : 'DP';
      const externalIdWithSuffix = `${order.id}-${invoiceType}-${Date.now()}`;
      
      const xenditClient = new Xendit({ secretKey: process.env.XENDIT_API_KEY });
      const invoiceRequest = {
        externalId: externalIdWithSuffix, // <--- Suffix ditambahkan sesuai instruksi Sprint 2
        amount: finalAmount,
        payerEmail: customer.email,
        description: `${isFull ? 'Lunas' : 'DP'} Sablon AriaNation #${order.orderNumber}`,
        customer: customer,
        successRedirectUrl: `${process.env.FRONTEND_URL}/order-tracking/${order.id}`,
        failureRedirectUrl: `${process.env.FRONTEND_URL}/checkout-sablon/${order.id}`
      };

      const xenditResponse = await xenditClient.Invoice.createInvoice({ data: invoiceRequest });
      paymentUrl = xenditResponse.invoiceUrl;
      xenditId = xenditResponse.id;
      
      const paymentType = isFull ? 'FULL' : 'DP';
      const existingPayment = await knex('payment')
        .where({ orderId: order.id, status: 'PENDING' })
        .first();

      if (existingPayment) {
        await paymentService.update(existingPayment.id, {
          amount: finalAmount,
          method: paymentMethod || 'XENDIT',
          qrisUrl: paymentUrl,
          xenditId: xenditId,
          transactionId: order.id,
          paymentType: paymentType
        });
      } else {
        // Insert Payment Record
        await paymentService.create({
          id: paymentId,
          orderId: order.id,
          amount: finalAmount,
          paymentMethod: paymentMethod || 'XENDIT',
          status: 'PENDING',
          transactionId: order.id,
          qrisUrl: paymentUrl,
          xenditId: xenditId,
          paymentType: paymentType
        });
      }

      // Update Order Status to indicate payment is waiting
      await knex('order').where('id', orderId).update({
        status: 'PENDING', // Keep PENDING or PAID_WAITING_APPROVAL if actually paid. Waiting Xendit = PENDING.
        updatedAt: new Date()
      });

      // Queue 'Waiting for Payment' Notification
      try {
        await notificationService.queueNotification({
          orderId: order.id,
          userId: userId || null,
          recipientEmail: user ? user.email : null,
          type: 'PENDING',
          title: 'Menunggu Pembayaran Sablon ⏳',
          message: `Tagihan pembayaran untuk pesanan sablon Anda (#${order.orderNumber}) telah dibuat. Segera lakukan pembayaran.`,
        });
      } catch (notifErr) {
        console.error('Failed to queue Sablon PENDING notification:', notifErr.message);
      }

    } catch (err) {
      console.error('Xendit Invoice Error:', err.message);

      if (pointsToDeduct > 0) {
        await knex('user').where('id', userId).increment('rewardPoints', pointsToDeduct);
        await knex('pointHistory').insert({
          id: require('cuid')(),
          userId,
          points: pointsToDeduct,
          type: 'REFUNDED',
          description: `Pengembalian DP karena tagihan gagal (Pesanan ${order.id.slice(0, 8)})`,
          createdAt: new Date(),
        });
      }

      throw new BadRequestError('Gagal membuat tagihan Xendit. Poin Anda telah dikembalikan otomatis.');
    }

    return sendSuccess(res, { orderId, paymentUrl }, 'Checkout berhasil dibuat');
  } catch (error) {
    next(error);
  }
};


const createDraftCustomOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = req.body;
    
    const quantity = parseInt(data.quantity) || 1;
    const colors = parseInt(data.numberOfColors) || 1;
    let selectedPositions = [];
    if (data.printPosition) {
      selectedPositions = data.printPosition.split(',').map(s => s.trim()).filter(Boolean);
    }
    
    let basePrice = 0;
    let techPrice = 0;
    
    if (data.productTypeForSablon) {
      const product = await knex('product').where('id', data.productTypeForSablon).first();
      if (product) basePrice = parseFloat(product.price) || 0;
    }
    
    if (data.printTechnique) {
      const technique = await knex('print_techniques').where('name', data.printTechnique).first();
      if (technique) {
        const baseTechPrice = parseFloat(technique.basePrice) || 0;
        
        const multiplierSisi = selectedPositions.length > 0 ? selectedPositions.length : 1;
        if (technique.pricingType === 'fixed') {
          techPrice = baseTechPrice;
        } else if (technique.pricingType === 'color_based') {
          techPrice = baseTechPrice * colors * multiplierSisi;
        } else if (technique.pricingType === 'area_based') {
          const matrix = typeof technique.priceMatrix === 'string' ? JSON.parse(technique.priceMatrix) : technique.priceMatrix;
          const currentSize = data.printSize;
          if (matrix && currentSize && matrix[currentSize] !== undefined) {
             techPrice = parseFloat(matrix[currentSize]) * multiplierSisi;
          } else {
             techPrice = baseTechPrice * multiplierSisi;
          }
        }
      }
    }
    
    const estimatedUnit = basePrice + techPrice;
    const estimatedTotal = estimatedUnit * quantity;
    
    // Parse files from multipart upload
    let mockupPreviewUrl = null;
    let designFileUrl = null;
    
    if (req.files && req.files.length > 0) {
      const mockupFile = req.files.find(f => f.fieldname === 'mockupPreview');
      if (mockupFile) mockupPreviewUrl = mockupFile.url;
      
      const mainDesign = req.files.find(f => f.fieldname === 'designFile');
      if (mainDesign) designFileUrl = mainDesign.url;
    }
    
    const requestData = {
      id: require('cuid')(),
      userId,
      designTitle: data.designTitle,
      purpose: data.purpose || null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      productTypeForSablon: data.productTypeForSablon || null,
      quantity,
      sizeBreakdown: data.sizeBreakdown || null,
      colorPreferences: data.colorPreferences || null,
      printSize: data.printSize || null,
      printPosition: data.printPosition || null,
      printTechnique: data.printTechnique || null,
      numberOfColors: colors,
      picName: data.picName || null,
      whatsappNumber: data.whatsappNumber || null,
      shippingAddress: data.shippingAddress || null,
      shippingNotes: data.shippingNotes || null,
      designDescription: data.designDescription || null,
      mockupPreviewUrl,
      canvasMetadata: data.canvasMetadata || null,
      designFileUrl,
      fileType: 'CUSTOM_SABLON',
      estimatedPrice: estimatedTotal,
      status: 'DRAFT', // The critical difference
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await knex('designRequest').insert(requestData);
    
    return sendCreated(res, requestData, 'Item sablon ditambahkan ke keranjang (Draf)');
  } catch (error) {
    next(error);
  }
};

const getDraftCustomOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const drafts = await knex('designRequest')
      .where({ userId, status: 'DRAFT' })
      .orderBy('createdAt', 'desc');

    return sendSuccess(res, drafts, 'Draft items retrieved');
  } catch (error) {
    next(error);
  }
};

const checkoutDraftCustomOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { draftIds } = req.body;
    
    if (!draftIds || !Array.isArray(draftIds) || draftIds.length === 0) {
      throw new BadRequestError('Tidak ada item yang dipilih untuk checkout');
    }

    const drafts = await knex('designRequest')
      .whereIn('id', draftIds)
      .andWhere({ userId, status: 'DRAFT' });

    if (drafts.length !== draftIds.length) {
      throw new BadRequestError('Beberapa item keranjang tidak valid atau sudah dicheckout');
    }

    let totalAmount = 0;
    drafts.forEach(draft => {
      totalAmount += parseFloat(draft.estimatedPrice || 0);
    });

    const orderId = 'ORD-' + require('cuid')().toUpperCase().slice(0, 8);
    const downPaymentAmount = Math.ceil(totalAmount * 0.3);

    const orderNumber = `SAB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let paymentUrl = null;

    await knex.transaction(async (trx) => {
      // 1. Create the single Order
      const deliveryAddressObj = {
        fullName: drafts[0].picName || 'Customer',
        addressLine1: drafts[0].shippingAddress || 'Alamat tidak diisi',
        city: 'Alamat Sablon',
        postalCode: '00000',
        phone: drafts[0].whatsappNumber || '-',
        email: ''
      };

      await trx('order').insert({
        id: orderId,
        orderNumber,
        userId,
        status: 'PENDING',
        totalAmount,
        paymentMethod: 'XENDIT', // default required
        deliveryType: 'SHIPPING',
        deliveryAddress: JSON.stringify(deliveryAddressObj),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 2. Update all Design Requests to belong to this order & change status to SUBMITTED
      await trx('designRequest')
        .whereIn('id', draftIds)
        .update({
          orderId,
          status: 'SUBMITTED',
          submittedAt: new Date(),
          updatedAt: new Date()
        });
        
    });

    // Notifications
    try {
      const user = await knex('user').where('id', userId).first();
      await notificationService.queueCustomerNotification({
        referenceId: orderId,
        referenceType: 'ORDER',
        userId,
        recipientEmail: user ? user.email : null,
        type: 'ORDER_CREATED',
        title: 'Pengajuan Sablon Terkirim 🚀',
        message: `Pengajuan Sablon Anda (${orderId}) berhasil dikirim dengan ${drafts.length} item. Tim kami akan segera meninjau desain Anda.`,
      });
      
      await knex('admin_notifications').insert({
        title: 'Pengajuan Sablon Baru (Bulk)!',
        message: `Pesanan Custom Sablon (${orderId}) masuk dengan ${drafts.length} variasi. Menunggu Evaluasi Admin.`,
        type: 'NEW_ORDER',
        isRead: false
      });
    } catch (e) {
      console.error('Failed notifications checkout', e);
    }

    return sendSuccess(res, { orderId, paymentUrl }, 'Checkout keranjang sablon berhasil');
  } catch (error) {
    next(error);
  }
};

const createSablonPelunasanInvoice = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    
    const order = await knex('order').where('id', orderId).first();
    if (!order) throw new NotFoundError('Order not found');

    if (order.status !== 'WAITING_FINAL_PAYMENT') {
      throw new BadRequestError('Status pesanan bukan WAITING_FINAL_PAYMENT');
    }

    if (order.paymentOption !== 'DP_50') {
      throw new BadRequestError('Pesanan ini sudah lunas atau bukan DP 50%');
    }

    const user = await knex('user').where('id', order.userId).first();

    const grandTotal = Number(order.totalAmount);
    
    // The DP amount was Math.floor(grandTotal / 2)
    // The Pelunasan is Math.ceil(grandTotal / 2)
    const finalAmount = Math.ceil(grandTotal / 2);

    const paymentId = require('cuid')();
    const invoiceType = 'LUNAS';
    const externalIdWithSuffix = `${order.id}-${invoiceType}-${Date.now()}`;
    
    const customerNameParts = user?.fullName ? user.fullName.split(' ') : [];
    const customer = {
      givenNames: customerNameParts[0] || 'Customer',
      ...(customerNameParts.length > 1 && { surname: customerNameParts.slice(1).join(' ') }),
      email: user?.email || 'customer@example.com',
      mobileNumber: user?.phone || '081234567890'
    };

    const xenditClient = new Xendit({ secretKey: process.env.XENDIT_API_KEY });
    const invoiceRequest = {
      externalId: externalIdWithSuffix,
      amount: finalAmount,
      payerEmail: customer.email,
      description: `Pelunasan Sablon AriaNation #${order.orderNumber}`,
      customer: customer,
      successRedirectUrl: `${process.env.FRONTEND_URL}/order-tracking/${order.id}`,
      failureRedirectUrl: `${process.env.FRONTEND_URL}/checkout-sablon/${order.id}`
    };

    const xenditResponse = await xenditClient.Invoice.createInvoice({ data: invoiceRequest });
    const paymentUrl = xenditResponse.invoiceUrl;
    
    const existingPayment = await knex('payment')
      .where({ orderId: order.id, paymentType: 'FULL', status: 'PENDING' })
      .first();

    if (existingPayment) {
      await paymentService.update(existingPayment.id, {
        amount: finalAmount,
        method: 'XENDIT',
        qrisUrl: paymentUrl,
        xenditId: xenditResponse.id,
        transactionId: order.id
      });
    } else {
      // Save Payment locally
      await paymentService.create({
        id: paymentId,
        orderId: order.id,
        amount: finalAmount,
        paymentMethod: 'XENDIT',
        status: 'PENDING',
        transactionId: order.id,
        qrisUrl: paymentUrl,
        xenditId: xenditResponse.id,
        paymentType: 'FULL'
      });
    }

    // Queue 'Waiting for Payment' Notification
    try {
      await notificationService.queueNotification({
        orderId: order.id,
        userId: order.userId || null,
        recipientEmail: user ? user.email : null,
        type: 'WAITING_FINAL_PAYMENT',
        title: 'Tagihan Pelunasan Sablon ⏳',
        message: `Pesanan sablon Anda (#${order.orderNumber}) telah selesai diproduksi! Silakan lunasi sisa tagihan untuk pengiriman. Link bayar: ${paymentUrl}`,
      });
    } catch (notifErr) {
      console.error('Failed to queue Sablon LUNAS notification:', notifErr.message);
    }

    return sendSuccess(res, { paymentUrl }, 'Tagihan Pelunasan berhasil dibuat dan dikirim ke kustomer');
  } catch (error) {
    next(error);
  }
};

const deleteDraftCustomOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const draft = await knex('designRequest').where({ id, userId, status: 'DRAFT' }).first();
    if (!draft) {
      throw new NotFoundError('Draft tidak ditemukan atau bukan milik Anda');
    }

    await knex('designRequest').where('id', id).del();

    return sendSuccess(res, null, 'Draft berhasil dihapus');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCustomOrder,
  generateSablonPayment,
  createDraftCustomOrder,
  getDraftCustomOrders,
  checkoutDraftCustomOrders,
  deleteDraftCustomOrder,
  createSablonPelunasanInvoice
};
