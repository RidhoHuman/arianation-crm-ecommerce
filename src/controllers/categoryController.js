// src/controllers/categoryController.js
const knex = require('../config/knex');
const { sendSuccess } = require('../utils/response');
const { ValidationError, NotFoundError } = require('../utils/errors');
const cuid = require('cuid');

const getAllCategories = async (req, res, next) => {
  try {
    const { businessType } = req.query;
    let query = knex('productCategory').orderBy('createdAt', 'asc');

    if (businessType) {
      query = query.where('businessType', businessType);
    }

    const categories = await query;

    // Map to frontend expected format
    const mappedCategories = categories.map((c) => ({
      ...c,
      name: c.categoryName,
      slug: c.categoryName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, ''),
      description: c.description,
      isActive: c.isActive === 1 || c.isActive === true,
    }));

    sendSuccess(res, mappedCategories, 'Berhasil mengambil data kategori');
  } catch (error) {
    next(error);
  }
};

const getCategoryBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    // Karena slug di-generate dinamis dari categoryName, kita harus mencari semua dan mencocokkan
    // Alternatifnya, kita bisa menggunakan LIKE, tapi karena slug replace karakter, cara paling aman adalah:
    const categories = await knex('productCategory');
    const category = categories.find((c) => {
      const generatedSlug = c.categoryName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      return generatedSlug === slug;
    });

    if (!category) {
      throw new NotFoundError('Kategori tidak ditemukan');
    }

    const responseData = {
      ...category,
      name: category.categoryName,
      slug: slug,
      description: category.description,
      isActive: category.isActive === 1 || category.isActive === true,
    };

    sendSuccess(res, responseData, 'Berhasil mengambil data kategori');
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const {
      name,
      description,
      isActive,
      businessType,
      imageUrl,
      longDescription,
      purpose,
      highlights,
      useCases,
    } = req.body;

    if (!name) {
      throw new ValidationError('Nama kategori wajib diisi');
    }

    // Check if category name exists
    const existing = await knex('productCategory').where('categoryName', name).first();
    if (existing) {
      throw new ValidationError('Kategori dengan nama ini sudah ada');
    }

    const id = cuid();
    const newCategory = {
      id,
      categoryName: name,
      description: description || null,
      imageUrl: imageUrl || null,
      longDescription: longDescription || null,
      purpose: purpose || null,
      highlights: highlights ? JSON.stringify(highlights) : null,
      useCases: useCases ? JSON.stringify(useCases) : null,
      isActive:
        isActive === undefined
          ? true
          : isActive === true || isActive === 'true' || isActive === 1 || isActive === '1',
      businessType: businessType || 'FASHION_RETAIL',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await knex('productCategory').insert(newCategory);

    const responseData = {
      ...newCategory,
      name: newCategory.categoryName,
      slug: newCategory.categoryName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, ''),
      description: newCategory.description,
      isActive: newCategory.isActive,
    };

    sendSuccess(res, responseData, 'Kategori berhasil dibuat', 201);
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      isActive,
      imageUrl,
      longDescription,
      purpose,
      highlights,
      useCases,
    } = req.body;

    const existing = await knex('productCategory').where('id', id).first();
    if (!existing) {
      throw new NotFoundError('Kategori tidak ditemukan');
    }

    const updateData = { updatedAt: new Date() };

    if (name) {
      updateData.categoryName = name;

      // Check if new name exists for other category
      const duplicate = await knex('productCategory')
        .where('categoryName', name)
        .whereNot('id', id)
        .first();
      if (duplicate) {
        throw new ValidationError('Kategori dengan nama ini sudah ada');
      }
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (longDescription !== undefined) updateData.longDescription = longDescription;
    if (purpose !== undefined) updateData.purpose = purpose;
    if (highlights !== undefined)
      updateData.highlights = highlights ? JSON.stringify(highlights) : null;
    if (useCases !== undefined) updateData.useCases = useCases ? JSON.stringify(useCases) : null;

    if (isActive !== undefined) {
      updateData.isActive =
        isActive === true || isActive === 'true' || isActive === 1 || isActive === '1';
    }

    await knex('productCategory').where('id', id).update(updateData);

    const updated = await knex('productCategory').where('id', id).first();
    const responseData = {
      ...updated,
      name: updated.categoryName,
      slug: updated.categoryName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, ''),
      description: updated.description,
      isActive: updated.isActive === 1 || updated.isActive === true,
    };
    sendSuccess(res, responseData, 'Kategori berhasil diperbarui');
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await knex('productCategory').where('id', id).first();
    if (!existing) {
      throw new NotFoundError('Kategori tidak ditemukan');
    }

    // Optional: Check if products are using this category
    const productsUsingCategory = await knex('product')
      .where('categoryId', id)
      .count('* as count')
      .first();
    if (productsUsingCategory.count > 0) {
      throw new ValidationError(
        `Tidak dapat menghapus kategori karena sedang digunakan oleh ${productsUsingCategory.count} produk.`
      );
    }

    await knex('productCategory').where('id', id).del();
    sendSuccess(res, null, 'Kategori berhasil dihapus');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
