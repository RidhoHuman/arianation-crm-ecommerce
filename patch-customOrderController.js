const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src/controllers/customOrderController.js');
let content = fs.readFileSync(targetFile, 'utf8');

const newCode = `
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
      const product = await knex('product_type_master').where('id', data.productTypeForSablon).first();
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

    let paymentUrl = null;

    await knex.transaction(async (trx) => {
      // 1. Create the single Order
      await trx('order').insert({
        id: orderId,
        userId,
        status: 'PENDING',
        totalAmount,
        downPaymentAmount,
        downPaymentStatus: 'UNPAID',
        type: 'CUSTOM_SABLON',
        deliveryType: 'DELIVERY', // Default
        deliveryAddress: drafts[0].shippingAddress || '',
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
        
      // 3. (Optional) Create Xendit invoice for DP right away
      // In AriaNation, DP invoice is created here using paymentService!
      try {
        const user = await trx('user').where('id', userId).first();
        const invoiceData = {
          externalID: \`DP-\${orderId}\`,
          amount: downPaymentAmount,
          payerEmail: user ? user.email : 'guest@example.com',
          description: \`DP 30% untuk Pesanan Custom Sablon \${orderId}\`,
          successRedirectURL: \`\${process.env.FRONTEND_URL}/account?tab=orders\`,
          failureRedirectURL: \`\${process.env.FRONTEND_URL}/custom-sablon\`,
        };
        
        const invoice = await paymentService.createInvoice(invoiceData);
        if (invoice && invoice.invoice_url) {
          paymentUrl = invoice.invoice_url;
          
          await trx('payment').insert({
            id: require('cuid')(),
            orderId,
            userId,
            paymentId: invoice.id,
            paymentUrl: invoice.invoice_url,
            amount: downPaymentAmount,
            status: 'PENDING',
            type: 'DOWN_PAYMENT',
            provider: 'XENDIT',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      } catch (invoiceErr) {
        console.error('Failed to create DP Invoice during Checkout:', invoiceErr);
        throw new BadRequestError('Gagal membuat tagihan Xendit.');
      }
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
        title: 'Pesanan Sablon Berhasil Dibuat 🚀',
        message: \`Pesanan Sablon Anda (\${orderId}) berhasil dibuat dengan \${drafts.length} item. Silakan lakukan pembayaran DP agar pesanan diproses.\`,
      });
      
      await knex('admin_notifications').insert({
        title: 'Pesanan Sablon Baru (Bulk)!',
        message: \`Pesanan Custom Sablon (\${orderId}) masuk dengan \${drafts.length} variasi. Menunggu pembayaran DP.\`,
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
`;

// Replace the module.exports block
content = content.replace(
  /module\.exports = {[\s\S]*?createCustomOrder,[\s\S]*?checkoutCustomSablonDP[\s\S]*?};/,
  newCode + '\nmodule.exports = {\n  createCustomOrder,\n  checkoutCustomSablonDP,\n  createDraftCustomOrder,\n  getDraftCustomOrders,\n  checkoutDraftCustomOrders\n};'
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Appended successfully');
