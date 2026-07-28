import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Breadcrumb Navigation component dengan JSON-LD schema
 * Auto-generates breadcrumb dari current URL path
 */
export default function Breadcrumb({ customLabels = {} }) {
  const location = useLocation();
  const { t } = useTranslation('translation', { keyPrefix: 'breadcrumb' });
  const pathname = location.pathname;

  // Parse breadcrumb dari URL
  const segments = pathname.split('/').filter(Boolean);

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: t('home', 'Home'), path: '/' },
  ];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;

    // Translates segments like 'cart', 'products', 'checkout', etc.
    const translatedSegment = t(segment, customLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1));
    
    breadcrumbItems.push({
      label: translatedSegment,
      path: currentPath,
    });
  });

  // Generate JSON-LD structured data
  const jsonLdStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: `https://arianation.com${item.path}`,
    })),
  };

  // Only show breadcrumb if more than 2 items (not on homepage)
  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <>
      {/* JSON-LD Schema */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLdStructuredData)}
      </script>

      {/* Breadcrumb Navigation */}
      <nav
        className="bg-gray-50 py-3 px-4 mb-6 rounded"
        aria-label="Breadcrumb"
      >
        <ol className="flex items-center space-x-2 text-sm">
          {breadcrumbItems.map((item, index) => (
            <li key={item.path} className="flex items-center">
              {index > 0 && <span className="text-gray-400 mx-2">›</span>}

              {index === breadcrumbItems.length - 1 ? (
                // Last item - not a link
                <span className="font-semibold text-gray-900" aria-current="page">
                  {item.label}
                </span>
              ) : (
                // Link to previous pages
                <Link
                  to={item.path}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
