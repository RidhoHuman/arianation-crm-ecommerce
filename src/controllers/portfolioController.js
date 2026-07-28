const knex = require('../config/knex');

const getAllPortfolio = async (req, res) => {
  try {
    const { category, page = 1, limit = 10, all = 'false' } = req.query;

    let query = knex('sablon_portfolio').orderBy('sortOrder', 'asc').orderBy('id', 'desc');

    if (all !== 'true') {
      query = query.where('isActive', true);
    }

    if (category) {
      query = query.where('category', category);
    }

    // if pagination is requested
    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);
    const offset = (parsedPage - 1) * parsedLimit;

    // get total count
    const countQuery = knex('sablon_portfolio').count('id as count');
    if (all !== 'true') countQuery.where('isActive', true);
    if (category) countQuery.where('category', category);

    const [totalObj, data] = await Promise.all([
      countQuery.first(),
      query.limit(parsedLimit).offset(offset),
    ]);

    res.json({
      success: true,
      data,
      pagination: {
        total: totalObj.count,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(totalObj.count / parsedLimit),
      },
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan internal peladen' });
  }
};

const createPortfolio = async (req, res) => {
  try {
    const { title, category, isActive, sortOrder } = req.body;
    let imageUrl = req.body.imageUrl || '';

    if (req.file) {
      imageUrl = req.file.url || `/uploads/products/${req.file.filename}`;
    }

    if (!title || !category || !imageUrl) {
      return res
        .status(400)
        .json({ success: false, message: 'Title, category, dan image wajib diisi' });
    }

    const [id] = await knex('sablon_portfolio').insert({
      title,
      category,
      imageUrl,
      isActive: isActive !== undefined ? isActive === 'true' || isActive === true : true,
      sortOrder: sortOrder ? parseInt(sortOrder, 10) : 0,
    });

    res.status(201).json({
      success: true,
      message: 'Portofolio berhasil ditambahkan',
      data: { id, title, category, imageUrl },
    });
  } catch (error) {
    console.error('Error creating portfolio:', error);
    res.status(500).json({ success: false, message: 'Gagal menambah portofolio' });
  }
};

const updatePortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, isActive, sortOrder } = req.body;

    const updateData = {
      updated_at: knex.fn.now(),
    };

    if (title) updateData.title = title;
    if (category) updateData.category = category;
    if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder, 10);

    if (req.file) {
      updateData.imageUrl = req.file.url || `/uploads/products/${req.file.filename}`;
    } else if (req.body.imageUrl) {
      updateData.imageUrl = req.body.imageUrl;
    }

    const updated = await knex('sablon_portfolio').where({ id }).update(updateData);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Portofolio tidak ditemukan' });
    }

    res.json({
      success: true,
      message: 'Portofolio berhasil diperbarui',
    });
  } catch (error) {
    console.error('Error updating portfolio:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui portofolio' });
  }
};

const deletePortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await knex('sablon_portfolio').where({ id }).del();

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Portofolio tidak ditemukan' });
    }

    res.json({
      success: true,
      message: 'Portofolio berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus portofolio' });
  }
};

module.exports = {
  getAllPortfolio,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
};
