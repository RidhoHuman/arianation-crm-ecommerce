const knex = require('../config/knex');
const { sendSuccess, sendCreated } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');
const cuid = require('cuid');

const getAllCollections = async (req, res, next) => {
  try {
    const { isActive, isFeatured } = req.query;
    let query = knex('collection');
    if (isActive !== undefined) {
      query = query.where('isActive', isActive === 'true');
    }
    if (isFeatured !== undefined) {
      query = query.where('is_featured', isFeatured === 'true');
    }
    const collections = await query.orderBy('createdAt', 'desc');
    return sendSuccess(res, collections, 'Collections retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getCollectionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collection = await knex('collection').where('id', id).first();
    if (!collection) throw new NotFoundError('Collection not found');
    return sendSuccess(res, collection, 'Collection retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getCollectionBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const collection = await knex('collection').where('slug', slug).first();
    if (!collection) throw new NotFoundError('Collection not found');
    return sendSuccess(res, collection, 'Collection retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createCollection = async (req, res, next) => {
  try {
    const {
      name,
      slug,
      description,
      imageUrl,
      isActive,
      longDescription,
      purpose,
      highlights,
      useCases,
      is_featured,
    } = req.body;
    const id = cuid();
    const collection = {
      id,
      name,
      slug,
      description: description || null,
      imageUrl: imageUrl || null,
      longDescription: longDescription || null,
      purpose: purpose || null,
      highlights: highlights ? JSON.stringify(highlights) : null,
      useCases: useCases ? JSON.stringify(useCases) : null,
      isActive: isActive !== undefined ? isActive : true,
      is_featured: is_featured !== undefined ? is_featured : false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await knex('collection').insert(collection);
    return sendCreated(res, collection, 'Collection created successfully');
  } catch (error) {
    next(error);
  }
};

const updateCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      description,
      imageUrl,
      isActive,
      longDescription,
      purpose,
      highlights,
      useCases,
      is_featured,
    } = req.body;

    const existing = await knex('collection').where('id', id).first();
    if (!existing) throw new NotFoundError('Collection not found');

    const updateData = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (longDescription !== undefined) updateData.longDescription = longDescription;
    if (purpose !== undefined) updateData.purpose = purpose;
    if (highlights !== undefined)
      updateData.highlights = highlights ? JSON.stringify(highlights) : null;
    if (useCases !== undefined) updateData.useCases = useCases ? JSON.stringify(useCases) : null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (is_featured !== undefined) updateData.is_featured = is_featured;

    await knex('collection').where('id', id).update(updateData);
    const updated = await knex('collection').where('id', id).first();

    return sendSuccess(res, updated, 'Collection updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await knex('collection').where('id', id).first();
    if (!existing) throw new NotFoundError('Collection not found');

    await knex('collection').where('id', id).delete();
    // Also delete associations
    await knex('product_collection').where('collectionId', id).delete();

    return sendSuccess(res, null, 'Collection deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Managing products in collections
const getProductsInCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const products = await knex('product')
      .join('product_collection', 'product.id', 'product_collection.productId')
      .where('product_collection.collectionId', id)
      .select('product.*');
    return sendSuccess(res, products, 'Products retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const addProductToCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { productId } = req.body;

    // Check if association exists
    const existing = await knex('product_collection')
      .where({ collectionId: id, productId })
      .first();

    if (!existing) {
      await knex('product_collection').insert({ collectionId: id, productId });
    }
    return sendCreated(res, null, 'Product added to collection');
  } catch (error) {
    next(error);
  }
};

const removeProductFromCollection = async (req, res, next) => {
  try {
    const { id, productId } = req.params;
    await knex('product_collection').where({ collectionId: id, productId }).delete();
    return sendSuccess(res, null, 'Product removed from collection');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCollections,
  getCollectionById,
  getCollectionBySlug,
  createCollection,
  updateCollection,
  deleteCollection,
  getProductsInCollection,
  addProductToCollection,
  removeProductFromCollection,
};
