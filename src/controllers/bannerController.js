const knex = require('../config/knex');
const cuid = require('cuid');

const getBanners = async (req, res, next) => {
  try {
    const { location, activeOnly } = req.query;
    let query = knex('hero_banners').orderBy('orderIndex', 'asc');

    if (location) {
      query = query.where('page_location', location);
    }

    if (activeOnly === 'true') {
      query = query.where('isActive', true);
    }

    const banners = await query;
    res.json({
      success: true,
      data: banners,
    });
  } catch (error) {
    next(error);
  }
};

const createBanner = async (req, res, next) => {
  try {
    const {
      page_location,
      imageUrl,
      title,
      subtitle,
      buttonText,
      buttonLink,
      isActive,
      orderIndex,
    } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'Image URL is required' });
    }

    const id = `ban-${cuid().substring(0, 8)}`;

    await knex('hero_banners').insert({
      id,
      page_location: page_location || 'home',
      imageUrl,
      title: title || null,
      subtitle: subtitle || null,
      buttonText: buttonText || null,
      buttonLink: buttonLink || null,
      isActive: isActive !== undefined ? isActive : true,
      orderIndex: orderIndex || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const newBanner = await knex('hero_banners').where({ id }).first();
    res
      .status(201)
      .json({ success: true, data: newBanner, message: 'Banner created successfully' });
  } catch (error) {
    next(error);
  }
};

const updateBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const banner = await knex('hero_banners').where({ id }).first();
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    await knex('hero_banners')
      .where({ id })
      .update({
        page_location:
          updates.page_location !== undefined ? updates.page_location : banner.page_location,
        imageUrl: updates.imageUrl !== undefined ? updates.imageUrl : banner.imageUrl,
        title: updates.title !== undefined ? updates.title : banner.title,
        subtitle: updates.subtitle !== undefined ? updates.subtitle : banner.subtitle,
        buttonText: updates.buttonText !== undefined ? updates.buttonText : banner.buttonText,
        buttonLink: updates.buttonLink !== undefined ? updates.buttonLink : banner.buttonLink,
        isActive: updates.isActive !== undefined ? updates.isActive : banner.isActive,
        orderIndex: updates.orderIndex !== undefined ? updates.orderIndex : banner.orderIndex,
        updatedAt: new Date(),
      });

    const updatedBanner = await knex('hero_banners').where({ id }).first();
    res.json({ success: true, data: updatedBanner, message: 'Banner updated successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;

    const banner = await knex('hero_banners').where({ id }).first();
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    await knex('hero_banners').where({ id }).del();
    res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
};
