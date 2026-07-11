import React from 'react';
import SEOHead from '../components/SEOHead';
import Breadcrumb from '../components/Breadcrumb';
import FAQ from '../components/FAQ';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function FAQPage() {
  const { t: rootT } = useTranslation('translation');
  const t = rootT('faq', { returnObjects: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="pt-24 min-h-screen pb-16"
    >
      <SEOHead 
        title={t.title} 
        description={t.desc}
      />

      <div className="max-w-7xl mx-auto px-4">
        <Breadcrumb 
          items={[
            { label: 'Home', path: '/' },
            { label: 'FAQ', path: '/faq' }
          ]} 
        />
        
        <div className="mt-8 mb-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="text-4xl font-display font-bold uppercase tracking-tight mb-4">{t.heading}</h1>
            <p className="text-gray-500 uppercase tracking-widest text-sm leading-relaxed">
              {t.subheading}
            </p>
          </div>
          
          <div className="bg-white dark:bg-black p-8 shadow-sm border border-gray-200 dark:border-gray-800">
            <FAQ faqs={t.faqs} title={t.faqTitle} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
