import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import HeroSlider from '../components/HeroSlider';
import ProductCard from '../components/ProductCard';
import SEOHead from '../components/SEOHead';
import LocalBusinessSchema from '../components/LocalBusinessSchema';
import useUIStore from '../store/uiStore';
import useCategoryStore from '../store/categoryStore';
import useCollectionStore from '../store/collectionStore';
import useProductTypeStore from '../store/productTypeStore';
import api from '../services/api';

export default function HomePage() {
  const language = useUIStore((s) => s.language) || 'ID';
  const { categories, fetchCategories } = useCategoryStore();
  const { collections, fetchCollections } = useCollectionStore();
  const { types, fetchTypes } = useProductTypeStore();

  const [newDrops, setNewDrops] = useState([]);
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState(null);

  const { t } = useTranslation('translation', { keyPrefix: 'home' });

  useEffect(() => {
    fetchCategories();
    fetchCollections();
    fetchTypes();

    // Fetch new drops (4 latest products)
    const loadNewDrops = async () => {
      try {
        const res = await api.get('/products', { params: { limit: 4, businessType: 'FASHION_RETAIL' } });
        setNewDrops(res.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch new drops', err);
      }
    };
    loadNewDrops();
  }, [fetchCategories, fetchCollections]);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!subscriberEmail) return;
    try {
      await api.post('/subscribers', { email: subscriberEmail });
      setSubscribeStatus('success');
      setSubscriberEmail('');
    } catch (err) {
      setSubscribeStatus('error');
    }
  };

  // Filter collections by is_featured (or fallback to active ones if is_featured not used widely yet)
  const featuredCollections = collections.filter(c => c.isActive && c.is_featured);
  // If no featured, just take the first 2 active collections as fallback
  const displayCollections = featuredCollections.length > 0 ? featuredCollections : collections.filter(c => c.isActive).slice(0, 2);

  // Image slider for Custom Sablon section
  const customSablonImages = [
    'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=1000&q=80', // folded stack of blank tees
    'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=1000&q=80',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1000&q=80'
  ];
  const [sablonImageIdx, setSablonImageIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSablonImageIdx(prev => (prev + 1) % customSablonImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const activeCategories = categories.filter(c => c.isActive && c.businessType === 'FASHION_RETAIL');
  const activeTypes = types.filter(t => t.isActive).slice(0, 4); // Limit to 4 for a symmetrical grid

  const getTypeImage = (slug) => {
    const defaultImages = {
      't-shirts': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80',
      'hoodies': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80',
      'pants': 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&q=80',
      'accessories': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80',
      'jacket': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80'
    };
    return defaultImages[slug] || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80';
  };

  const homeStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Arianation',
    url: 'https://arianation.com',
    logo: 'https://arianation.com/logo_AriaNation-removebg-preview.svg',
    description: language === 'EN'
      ? 'Premium streetwear and custom sablon e-commerce'
      : 'Toko sablon dan fashion online berkualitas dengan custom design dan harga terjangkau',
  };

  return (
    <>
      <SEOHead
        title="Arianation"
        description={language === 'EN' ? 'Premium streetwear crafted for the rebels, the supporters, and the adventurers.' : 'Pakaian jalanan premium untuk para pemberontak, pendukung, dan petualang.'}
        url="https://arianation.com"
        type="website"
        structuredData={homeStructuredData}
      />
      <LocalBusinessSchema />

      <div className="w-full bg-white dark:bg-black transition-colors duration-300">

        {/* HERO SLIDER */}
        <HeroSlider location="home" />

        {/* NEW DROPS SECTION */}
        <section className="py-16 md:py-24">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-10 border-b border-gray-200 dark:border-gray-800 pb-4">
              <div>
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-aria-charcoal dark:text-white uppercase">
                  {t('newDrops')}
                </h2>
              </div>
              <Link
                to="/products"
                className="hidden md:inline-flex items-center text-xs font-bold tracking-widest uppercase text-aria-charcoal dark:text-white hover:text-aria-maroon transition-colors"
              >
                {t('shopAll')} <span className="ml-2">→</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {newDrops.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <ProductCard product={product} showCategory={false} />
                </motion.div>
              ))}
            </div>

            <div className="md:hidden text-center mt-8">
              <Link to="/products" className="inline-flex items-center text-xs font-bold tracking-widest uppercase text-aria-charcoal dark:text-white hover:text-aria-maroon transition-colors">
                {t('shopAll')} <span className="ml-2">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* FEATURED COLLECTIONS (ZIG-ZAG LAYOUT) */}
        <section className="py-16 md:py-24 bg-white dark:bg-black">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
            <div className="space-y-20 md:space-y-32">
              {displayCollections.slice(0, 2).map((col, index) => {
                const isEven = index % 2 === 0;
                // Provide translated labels for common collections
                const colKey = `col_${col.name.replace(/ /g, '_')}`;
                let translatedColName = t(colKey, { defaultValue: col.name });

                const isDefaultDesc = !col.description || col.description === 'Jelajahi koleksi eksklusif ini.' || col.description === 'Explore this exclusive collection.';
                const translatedDesc = isDefaultDesc ? t('desc_Explore') : col.description;

                return (
                  <div key={col.id} className="w-full flex flex-col md:flex-row items-center gap-8 md:gap-16">
                    {/* Image Side */}
                    <div className={`w-full md:w-1/2 flex items-center justify-center ${isEven ? 'md:order-1' : 'md:order-2'}`}>
                      <img
                        src={col.imageUrl || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80'}
                        alt={translatedColName}
                        className="w-full max-w-lg aspect-square object-contain"
                      />
                    </div>

                    {/* Text Side */}
                    <div className={`w-full md:w-1/2 flex items-center justify-start ${isEven ? 'md:order-2 md:pl-12' : 'md:order-1 md:pr-12'}`}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="max-w-md w-full"
                      >
                        <div className="text-xs font-bold text-aria-maroon tracking-widest uppercase mb-4">{t('collectionLabel')}</div>
                        <h3 className="text-4xl md:text-5xl font-black text-aria-charcoal dark:text-white mb-6 tracking-tighter">
                          {translatedColName}
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 mb-8 leading-relaxed font-medium text-lg">
                          {translatedDesc}
                        </p>
                        <Link
                          to={`/products?collection=${col.slug || col.id}`}
                          className="inline-flex items-center text-sm font-bold tracking-widest uppercase text-aria-charcoal dark:text-white hover:text-aria-maroon transition-colors border-b-2 border-black dark:border-white pb-1"
                        >
                          {t('explore')} →
                        </Link>
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CUSTOM SABLON CTA - Static with Split Layout */}
        <section className="w-full bg-black text-white flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 flex items-center justify-center p-12 md:p-24 lg:p-32 relative overflow-hidden">
            {/* Subtle background texture for the black block */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23fff\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E")', backgroundSize: '20px 20px' }}></div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative z-10 max-w-lg w-full"
            >
              <div className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-4">{t('customServiceLabel')}</div>
              <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter leading-[1.1]">
                {t('customTitle')}
              </h2>
              <p className="text-lg text-gray-300 mb-10 leading-relaxed">
                {t('customDesc')}
              </p>
              <Link
                to="/custom-sablon"
                className="inline-block bg-white text-black px-8 py-4 font-bold uppercase tracking-widest text-sm hover:bg-gray-200 transition-colors"
              >
                {t('startDesigning')}
              </Link>
            </motion.div>
          </div>
          <div className="w-full md:w-1/2 min-h-[400px] relative overflow-hidden group">
            <AnimatePresence mode="wait">
              <motion.img
                key={sablonImageIdx}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                src={customSablonImages[sablonImageIdx]}
                alt="Custom Sablon Service"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
              />
            </AnimatePresence>
            {/* Navigation Dots for Sablon Slider */}
            <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2">
              {customSablonImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSablonImageIdx(idx)}
                  className={`transition-all duration-300 rounded-full ${sablonImageIdx === idx
                    ? 'w-6 h-1.5 bg-white'
                    : 'w-2 h-1.5 bg-white/50 hover:bg-white/80'
                    }`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
            {/* Subtle dark overlay on hover to match the vibe */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-1000 pointer-events-none"></div>
          </div>
        </section>

        {/* SHOP BY TYPE (Grid with Dark Overlays) */}
        {activeTypes.length > 0 && (
          <section className="py-24 bg-white dark:bg-black">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
              <h2 className="text-4xl font-black tracking-tighter text-center text-aria-charcoal dark:text-white uppercase mb-16">
                {t('shopByType')}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {activeTypes.map((type) => (
                  <Link
                    key={type.id}
                    to={`/products?type=${type.slug}`}
                    className="group relative bg-gray-900 aspect-square overflow-hidden rounded-sm"
                  >
                    <img
                      src={type.imageUrl || getTypeImage(type.slug)}
                      alt={type.typeName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100"
                    />
                    {/* Dark Overlay 40% for text readability */}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />

                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <span className="text-white font-black uppercase tracking-widest text-xl drop-shadow-md group-hover:-translate-y-1 transition-transform duration-300">
                        {type.typeName}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* JOIN THE COMMUNITY / NEWSLETTER */}
        <section className="py-24 bg-gray-50 dark:bg-gray-950">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-black text-aria-charcoal dark:text-white mb-4 tracking-tighter">
                {t('joinTitle')}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-xl mx-auto font-medium">
                {t('joinDesc')}
              </p>
              {subscribeStatus === 'success' ? (
                <p className="text-green-600 dark:text-green-400 font-bold">{t('subscribed')}</p>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-0 max-w-lg mx-auto shadow-sm">
                  <input
                    type="email"
                    value={subscriberEmail}
                    onChange={(e) => setSubscriberEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    className="flex-1 px-6 py-4 border border-gray-300 dark:border-gray-700 border-r-0 focus:outline-none focus:border-black transition-colors bg-white dark:bg-black text-sm dark:text-white font-medium rounded-l-sm"
                    required
                  />
                  <button
                    type="submit"
                    className="px-10 py-4 bg-black text-white font-bold uppercase tracking-widest text-sm hover:bg-aria-maroon transition-colors rounded-r-sm"
                  >
                    {t('subscribe')}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </section>

      </div>
    </>
  );
}
