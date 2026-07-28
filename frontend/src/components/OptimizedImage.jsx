import React from 'react';
import { getOptimizedImageUrl, getResponsiveImage } from '../utils/imageOptimization';

/**
 * OptimizedImage - Auto WebP, lazy loading, responsive srcset
 * Replaces <img> tags dengan optimisasi otomatis
 *
 * @param {string} publicId - Cloudinary public_id (or fallback URL)
 * @param {string} alt - Alt text (SEO + accessibility)
 * @param {object} options - {width, height, className, loading, sizes}
 */
export default function OptimizedImage({
  publicId,
  alt = 'Arianation product image',
  width = 400,
  height = 400,
  className = '',
  loading = 'lazy', // 'lazy' or 'eager' for above-fold
  sizes = '(max-width: 768px) 100vw, 50vw',
  onLoad = null,
}) {
  const isExternalUrl = publicId?.startsWith('http');
  const isLocalUpload = publicId?.startsWith('/uploads');

  // If external URL or local upload, use native image (no Cloudinary transform)
  if (isExternalUrl || isLocalUpload) {
    return (
      <img
        src={publicId}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        className={className}
        onLoad={onLoad}
        onError={(e) => {
          e.target.onerror = null;
          e.target.style.display = 'none';
        }}
      />
    );
  }

  const { src, srcSet } = getResponsiveImage(publicId, sizes);

  return (
    <picture>
      {/* WebP - primary format (smaller, better quality) */}
      <source
        srcSet={srcSet}
        type="image/webp"
        sizes={sizes}
      />

      {/* JPG fallback for older browsers */}
      <source
        srcSet={[
          `${getOptimizedImageUrl(publicId, { width: 400, format: 'jpg' })} 400w`,
          `${getOptimizedImageUrl(publicId, { width: 600, format: 'jpg' })} 600w`,
          `${getOptimizedImageUrl(publicId, { width: 800, format: 'jpg' })} 800w`,
        ].join(', ')}
        type="image/jpeg"
        sizes={sizes}
      />

      {/* Fallback img tag */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        className={className}
        onLoad={onLoad}
        decoding="async"
        onError={(e) => {
          e.target.onerror = null;
          e.target.style.display = 'none';
        }}
      />
    </picture>
  );
}
