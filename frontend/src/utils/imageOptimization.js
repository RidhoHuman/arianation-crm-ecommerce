// frontend/src/utils/imageOptimization.js
/**
 * Image optimization utilities - compress & WebP conversion
 * Uses Cloudinary for serverless image transformations
 */

export const cloudinaryConfig = {
  cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
  uploadPreset: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'your-preset',
};

/**
 * Generate optimized image URL with Cloudinary transformations
 * @param {string} publicId - Cloudinary public_id
 * @param {object} options - Transformation options
 * @returns {string} Optimized image URL
 */
export const getOptimizedImageUrl = (publicId, options = {}) => {
  if (!publicId) return '/placeholder.png';

  const {
    width = 800,
    height = 800,
    quality = 'auto', // auto = Google's quality recommendations
    format = 'auto', // auto = WebP for browsers that support it
    crop = 'fill',
    gravity = 'auto',
  } = options;

  const baseUrl = `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload`;
  const transformations = `w_${width},h_${height},c_${crop},g_${gravity},q_${quality},f_${format}`;

  return `${baseUrl}/${transformations}/${publicId}`;
};

/**
 * Generate responsive image srcset for lazy loading
 * @param {string} publicId
 * @param {string} sizes - CSS sizes attribute
 * @returns {object} { src, srcSet, sizes }
 */
export const getResponsiveImage = (publicId, sizes = '100vw') => {
  if (!publicId) {
    return {
      src: '/placeholder.png',
      srcSet: '/placeholder.png',
      sizes,
    };
  }

  const baseUrl = `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload`;

  return {
    src: getOptimizedImageUrl(publicId, { width: 800 }),
    srcSet: [
      `${getOptimizedImageUrl(publicId, { width: 400 })} 400w`,
      `${getOptimizedImageUrl(publicId, { width: 600 })} 600w`,
      `${getOptimizedImageUrl(publicId, { width: 800 })} 800w`,
      `${getOptimizedImageUrl(publicId, { width: 1200 })} 1200w`,
    ].join(', '),
    sizes,
  };
};

/**
 * Picture element generator untuk WebP fallback
 * @param {string} publicId
 * @param {string} alt
 * @param {object} options
 * @returns {JSX}
 */
export const generatePictureElement = (publicId, alt, options = {}) => {
  if (!publicId) return <img src="/placeholder.png" alt={alt} />;

  const webpSrcSet = getResponsiveImage(publicId, options.sizes).srcSet;
  const jpgSrcSet = [
    `${getOptimizedImageUrl(publicId, { width: 400, format: 'jpg' })} 400w`,
    `${getOptimizedImageUrl(publicId, { width: 600, format: 'jpg' })} 600w`,
    `${getOptimizedImageUrl(publicId, { width: 800, format: 'jpg' })} 800w`,
    `${getOptimizedImageUrl(publicId, { width: 1200, format: 'jpg' })} 1200w`,
  ].join(', ');

  return {
    webpSrcSet,
    jpgSrcSet,
    src: getOptimizedImageUrl(publicId, { width: 800, format: 'jpg' }),
    alt,
  };
};

export default {
  getOptimizedImageUrl,
  getResponsiveImage,
  generatePictureElement,
};
