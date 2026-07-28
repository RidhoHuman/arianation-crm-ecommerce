const knex = require('../config/knex');
const crypto = require('crypto');

const printTechniqueController = {
  // Public Endpoint: Get all active print techniques
  getAllActive: async (req, res) => {
    try {
      const techniques = await knex('print_techniques')
        .where('isActive', true)
        .orderBy('name', 'asc');
      
      // parse JSON allowedCategories and priceMatrix
      const formatted = techniques.map(t => ({
        ...t,
        allowedCategories: typeof t.allowedCategories === 'string' ? JSON.parse(t.allowedCategories) : (t.allowedCategories || []),
        priceMatrix: typeof t.priceMatrix === 'string' ? JSON.parse(t.priceMatrix) : (t.priceMatrix || {})
      }));

      res.status(200).json(formatted);
    } catch (error) {
      console.error('Error fetching print techniques:', error);
      res.status(500).json({ message: 'Gagal mengambil data teknik sablon' });
    }
  },

  // Admin Endpoint: Get all techniques
  getAllAdmin: async (req, res) => {
    try {
      const techniques = await knex('print_techniques').orderBy('createdAt', 'desc');
      
      const formatted = techniques.map(t => ({
        ...t,
        allowedCategories: typeof t.allowedCategories === 'string' ? JSON.parse(t.allowedCategories) : (t.allowedCategories || []),
        priceMatrix: typeof t.priceMatrix === 'string' ? JSON.parse(t.priceMatrix) : (t.priceMatrix || {})
      }));

      res.status(200).json(formatted);
    } catch (error) {
      console.error('Error fetching print techniques for admin:', error);
      res.status(500).json({ message: 'Gagal mengambil data teknik sablon' });
    }
  },

  // Admin Endpoint: Create new technique
  create: async (req, res) => {
    try {
      const { 
        name, description, allowedCategories, 
        minOrder, pricingType, basePrice, priceMatrix,
        maxColors, imageUrl, isActive 
      } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Nama teknik sablon wajib diisi' });
      }

      const id = 'tech_' + crypto.randomUUID().replace(/-/g, '').substring(0, 10);

      const newTechnique = {
        id,
        name,
        description: description || null,
        allowedCategories: allowedCategories ? JSON.stringify(allowedCategories) : '[]',
        minOrder: minOrder || 1,
        pricingType: pricingType || 'fixed',
        basePrice: basePrice || 0,
        priceMatrix: priceMatrix ? JSON.stringify(priceMatrix) : null,
        maxColors: maxColors || null,
        imageUrl: imageUrl || null,
        isActive: isActive !== undefined ? isActive : true
      };

      await knex('print_techniques').insert(newTechnique);

      res.status(201).json({ 
        message: 'Teknik sablon berhasil ditambahkan', 
        technique: { ...newTechnique, allowedCategories: allowedCategories || [] } 
      });
    } catch (error) {
      console.error('Error creating print technique:', error);
      res.status(500).json({ message: 'Gagal menambahkan teknik sablon' });
    }
  },

  // Admin Endpoint: Update technique
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        name, description, allowedCategories, 
        minOrder, pricingType, basePrice, priceMatrix,
        maxColors, imageUrl, isActive 
      } = req.body;

      const existing = await knex('print_techniques').where({ id }).first();
      if (!existing) {
        return res.status(404).json({ message: 'Teknik sablon tidak ditemukan' });
      }

      const updatedData = {
        name,
        description,
        allowedCategories: allowedCategories ? JSON.stringify(allowedCategories) : '[]',
        minOrder: minOrder || 1,
        pricingType: pricingType || 'fixed',
        basePrice: basePrice || 0,
        priceMatrix: priceMatrix ? JSON.stringify(priceMatrix) : null,
        maxColors: maxColors || null,
        imageUrl,
        isActive,
        updatedAt: knex.fn.now()
      };

      await knex('print_techniques').where({ id }).update(updatedData);

      res.status(200).json({ message: 'Teknik sablon berhasil diperbarui' });
    } catch (error) {
      console.error('Error updating print technique:', error);
      res.status(500).json({ message: 'Gagal memperbarui teknik sablon' });
    }
  },

  // Admin Endpoint: Delete technique
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      
      const existing = await knex('print_techniques').where({ id }).first();
      if (!existing) {
        return res.status(404).json({ message: 'Teknik sablon tidak ditemukan' });
      }

      await knex('print_techniques').where({ id }).del();
      
      res.status(200).json({ message: 'Teknik sablon berhasil dihapus' });
    } catch (error) {
      console.error('Error deleting print technique:', error);
      res.status(500).json({ message: 'Gagal menghapus teknik sablon' });
    }
  }
};

module.exports = printTechniqueController;
