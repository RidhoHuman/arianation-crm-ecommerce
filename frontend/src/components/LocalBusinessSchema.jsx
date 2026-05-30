import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * LocalBusinessSchema - JSON-LD untuk toko fisik/brick-and-mortar
 * Injected ke homepage + local pages
 *
 * Tampil di Google Maps, local search, Knowledge Graph
 */
export default function LocalBusinessSchema() {
  const businessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://arianation.com/#business',
    name: 'Arianation',
    alternateName: 'Arianation Sablon & Fashion',
    description: 'Toko sablon dan fashion online berkualitas dengan custom design dan harga terjangkau',
    url: 'https://arianation.com',
    logo: 'https://arianation.com/logo.png',
    image: 'https://arianation.com/hero.jpg',

    // Physical location (showroom/warehouse)
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Jalan Raya Kasembon, Rt.03/Rw.01, Kasembon',
      addressLocality: 'Malang',
      addressRegion: 'Jawa Timur',
      postalCode: '63593',
      addressCountry: 'ID',
    },

    // Contact information
    telephone: '+62-815-5312-3387',
    email: 'support@arianation.com',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      telephone: '+62-815-5312-3387',
      email: 'support@arianation.com',
      availableLanguage: ['id', 'en'],
    },

    // Opening hours
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '09:00',
        closes: '21:00',
      },
    ],

    // Geo coordinates (untuk Google Maps)
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -7.7817978,
      longitude: 112.3075014,
    },

    // Social media profiles
    sameAs: [
      'https://www.instagram.com/arianation',
      'https://www.facebook.com/arianation',
      'https://www.tiktok.com/@arianation',
    ],

    // Ratings & reviews (aggregate)
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: 4.8,
      ratingCount: 156,
      reviewCount: 42,
      bestRating: 5,
      worstRating: 1,
    },

    // Service area
    areaServed: {
      '@type': 'City',
      name: 'Jakarta',
    },
    serviceArea: {
      '@type': 'State',
      name: 'DKI Jakarta',
    },

    // Price range (optional)
    priceRange: '$$', // $ = murah, $$ = menengah, $$$ = mahal

    // Payment methods
    paymentAccepted: ['Cash', 'CreditCard', 'Transfer'],

    // Business type
    additionalType: 'https://schema.org/ClothingStore',
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(businessSchema)}
      </script>
    </Helmet>
  );
}
