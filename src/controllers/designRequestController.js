// src/controllers/designRequestController.js

const prisma = require('../config/database');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { NotFoundError, AuthorizationError } = require('../utils/errors');
const { MESSAGES } = require('../utils/constants');

const getAllDesignRequests = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const { status, userId } = req.query;

    const where = {};

    if (req.user.role === 'CUSTOMER') {
      where.userId = req.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (status) where.status = status;

    const [requests, total] = await Promise.all([
      prisma.designRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          feedback: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          order: { select: { id: true, orderNumber: true } },
        },
      }),
      prisma.designRequest.count({ where }),
    ]);

    return sendPaginated(res, requests, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }, MESSAGES.DESIGN_REQUESTS_FOUND);
  } catch (error) {
    next(error);
  }
};

const getDesignRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await prisma.designRequest.findUnique({
      where: { id },
      include: {
        feedback: { orderBy: { createdAt: 'desc' } },
        order: true,
        orderItems: true,
      },
    });

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
    } = req.body;

    // Validation
    if (!designTitle || !quantity) {
      throw new Error('designTitle and quantity are required');
    }

    // Handle file upload
    let designFileUrl = referenceImageUrl; // Default to reference image if no file uploaded
    let fileType = 'EXTERNAL_URL';

    if (req.file) {
      designFileUrl = `/uploads/${req.file.filename}`;
      const path = require('path');
      fileType = path.extname(req.file.originalname).substring(1).toUpperCase();
    } else if (!designFileUrl) {
      throw new Error('Either design file upload or reference image URL is required');
    }

    if (orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) {
        throw new NotFoundError(MESSAGES.ORDER_NOT_FOUND);
      }
    }

    const request = await prisma.designRequest.create({
      data: {
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
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      include: {
        feedback: true,
        order: {
          select: { id: true, orderNumber: true, status: true },
        },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DESIGN_REQUEST_CREATED',
        orderId: orderId || null,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
    }).catch(() => {}); // Don't fail if audit log fails

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
      deadline,
      status,
    } = req.body;

    const existing = await prisma.designRequest.findUnique({ where: { id } });
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
    if (deadline !== undefined) {
      updateData.deadline = deadline === null || deadline === '' ? null : new Date(deadline);
    }

    if (status !== undefined) {
      updateData.status = status;
      if (status === 'SUBMITTED') {
        updateData.submittedAt = new Date();
      }
    }

    const request = await prisma.designRequest.update({
      where: { id },
      data: updateData,
    });

    return sendSuccess(res, request, MESSAGES.DESIGN_REQUEST_UPDATED);
  } catch (error) {
    next(error);
  }
};

const submitDesignRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.designRequest.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError(MESSAGES.DESIGN_REQUEST_NOT_FOUND);
    }

    if (req.user.role === 'CUSTOMER' && existing.userId !== req.user.id) {
      throw new AuthorizationError(MESSAGES.FORBIDDEN);
    }

    const request = await prisma.designRequest.update({
      where: { id },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
    });

    return sendSuccess(res, request, 'Design request submitted successfully');
  } catch (error) {
    next(error);
  }
};

const addFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { feedbackText, feedbackType, revisionNotes, suggestedChangesUrl } = req.body;

    const designRequest = await prisma.designRequest.findUnique({ where: { id } });
    if (!designRequest) {
      throw new NotFoundError(MESSAGES.DESIGN_REQUEST_NOT_FOUND);
    }

    const feedback = await prisma.designFeedback.create({
      data: {
        designRequestId: id,
        designStaffId: req.user.id,
        feedbackText,
        feedbackType,
        revisionNotes: revisionNotes || null,
        suggestedChangesUrl: suggestedChangesUrl || null,
      },
    });

    let newStatus = designRequest.status;
    if (feedbackType === 'APPROVED') newStatus = 'APPROVED';
    else if (feedbackType === 'REVISION_NEEDED') newStatus = 'REVISION_REQUESTED';
    else if (feedbackType === 'REJECTED') newStatus = 'REJECTED';

    await prisma.designRequest.update({
      where: { id },
      data: { status: newStatus },
    });

    return sendCreated(res, feedback, MESSAGES.DESIGN_FEEDBACK_ADDED);
  } catch (error) {
    next(error);
  }
};

const deleteDesignRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const designRequest = await prisma.designRequest.findUnique({ where: { id } });
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

    await prisma.designRequest.delete({
      where: { id },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'DESIGN_REQUEST_DELETED',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
    }).catch(() => {});

    return sendSuccess(res, null, 'Design request deleted successfully');
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
};
