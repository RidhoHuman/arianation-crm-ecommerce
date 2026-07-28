import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Target, Globe, Users, Award } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import useCategoryStore from '../store/categoryStore';
import { useTranslation, Trans } from 'react-i18next';

const getTranslatedCategoryName = (name, t) => {
  if (!name) return '';
  const lower = name.toLowerCase();
  if (lower.includes('everyday')) return t('about.categories.everyday');
  if (lower.includes('heritage')) return t('about.categories.heritage');
  if (lower.includes('outdoor')) return t('about.categories.outdoor');
  if (lower.includes('street')) return t('about.categories.street');
  if (lower.includes('active')) return t('about.categories.active');
  return name;
};

export default function About() {
  const { t } = useTranslation('translation');
  const { categories, fetchCategories } = useCategoryStore();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const activeCategories = categories.filter(c => c.isActive && c.businessType === 'FASHION_RETAIL');

  return (
    <>
      <SEOHead
        title="About Arianation - Indonesian Lifestyle Brand"
        description="Discover the story of Arianation: a versatile lifestyle brand rooted in authentic Indonesian culture, supporter passion, and quality craftsmanship."
        url="https://arianation-crm-ecommerce.vercel.app/about"
      />

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="bg-aria-charcoal text-white py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {t('about.heroTitle')}
            </h1>
            <p className="text-xl md:text-2xl text-aria-cream font-light">
              <Trans i18nKey="about.heroSubtitle" />
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* Story Section */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold mb-8 text-aria-charcoal">
              {t('about.storyTitle')}
            </h2>
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div className="space-y-6 text-gray-700 text-lg leading-relaxed">
                <p>
                  <Trans i18nKey="about.storyP1" />
                </p>
                <p>
                  <Trans i18nKey="about.storyP2" />
                </p>
                <p>
                  <Trans i18nKey="about.storyP3" />
                </p>
              </div>
              <div className="relative h-[400px] md:h-[500px] rounded-lg overflow-hidden shadow-xl">
                <img
                  src="/store-interiror.jfif"
                  alt="Arianation Screen Printing Workshop"
                  className="w-full h-full object-cover grayscale-[20%]"
                />
              </div>
            </div>
          </section>

          {/* Philosophy Section */}
          <section className="mb-20 bg-aria-cream px-8 py-12 rounded-lg">
            <h2 className="text-3xl font-bold mb-8 text-aria-charcoal">
              {t('about.philosophyTitle')}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Target className="w-6 h-6 text-aria-charcoal" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-aria-charcoal mb-2">
                    {t('about.phil1Title')}
                  </h3>
                  <p className="text-gray-700">
                    <Trans i18nKey="about.phil1Desc" />
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Globe className="w-6 h-6 text-aria-charcoal" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-aria-charcoal mb-2">
                    {t('about.phil2Title')}
                  </h3>
                  <p className="text-gray-700">
                    <Trans i18nKey="about.phil2Desc" />
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Users className="w-6 h-6 text-aria-charcoal" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-aria-charcoal mb-2">
                    {t('about.phil3Title')}
                  </h3>
                  <p className="text-gray-700">
                    <Trans i18nKey="about.phil3Desc" />
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Award className="w-6 h-6 text-aria-charcoal" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-aria-charcoal mb-2">
                    {t('about.phil4Title')}
                  </h3>
                  <p className="text-gray-700">
                    <Trans i18nKey="about.phil4Desc" />
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Collections Section */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold mb-8 text-aria-charcoal">
              {t('about.collectionsTitle')}
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-2 gap-6">
              {activeCategories.length > 0 ? activeCategories.map((col, index) => {
                // Fallback images in case the category doesn't have an image
                const fallbackImgs = [
                  'https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                  'https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                ];
                const imgSource = col.imageUrl || fallbackImgs[index % fallbackImgs.length];

                return (
                  <div key={col.id} className="relative group overflow-hidden rounded-lg aspect-[4/3] sm:aspect-[4/5] bg-gray-200">
                    <img
                      src={imgSource}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      alt={getTranslatedCategoryName(col.categoryName, t)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:bg-black/40 transition-colors duration-300"></div>
                    <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 text-white">
                      <h3 className="text-2xl font-bold mb-2 uppercase tracking-wide">
                        {getTranslatedCategoryName(col.categoryName, t)}
                      </h3>
                      <p className="text-gray-200 mb-4 line-clamp-2 text-sm md:text-base font-light">
                        {col.description || t('about.exploreCollectionDesc')}
                      </p>
                      <Link
                        to={`/categories/${col.slug || col.id}`}
                        className="inline-block text-white font-semibold uppercase tracking-wider text-sm hover:underline"
                      >
                        {t('about.exploreCollectionLink')}
                      </Link>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-gray-500 italic col-span-2 text-center py-8">
                  {t('about.loadingCollections')}
                </p>
              )}
            </div>
          </section>

          {/* Vision Section */}
          <section className="mb-20 relative overflow-hidden rounded-lg">
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src="https://images.unsplash.com/photo-1518063009955-46f3630f40d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
                alt="Community Vision"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/80"></div>

            {/* Content */}
            <div className="relative z-10 px-8 py-16 md:py-24 max-w-3xl mx-auto text-center text-white">
              <h2 className="text-4xl font-bold mb-8 uppercase tracking-widest">
                {t('about.visionTitle')}
              </h2>
              <div className="space-y-6 text-lg md:text-xl font-light text-gray-200">
                <p>
                  <Trans i18nKey="about.visionP1" />
                </p>
                <p>
                  <Trans i18nKey="about.visionP2" />
                </p>
                <p>
                  <Trans i18nKey="about.visionP3" />
                </p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center">
            <h2 className="text-3xl font-bold mb-6 text-aria-charcoal">
              {t('about.ctaTitle')}
            </h2>
            <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
              <Trans i18nKey="about.ctaDesc" />
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="bg-aria-charcoal text-white px-8 py-3 rounded-lg font-semibold hover:bg-aria-maroon transition"
              >
                {t('about.shopCollection')}
              </Link>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-aria-charcoal text-aria-charcoal px-8 py-3 rounded-lg font-semibold hover:bg-aria-cream transition"
              >
                {t('about.followUs')}
              </a>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
