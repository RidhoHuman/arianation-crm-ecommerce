const knex = require('../config/knex');
const { sendSuccess, sendError } = require('../utils/response');
const cuid = require('cuid');
const slugify = require('slugify');

const getProductTypes = async (req, res, next) => {
  try {
    const { isActive } = req.query;
    let query = knex('product_type_master').orderBy('createdAt', 'asc');

    if (isActive !== undefined) {
      query = query.where('isActive', isActive === 'true' ? 1 : 0);
    }

    const types = await query;
    return sendSuccess(res, types, 'Product types retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getProductTypeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const type = await knex('product_type_master').where({ id }).first();

    if (!type) {
      return sendError(res, 404, 'Product type not found');
    }

    return sendSuccess(res, type, 'Product type retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createProductType = async (req, res, next) => {
  try {
    const { typeName, isActive } = req.body;

    if (!typeName) {
      return sendError(res, 400, 'Type name is required');
    }

    const slug = slugify(typeName, { lower: true, strict: true });

    // Check if slug exists
    const existingType = await knex('product_type_master').where({ slug }).first();
    if (existingType) {
      return sendError(res, 400, 'Product type with this name already exists');
    }

    const id = cuid();
    const newType = {
      id,
      typeName,
      slug,
      imageUrl: req.body.imageUrl || null,
      isActive: isActive !== undefined ? isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await knex('product_type_master').insert(newType);

    return sendSuccess(res, newType, 'Product type created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateProductType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { typeName, isActive } = req.body;

    const existingType = await knex('product_type_master').where({ id }).first();
    if (!existingType) {
      return sendError(res, 404, 'Product type not found');
    }

    const updateData = { updatedAt: new Date() };

    if (typeName) {
      updateData.typeName = typeName;
      updateData.slug = slugify(typeName, { lower: true, strict: true });

      // Check if new slug conflicts with another type
      const conflict = await knex('product_type_master')
        .where({ slug: updateData.slug })
        .whereNot({ id })
        .first();

      if (conflict) {
        return sendError(res, 400, 'Product type with this name already exists');
      }
    }

    if (isActive !== undefined) updateData.isActive = isActive;
    if (req.body.imageUrl !== undefined) updateData.imageUrl = req.body.imageUrl;

    await knex('product_type_master').where({ id }).update(updateData);

    const updatedType = await knex('product_type_master').where({ id }).first();
    return sendSuccess(res, updatedType, 'Product type updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteProductType = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingType = await knex('product_type_master').where({ id }).first();
    if (!existingType) {
      return sendError(res, 404, 'Product type not found');
    }

    // Optional: Check if products are using this type before deleting
    // For now we just delete it
    await knex('product_type_master').where({ id }).del();

    return sendSuccess(res, null, 'Product type deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProductTypes,
  getProductTypeById,
  createProductType,
  updateProductType,
  deleteProductType,
};
