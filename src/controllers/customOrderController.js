const knex = require('../config/knex');
const { sendCreated, sendSuccess } = require('../utils/response');
const { MESSAGES } = require('../utils/constants');
const { Xendit } = require('xendit-node');
const paymentService = require('../services/paymentService');
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
    
    // Calculate securely using backend Source of Truth
    if (data.productTypeForSablon) {
      const product = await knex('productTypes').where('id', data.productTypeForSablon).first();
      if (product) basePrice = parseFloat(product.price) || 0;
    }
    
    if (data.printTechnique) {
      const technique = await knex('print_techniques').where('name', data.printTechnique).first();
      if (technique) {
        const baseTechPrice = parseFloat(technique.basePrice) || 0;
        
        if (technique.pricingType === 'fixed') {
          techPrice = baseTechPrice;
        } else if (technique.pricingType === 'color_based') {
          techPrice = baseTechPrice * colors;
        } else if (technique.pricingType === 'area_based') {
          const positionMultiplier = {
            'Dada Kiri (Logo)': 1.0,
            'Dada Kanan (Logo)': 1.0,
            'Dada Tengah (Medium)': 1.5,
            'Full Depan (A4/A3)': 2.0,
            'Punggung Belakang (A4/A3)': 2.0,
            'Lengan Kiri': 1.0,
            'Lengan Kanan': 1.0,
            'Tengkuk Leher (Neck label)': 1.0
          };
          
          let totalMultiplier = 0;
          selectedPositions.forEach(pos => {
            totalMultiplier += (positionMultiplier[pos] || 1.0);
          });
          
          if (totalMultiplier === 0) totalMultiplier = 1.0;
          techPrice = baseTechPrice * totalMultiplier;
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

    return sendCreated(res, requestData, 'Custom order submitted successfully');
  } catch (error) {
    next(error);
  }
};

const checkoutCustomSablonDP = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // designRequest ID
    const { paymentMethod, usePoints, paymentType = 'DP' } = req.body;

    const user = await knex('user').where('id', userId).first();
    const designRequest = await knex('designRequest').where('id', id).where('userId', userId).first();

    if (!designRequest) {
      throw new NotFoundError('Design request not found');
    }

    if (designRequest.status !== 'APPROVED') {
      throw new BadRequestError('Design request must be APPROVED to proceed with payment');
    }

    if (designRequest.orderId) {
      throw new BadRequestError('This design request has already been checked out');
    }

    if (!designRequest.estimatedPrice || designRequest.estimatedPrice <= 0) {
      throw new BadRequestError('Estimated price is not set. Please contact admin.');
    }

    let grandTotal = Number(designRequest.estimatedPrice);
    let pointsToDeduct = 0;

    if (usePoints && user && user.rewardPoints > 0) {
      const discountFromPoints = user.rewardPoints * 1000;
      if (discountFromPoints > grandTotal) {
        pointsToDeduct = Math.ceil(grandTotal / 1000);
      } else {
        pointsToDeduct = user.rewardPoints;
      }
      grandTotal -= (pointsToDeduct * 1000);
    }

    if (grandTotal < 0) grandTotal = 0;

    const isFull = paymentType === 'FULL';
    const amountToPay = isFull ? grandTotal : Math.floor(grandTotal / 2);
    let finalAmount = amountToPay;

    // 1. STATE LOCKING - DATABASE TRANSACTION
    const orderId = require('cuid')();
    await knex.transaction(async (trx) => {
      // Create Order
      await trx('order').insert({
        id: orderId,
        orderNumber: `SAB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId,
        totalAmount: finalAmount,
        paymentMethod: paymentMethod || 'XENDIT',
        status: 'UNPAID', // Initial status
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Update Design Request with Order ID
      await trx('designRequest').where('id', id).update({
        orderId,
        updatedAt: new Date(),
      });

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
    });

    const order = await knex('order').where('id', orderId).first();

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
      const xenditClient = new Xendit({ secretKey: process.env.XENDIT_API_KEY });
      const invoiceRequest = {
        externalId: paymentId,
        amount: finalAmount,
        payerEmail: customer.email,
        description: `${isFull ? 'Pelunasan' : 'DP'} Sablon AriaNation #${order.orderNumber}`,
        customer: customer,
        successRedirectUrl: `${process.env.FRONTEND_URL}/order-tracking/${order.id}`,
        failureRedirectUrl: `${process.env.FRONTEND_URL}/checkout`
      };

      const xenditResponse = await xenditClient.Invoice.createInvoice({ data: invoiceRequest });
      paymentUrl = xenditResponse.invoiceUrl;
      xenditId = xenditResponse.id;
      
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
        paymentType: isFull ? 'FULL' : 'DP'
      });

    } catch (err) {
      console.error('Xendit DP Invoice Error:', err.message);

      // MANUAL ROLLBACK
      await knex('order').where('id', orderId).update({ status: 'FAILED' });
      await knex('designRequest').where('id', id).update({ orderId: null });
      
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

module.exports = {
  createCustomOrder,
  checkoutCustomSablonDP
};
