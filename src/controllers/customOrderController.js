const knex = require('../config/knex');
const { sendCreated } = require('../utils/response');
const { MESSAGES } = require('../utils/constants');

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

module.exports = {
  createCustomOrder
};
