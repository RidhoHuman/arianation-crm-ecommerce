// src/controllers/designRequestController.js

const designRequestService = require('../services/designRequestService');
const knex = require('../config/knex');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { NotFoundError, AuthorizationError } = require('../utils/errors');
const { MESSAGES } = require('../utils/constants');

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
    if (deadline !== undefined) {
      updateData.deadline = deadline === null || deadline === '' ? null : new Date(deadline);
    }

    if (status !== undefined) {
      updateData.status = status;
      if (status === 'SUBMITTED') {
        updateData.submittedAt = new Date();
      }
    }

    const request = await designRequestService.update(id, updateData);

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

/**
 * Upload design file and update design request
 * POST /api/design-requests/:id/upload-file
 * Requires: designRequestId and design file
 * Returns: updated design request with file
 */
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

    // Update design request with file URL
    const updatedDesignRequest = await knex('designRequest')
      .where('id', designRequestId)
      .update({
        designFile: fileUrl,
        updatedAt: new Date(),
      });

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
