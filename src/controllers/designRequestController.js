// src/controllers/designRequestController.js

const designRequestService = require('../services/designRequestService');
const knex = require('../config/knex');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { NotFoundError, AuthorizationError } = require('../utils/errors');
const { MESSAGES } = require('../utils/constants');
const notificationService = require('../services/notificationService');

const getAllDesignRequests = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { status, userId } = req.query;

    const filters = {};
    if (req.user.role === 'CUSTOMER') {
      filters.userId = req.user.id;
    } else if (userId) {
      filters.userId = userId;
    }
    if (status) filters.status = status;

    const [requests, total] = await Promise.all([
      designRequestService.findMany({ page, limit, ...filters }),
      designRequestService.count(filters),
    ]);

    return sendPaginated(
      res,
      requests,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      MESSAGES.DESIGN_REQUESTS_FOUND
    );
  } catch (error) {
    next(error);
  }
};

const getDesignRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await designRequestService.findById(id);

    if (!request) {
      throw new NotFoundError(MESSAGES.DESIGN_REQUEST_NOT_FOUND);
    }

    if (req.user.role === 'CUSTOMER' && request.userId !== req.user.id) {
      throw new AuthorizationError(MESSAGES.FORBIDDEN);
    }

    return sendSuccess(res, request, MESSAGES.DESIGN_REQUEST_FOUND);
  } catch (error) {
    next(error);
  }
};

const createDesignRequest = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      orderId,
      designTitle,
      designDescription,
      referenceImageUrl,
      quantity,
      productTypeForSablon,
      colorPreferences,
      deadline,
      purpose,
      sizeBreakdown,
      printSize,
      printPosition,
      printTechnique,
      numberOfColors,
      picName,
      whatsappNumber,
      shippingAddress,
      shippingNotes,
      designFileUrl: bodyDesignFileUrl,
      fileType: bodyFileType
    } = req.body;

    // Validation
    if (!designTitle || !quantity) {
      throw new Error('designTitle and quantity are required');
    }

    // Handle file upload
    let designFileUrl = bodyDesignFileUrl || referenceImageUrl;
    let fileType = bodyFileType || 'EXTERNAL_URL';

    if (req.file) {
      designFileUrl = `/uploads/${req.file.filename}`;
      const path = require('path');
      fileType = path.extname(req.file.originalname).substring(1).toUpperCase();
    } else if (!designFileUrl) {
      throw new Error('Either design file upload or reference image URL is required');
    }

    // Calculate estimated price
    let estimatedPrice = null;
    try {
      if (productTypeForSablon && quantity) {
        // Fetch product base price
        const product = await knex('product').where('id', productTypeForSablon).select('price').first();
        const baseKaosPrice = product && product.price ? parseFloat(product.price) : 0;
        
        let sablonPrice = 0;
        let isPriceCalculable = false;

        if (printTechnique) {
          const techData = await knex('print_techniques').where('name', printTechnique).first();
          if (techData && techData.priceMatrix) {
            const matrix = typeof techData.priceMatrix === 'string' ? JSON.parse(techData.priceMatrix) : techData.priceMatrix;
            if (printSize && matrix[printSize] !== undefined) {
              sablonPrice = parseFloat(matrix[printSize]);
              isPriceCalculable = true;
            }
          } else if (techData && techData.pricingType === 'area_based' && techData.basePrice) {
             // Fallback for techniques without matrix but with basePrice
             sablonPrice = parseFloat(techData.basePrice);
             isPriceCalculable = true;
          }
        } else {
           // No print technique selected, maybe just base product price
           isPriceCalculable = true;
        }

        if (isPriceCalculable) {
           estimatedPrice = parseInt(quantity, 10) * (baseKaosPrice + sablonPrice);
        }
      }
    } catch (err) {
      console.error('Error calculating estimatedPrice:', err);
    }

    const requestData = {
      userId,
      orderId: orderId || null,
      designTitle,
      designDescription: designDescription || null,
      referenceImageUrl: referenceImageUrl || null,
      designFileUrl,
      fileType,
      quantity: parseInt(quantity, 10),
      productTypeForSablon: productTypeForSablon || null,
      colorPreferences: colorPreferences || null,
      deadline: deadline ? new Date(deadline) : null,
      purpose: purpose || null,
      sizeBreakdown: sizeBreakdown || null,
      printSize: printSize || null,
      printPosition: printPosition || null,
      printTechnique: printTechnique || null,
      numberOfColors: numberOfColors ? parseInt(numberOfColors, 10) : null,
      picName: picName || null,
      whatsappNumber: whatsappNumber || null,
      shippingAddress: shippingAddress || null,
      shippingNotes: shippingNotes || null,
      estimatedPrice,
      status: 'SUBMITTED',
      submittedAt: new Date(),
    };

    const request = await designRequestService.create(requestData);

    // Audit log
    await knex('auditLog')
      .insert({
        id: require('cuid')(),
        userId,
        action: 'DESIGN_REQUEST_CREATED',
        orderId: orderId || null,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .catch(() => {}); // Don't fail if audit log fails

    // Queue notification to customer
    await notificationService.queueCustomerNotification({
      referenceId: request.id,
      referenceType: 'DESIGN_REQUEST',
      userId,
      type: 'DESIGN_REQUEST_SUBMITTED',
      title: 'Design Request Diterima',
      message: `Permintaan desain "${designTitle}" telah berhasil diajukan.`
    }).catch(console.error);

    return sendCreated(res, request, MESSAGES.DESIGN_REQUEST_CREATED);
  } catch (error) {
    next(error);
  }
};

const updateDesignRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      designTitle,
      designDescription,
      referenceImageUrl,
      designFileUrl,
      fileType,
      quantity,
      productTypeForSablon,
      colorPreferences,
      printSize,
      deadline,
      status,
      rejectReason,
      estimatedPrice,
    } = req.body;

    const existing = await designRequestService.findById(id);
    if (!existing) {
      throw new NotFoundError(MESSAGES.DESIGN_REQUEST_NOT_FOUND);
    }

    if (req.user.role === 'CUSTOMER' && existing.userId !== req.user.id) {
      throw new AuthorizationError(MESSAGES.FORBIDDEN);
    }

    const updateData = {};
    if (designTitle !== undefined) updateData.designTitle = designTitle;
    if (designDescription !== undefined) updateData.designDescription = designDescription;
    if (referenceImageUrl !== undefined) updateData.referenceImageUrl = referenceImageUrl;
    if (designFileUrl !== undefined) updateData.designFileUrl = designFileUrl;
    if (fileType !== undefined) updateData.fileType = fileType;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (productTypeForSablon !== undefined) updateData.productTypeForSablon = productTypeForSablon;
    if (colorPreferences !== undefined) updateData.colorPreferences = colorPreferences;
    if (printSize !== undefined) updateData.printSize = printSize;
    if (deadline !== undefined) {
      updateData.deadline = deadline === null || deadline === '' ? null : new Date(deadline);
    }

    if (status !== undefined) {
      updateData.status = status;
      if (status === 'SUBMITTED') {
        updateData.submittedAt = new Date();
      }
    }
    if (rejectReason !== undefined) updateData.rejectReason = rejectReason;
    if (estimatedPrice !== undefined) updateData.estimatedPrice = estimatedPrice;

    const request = await designRequestService.update(id, updateData);

    if (status !== undefined && status !== existing.status) {
      let title = status === 'REJECTED' ? 'Design Request Ditolak' : 'Update Status Design Request';
      let message = `Status permintaan desain "${existing.designTitle}" telah diubah menjadi ${status}.`;
      
      if (status === 'REJECTED' && rejectReason) {
        message = `Permintaan desain "${existing.designTitle}" Anda telah ditolak. Alasan: ${rejectReason}`;
      } else if (status === 'APPROVED') {
        title = 'Desain Disetujui! 🚀';
        message = `Desain "${existing.designTitle}" telah disetujui. Klik tautan berikut untuk memilih metode pembayaran (DP/Lunas) dan menyelesaikan pesanan: ${process.env.FRONTEND_URL}/checkout-sablon/${id}`;
      }

      // Status changed, notify customer
      await notificationService.queueCustomerNotification({
        referenceId: id,
        referenceType: 'DESIGN_REQUEST',
        userId: existing.userId,
        type: `DESIGN_REQUEST_${status}`,
        title: title,
        message: message
      }).catch(console.error);

      // [NEW LOGIC] Sync with Parent Order if exists
      if (existing.orderId) {
        const knex = require('../config/knex');
        // Get all design requests for this order
        const siblings = await knex('designRequest').where('orderId', existing.orderId);
        
        // Check if all are processed (none are SUBMITTED, DRAFT, or REVISION_REQUESTED)
        const allProcessed = siblings.every(req => 
          ['APPROVED', 'REJECTED', 'CANCELLED'].includes(req.status)
        );

        if (allProcessed) {
          // Calculate new total amount for the order based ONLY on APPROVED designs
          const newTotalAmount = siblings
            .filter(req => req.status === 'APPROVED')
            .reduce((sum, req) => {
              const estPrice = parseFloat(req.estimatedPrice) || 0;
              return sum + estPrice;
            }, 0);

          // Update the parent order
          await knex('order')
            .where('id', existing.orderId)
            .update({
              totalAmount: newTotalAmount,
              status: 'CONFIRMED', // CONFIRMED means Admin has approved the designs and set the final price
              updatedAt: new Date()
            });

          // Optional: Send another notification that the Order is ready for payment
          await notificationService.queueCustomerNotification({
            referenceId: existing.orderId,
            referenceType: 'ORDER',
            userId: existing.userId,
            type: 'ORDER_READY_FOR_PAYMENT',
            title: 'Pesanan Siap Dibayar',
            message: `Semua desain dalam pesanan ${existing.orderId} telah selesai direview. Silakan pilih metode pembayaran untuk melanjutkan.`
          }).catch(console.error);
        }
      }
    } // Missing brace for if (status !== undefined && status !== existing.status)

    return sendSuccess(res, request, MESSAGES.DESIGN_REQUEST_UPDATED);
  } catch (error) {
    next(error);
  }
};

const submitDesignRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await designRequestService.findById(id);
    if (!existing) {
      throw new NotFoundError(MESSAGES.DESIGN_REQUEST_NOT_FOUND);
    }

    if (req.user.role === 'CUSTOMER' && existing.userId !== req.user.id) {
      throw new AuthorizationError(MESSAGES.FORBIDDEN);
    }

    const request = await designRequestService.update(id, { status: 'SUBMITTED', submittedAt: new Date() });

    await notificationService.queueCustomerNotification({
      referenceId: id,
      referenceType: 'DESIGN_REQUEST',
      userId: existing.userId,
      type: 'DESIGN_REQUEST_SUBMITTED',
      title: 'Design Request Diterima',
      message: `Permintaan desain "${existing.designTitle}" telah berhasil diajukan.`
    }).catch(console.error);

    return sendSuccess(res, request, 'Design request submitted successfully');
  } catch (error) {
    next(error);
  }
};

const addFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { feedbackText, feedbackType, revisionNotes, suggestedChangesUrl } = req.body;

    const designRequest = await designRequestService.findById(id);
    if (!designRequest) {
      throw new NotFoundError(MESSAGES.DESIGN_REQUEST_NOT_FOUND);
    }

    const feedbackId = require('cuid')();
    await knex('designFeedback').insert({
      id: feedbackId,
      designRequestId: id,
      designStaffId: req.user.id,
      feedbackText,
      feedbackType,
      revisionNotes: revisionNotes || null,
      suggestedChangesUrl: suggestedChangesUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    let newStatus = designRequest.status;
    if (feedbackType === 'APPROVED') newStatus = 'APPROVED';
    else if (feedbackType === 'REVISION_NEEDED') newStatus = 'REVISION_REQUESTED';
    else if (feedbackType === 'REJECTED') newStatus = 'REJECTED';

    await designRequestService.update(id, { status: newStatus });

    const feedback = await knex('designFeedback').where('id', feedbackId).first();

    // Notify customer about feedback
    await notificationService.queueCustomerNotification({
      referenceId: id,
      referenceType: 'DESIGN_REQUEST',
      userId: designRequest.userId,
      type: `DESIGN_REQUEST_FEEDBACK_${feedbackType}`,
      title: 'Feedback Design Request',
      message: `Admin telah memberikan feedback untuk desain "${designRequest.designTitle}": ${feedbackType}.`
    }).catch(console.error);

    return sendCreated(res, feedback, MESSAGES.DESIGN_FEEDBACK_ADDED);
  } catch (error) {
    next(error);
  }
};

const deleteDesignRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const designRequest = await designRequestService.findById(id);
    if (!designRequest) {
      throw new NotFoundError(MESSAGES.DESIGN_REQUEST_NOT_FOUND);
    }

    if (req.user.role === 'CUSTOMER' && designRequest.userId !== req.user.id) {
      throw new AuthorizationError(MESSAGES.FORBIDDEN);
    }

    // Only allow deletion if status is DRAFT or REJECTED
    if (!['DRAFT', 'REJECTED'].includes(designRequest.status)) {
      throw new Error(`Cannot delete design request with status ${designRequest.status}`);
    }

    await designRequestService.delete(id);

    // Audit log
    await knex('auditLog')
      .insert({
        id: require('cuid')(),
        userId: req.user.id,
        action: 'DESIGN_REQUEST_DELETED',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .catch(() => {});

    return sendSuccess(res, null, 'Design request deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Upload design file
 * POST /api/design-requests/upload-file
 * Requires: design file in 'designFile' field
 * Returns: filename and URL
 */
const uploadDesignFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        statusCode: 400,
      });
    }

    const { getFileUrl } = require('../middleware/upload');
    const fileUrl = getFileUrl(req.file.filename, 'designs');

    return sendSuccess(
      res,
      {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: fileUrl,
      },
      'Design file uploaded successfully'
    );
  } catch (error) {
    next(error);
  }
};

const uploadDesignFileAndUpdate = async (req, res, next) => {
  try {
    const { id: designRequestId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        statusCode: 400,
      });
    }

    // Verify design request exists
    const knex = require('../config/knex');
    const designRequest = await knex('designRequest')
      .where('id', designRequestId)
      .select('*')
      .first();

    if (!designRequest) {
      // Delete uploaded file if request not found
      const { deleteFile } = require('../middleware/upload');
      deleteFile(req.file.filename, 'designs');
      throw new NotFoundError(MESSAGES.DESIGN_REQUEST_NOT_FOUND);
    }

    // Check authorization
    if (req.user.role === 'CUSTOMER' && designRequest.userId !== req.user.id) {
      const { deleteFile } = require('../middleware/upload');
      deleteFile(req.file.filename, 'designs');
      throw new AuthorizationError(MESSAGES.FORBIDDEN);
    }

    const { getFileUrl } = require('../middleware/upload');
    const fileUrl = getFileUrl(req.file.filename, 'designs');

    // Delete old physical file if it exists and is an uploaded file
    if (designRequest.designFileUrl && designRequest.designFileUrl.startsWith('/uploads/')) {
      const fs = require('fs');
      const path = require('path');
      const oldFilename = path.basename(designRequest.designFileUrl);
      const oldFilePath = path.join(__dirname, '../../uploads/designs', oldFilename);
      
      try {
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log(`[Design Request] Old file deleted: ${oldFilePath}`);
        }
      } catch (err) {
        console.error(`[Design Request] Error deleting old file:`, err);
      }
    }

    // Update design request with file URL and reset status
    const updatedDesignRequest = await knex('designRequest')
      .where('id', designRequestId)
      .update({
        designFileUrl: fileUrl, // Update to the correct column name: designFileUrl
        status: 'SUBMITTED', // Reset status so admin reviews it again
        submittedAt: new Date(),
        updatedAt: new Date(),
      });

    // Notify Admin about the re-upload (Optional but good UX)
    try {
      const notificationService = require('../services/notificationService');
      await notificationService.queueNotification({
        referenceId: designRequestId,
        referenceType: 'DESIGN_REQUEST',
        userId: null, // Admin
        type: 'DESIGN_REQUEST_REUPLOADED',
        title: 'File Revisi Diunggah',
        message: `Kustomer telah mengunggah file revisi untuk permintaan desain "${designRequest.designTitle}".`
      });
    } catch(e) {
      console.error('Failed to notify admin on re-upload', e);
    }

    // Fetch updated record
    const updated = await knex('designRequest')
      .where('id', designRequestId)
      .select('*')
      .first();

    return sendSuccess(res, updated, 'Design file uploaded successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDesignRequests,
  getDesignRequestById,
  createDesignRequest,
  updateDesignRequest,
  submitDesignRequest,
  addFeedback,
  deleteDesignRequest,
  uploadDesignFile,
  uploadDesignFileAndUpdate,
};
