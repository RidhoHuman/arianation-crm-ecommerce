import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * SEO Head component untuk dynamic meta tags
 * @param {string} title - Page title (auto-appended dengan " | Arianation")
 * @param {string} description - Meta description (max 160 chars)
 * @param {string} image - OG image URL
 * @param {string} url - Canonical URL
 * @param {string} type - OG type (website, product, article, etc)
 * @param {object} structuredData - JSON-LD structured data object
 */
export const SEOHead = ({
  title = 'Arianation - Sablon & Fashion E-Commerce',
  description = 'Toko sablon dan fashion online berkualitas dengan custom design dan harga terjangkau',
  image = '/og-image.png',
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  structuredData = null,
}) => {
  const fullTitle = title.includes('Arianation') ? title : `${title} | Arianation`;
  const siteUrl = 'https://arianation.com'; // Replace with actual domain

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="UTF-8" />

      {/* Open Graph Tags (Social Media) */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url || siteUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Arianation" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Canonical URL */}
      <link rel="canonical" href={url || siteUrl} />

      {/* Additional SEO Tags */}
      <meta name="keywords" content="sablon, custom tshirt, fashion, murah, jakarta, indonesia" />
      <meta name="author" content="Arianation" />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="Indonesian" />

      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />

      {/* JSON-LD Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;
