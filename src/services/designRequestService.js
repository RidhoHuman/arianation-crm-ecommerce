// src/services/designRequestService.js
const knex = require('../config/knex');

const designRequestService = {
  // Ambil semua design request dengan filter dan pagination
  async findMany({ page = 1, limit = 10, userId, status } = {}) {
    const skip = (page - 1) * limit;
    let query = knex('designRequest')
      .leftJoin('user', 'designRequest.userId', 'user.id');

    if (userId) {
      query = query.where('designRequest.userId', userId);
    }

    if (status) {
      query = query.where('designRequest.status', status);
    }

    const requests = await query
      .select(
        'designRequest.id',
        'designRequest.userId',
        'designRequest.orderId',
        'designRequest.designTitle',
        'designRequest.designDescription',
        'designRequest.status',
        'designRequest.designFileUrl',
        'designRequest.fileType',
        'designRequest.quantity',
        'designRequest.productTypeForSablon',
        'designRequest.createdAt',
        'designRequest.updatedAt',
        'user.fullName as customerName',
        'user.email as customerEmail'
      )
      .orderBy('designRequest.createdAt', 'desc')
      .limit(limit)
      .offset(skip);

    return requests;
  },

  // Hitung total design request
  async count({ userId, status } = {}) {
    let query = knex('designRequest');

    if (userId) {
      query = query.where('userId', userId);
    }

    if (status) {
      query = query.where('status', status);
    }

    const result = await query.count('* as count').first();
    return result.count;
  },

  // Cari design request berdasarkan ID
  async findById(id) {
    const request = await knex('designRequest')
      .where('id', id)
      .first();

    return request || null;
  },

  // Buat design request baru
  async create(data) {
    const id = require('cuid')();

    const designRequest = {
      id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await knex('designRequest').insert(designRequest);

    return designRequest;
  },

  // Update design request
  async update(id, data) {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    await knex('designRequest')
      .where('id', id)
      .update(updateData);

    return this.findById(id);
  },

  // Update status design request
  async updateStatus(id, status) {
    await knex('designRequest')
      .where('id', id)
      .update({
        status,
        updatedAt: new Date(),
      });

    return this.findById(id);
  },

  // Update design file
  async updateDesignFile(id, designFileUrl) {
    await knex('designRequest')
      .where('id', id)
      .update({
        designFileUrl,
        updatedAt: new Date(),
      });

    return this.findById(id);
  },

  // Hapus design request
  async delete(id) {
    await knex('designRequest')
      .where('id', id)
      .delete();

    return true;
  },

  // Ambil design request untuk user tertentu
  async findUserDesignRequests(userId) {
    const requests = await knex('designRequest')
      .where('userId', userId)
      .select(
        'id',
        'designTitle',
        'designDescription',
        'status',
        'createdAt'
      )
      .orderBy('createdAt', 'desc');

    return requests;
  },
};

module.exports = designRequestService;
