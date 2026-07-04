require('dotenv').config();
const knex = require('./src/config/knex');
const cuid = require('cuid');

async function seedCollections() {
  try {
    const collectionsToInsert = [
      {
        id: cuid(),
        name: 'Everyday Collection',
        slug: 'everyday',
        description: 'Versatile pieces for everyday activities.',
        longDescription: 'Everyday Collection is the core of Arianation philosophy: ONE PIECE, MULTIPLE USES. Each piece is designed to be worn in various situations - from casual meetings, watching football, to weekend hangouts. Premium quality with timeless design.',
        purpose: 'Designed for those who want flexible styling every day without changing clothes often. One outfit for office, cafe, and evening walks.',
        highlights: JSON.stringify([
          'Minimalist design with streetwear touch',
          'Comfortable materials for all-day activity',
          'Easy to mix and match cuts',
        ]),
        useCases: JSON.stringify(['Casual meetings', 'Football games', 'Hangout', 'Weekend trips']),
        imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2000',
        isActive: true,
      },
      {
        id: cuid(),
        name: 'Work Collection',
        slug: 'work',
        description: 'Professional yet cool pieces.',
        longDescription: 'Work Collection brings a new approach to workwear: professional but not boring, stylish yet respectful for the workplace. Each piece is designed to make you look sharp at the office without sacrificing comfort and personal style.',
        purpose: 'This collection builds a professional image that remains relevant in daily style. Perfect for those who want to look sophisticated without losing character.',
        highlights: JSON.stringify([
          'Modern cuts with neat details',
          'Earth tones and neutrals that are easy to mix',
          'Soft yet structured materials',
        ]),
        useCases: JSON.stringify(['Business meetings', 'Co-working', 'Client presentations', 'Afterwork hangout']),
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2000',
        isActive: true,
      },
      {
        id: cuid(),
        name: 'Adventure Collection',
        slug: 'adventure',
        description: 'Outdoor-ready pieces for mountain climbing.',
        longDescription: 'Adventure Collection is made for active outdoor enthusiasts. From mountain climbing, hiking, padel, to outdoor concerts. Functional materials that are breathable and durable, with designs that remain stylish even in extreme conditions.',
        purpose: 'Ready to accompany open nature activities, lightweight, functional, and weather resistant. Ideal for urban adventurers who blend function with style.',
        highlights: JSON.stringify([
          'Breathable and quick-drying materials',
          'Functional details like smart pockets and adjustable straps',
          'Dark colors that are easy to clean',
        ]),
        useCases: JSON.stringify(['Hiking', 'Camping', 'Travel', 'Outdoor sports']),
        imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2000',
        isActive: true,
      },
      {
        id: cuid(),
        name: 'Stories Collection',
        slug: 'stories',
        description: 'Limited edition celebrating authentic culture.',
        longDescription: 'Stories Collection features limited edition drops that celebrate authentic Indonesian culture. Every piece has a story - from local artist collaborations, regional tribe inspirations, to supporter culture heritage. Limited quantity, meaningful stories.',
        purpose: 'Every product carries a strong story. From regional support, local arts, to supporter culture memories; you don\'t just buy an outfit, but a legacy of stories.',
        highlights: JSON.stringify([
          'Collaborations with local artists and communities',
          'Motifs and details inspired by Indonesian culture',
          'Limited drops for collectors and enthusiasts',
        ]),
        useCases: JSON.stringify(['Limited drops', 'Special gifts', 'Community events', 'Streetwear statement']),
        imageUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2000',
        isActive: true,
      }
    ];

    for (const col of collectionsToInsert) {
      const existing = await knex('collection').where('slug', col.slug).first();
      if (!existing) {
        await knex('collection').insert(col);
        console.log(`✅ Inserted collection: ${col.name}`);
      } else {
        console.log(`⚠️ Collection ${col.slug} already exists. Skipping.`);
      }
    }
    
    console.log('🎉 Seeding collections complete!');
  } catch (error) {
    console.error('❌ Error seeding collections:', error);
  } finally {
    process.exit(0);
  }
}

seedCollections();
