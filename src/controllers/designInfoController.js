const knex = require('../config/knex');

exports.getPortfolio = async (req, res) => {
  try {
    const data = await knex('portfolio_items').where({ isActive: true }).orderBy('id', 'desc');
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getFaqs = async (req, res) => {
  try {
    const data = await knex('faq_items').where({ isActive: true }).orderBy('orderIndex', 'asc');
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching faqs:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getPrintTechniques = async (req, res) => {
  try {
    const data = await knex('print_techniques').where({ isActive: true }).orderBy('id', 'asc');
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching print techniques:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
