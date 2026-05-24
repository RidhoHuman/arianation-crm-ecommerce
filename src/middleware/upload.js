const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const sharp = require('sharp');
const Sentry = require('@sentry/node');

// Supabase storage support (enabled when SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and bucket exist)
const SUPABASE_URL = process.env.SUPABASE_URL || null;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || null;
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || null;
const SUPABASE_PUBLIC_URL = process.env.SUPABASE_PUBLIC_URL || null;
const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && SUPABASE_STORAGE_BUCKET);

let supabase = null;
if (USE_SUPABASE) {
  try {
    // require lazily to avoid loading supabase in test environments that don't need it
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (e) {
    // If require fails (missing optional deps in test env), fall back to null
    supabase = null;
    console.warn('Supabase client could not be initialized:', e.message);
  }
}

// ============================================================
// DIRECTORY SETUP
// ============================================================

// Determine uploads directory based on environment (only used when not using Supabase)
let baseUploadsDir;
if (USE_SUPABASE) {
  baseUploadsDir = null;
  console.info('✅ Supabase uploads enabled');
} else if (process.env.NODE_ENV === 'production') {
  // Vercel uses /tmp for temporary files
  baseUploadsDir = path.join(os.tmpdir(), 'uploads');
  console.warn('⚠️  Using temporary uploads directory on serverless platform. Consider implementing cloud storage (Supabase, etc.) for production.');
} else {
  // Local development - use uploads folder in project root
  baseUploadsDir = path.join(__dirname, '../../uploads');
}

// Create subdirectories
const productsDir = baseUploadsDir ? path.join(baseUploadsDir, 'products') : null;
const designsDir = baseUploadsDir ? path.join(baseUploadsDir, 'designs') : null;

if (baseUploadsDir) {
  [baseUploadsDir, productsDir, designsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// ============================================================
// STORAGE CONFIGURATION
// ============================================================

// Choose storage: if using Supabase, use memoryStorage so we can upload buffers
const productImageStorage = USE_SUPABASE ? multer.memoryStorage() : multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `product_${timestamp}_${random}${ext}`;
    cb(null, filename);
  },
});

const designFileStorage = USE_SUPABASE ? multer.memoryStorage() : multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, designsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `design_${timestamp}_${random}${ext}`;
    cb(null, filename);
  },
});

// ============================================================
// FILE FILTERS & VALIDATORS
// ============================================================

const imageFileFilter = (req, file, cb) => {
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  // Basic extension check
  if (!allowedExtensions.includes(fileExtension)) {
    return cb(new Error(`Image type not allowed. Allowed: ${allowedExtensions.join(', ')}`));
  }

  // MIME type sanity check
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    return cb(new Error('Invalid image MIME type'));
  }

  cb(null, true);
};

const designFileFilter = (req, file, cb) => {
  // Allow PNG, JPG, JPEG, PDF, AI, CDR, SVG, PSD
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.pdf', '.ai', '.cdr', '.svg', '.psd', '.zip'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    return cb(new Error(`File type not allowed. Allowed: ${allowedExtensions.join(', ')}`));
  }

  // Accept common image / pdf MIME types as extra check
  if (fileExtension === '.pdf' && file.mimetype !== 'application/pdf') {
    return cb(new Error('Invalid PDF MIME type'));
  }

  cb(null, true);
};

// ============================================================
// MULTER INSTANCES
// ============================================================

const uploadProductInstance = multer({
  storage: productImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const uploadDesignInstance = multer({
  storage: designFileStorage,
  fileFilter: designFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// ============================================================
// MIDDLEWARE WRAPPERS WITH ERROR HANDLING
// ============================================================

const uploadProductImage = (req, res, next) => {
  uploadProductInstance.single('image')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`,
        statusCode: 400,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
        statusCode: 400,
      });
    }
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        statusCode: 400,
      });
    }

        // If Supabase is enabled, upload the file buffer to Supabase Storage and populate req.file fields
        if (USE_SUPABASE && supabase && req.file && req.file.buffer) {
          try {
            const ext = path.extname(req.file.originalname).toLowerCase();
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 10000);
            const filename = `product_${timestamp}_${random}${ext}`;

            const key = `products/${filename}`;
            await uploadBufferToSupabase(key, req.file.buffer, req.file.mimetype);

            // If image, generate optimized variants (webp, thumbnail)
            if (req.file.mimetype && req.file.mimetype.startsWith('image/')) {
              const basename = path.basename(filename, ext);

              // WebP optimized
              try {
                const webpBuffer = await sharp(req.file.buffer)
                  .resize({ width: 1024, withoutEnlargement: true })
                  .webp({ quality: 80 })
                  .toBuffer();
                const webpFilename = `${basename}.webp`;
                await uploadBufferToSupabase(`products/${webpFilename}`, webpBuffer, 'image/webp');

                // Thumbnail
                const thumbBuffer = await sharp(req.file.buffer)
                  .resize(200, 200, { fit: 'cover' })
                  .webp({ quality: 75 })
                  .toBuffer();
                const thumbFilename = `${basename}_thumb.webp`;
                await uploadBufferToSupabase(`products/${thumbFilename}`, thumbBuffer, 'image/webp');

                req.file.optimized = { webp: webpFilename, thumb: thumbFilename };
                  } catch (optErr) {
                    console.warn('Image optimization failed:', optErr.message);
                    sentryCapture(optErr, req, { stage: 'image_optimization', type: 'product' });
                  }
            }

            req.file.filename = filename;
            req.file.size = req.file.size || req.file.buffer.length;
            req.file.url = getFileUrl(filename, 'products');
            console.info(`Uploaded to Supabase: ${req.file.url}`);
          } catch (uploadErr) {
            console.error('Supabase upload error:', uploadErr.message);
            sentryCapture(uploadErr, req, { stage: 'upload', type: 'product', key });
            return res.status(500).json({ success: false, message: 'Failed to upload to Supabase' });
          }
        }
    // If using disk storage, log local path/URL
    if (!USE_SUPABASE && req.file && req.file.filename) {
      const url = getFileUrl(req.file.filename, 'products');
      console.info(`Saved file: ${req.file.filename} -> ${url}`);
      req.file.url = url;
    }
    next();
  });
};

const uploadDesign = (req, res, next) => {
  uploadDesignInstance.single('designFile')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`,
        statusCode: 400,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
        statusCode: 400,
      });
    }
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        statusCode: 400,
      });
    }

    // If Supabase is enabled, upload design file buffer to Supabase Storage
    if (USE_SUPABASE && supabase && req.file && req.file.buffer) {
      try {
        const ext = path.extname(req.file.originalname).toLowerCase();
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        const filename = `design_${timestamp}_${random}${ext}`;

        const key = `designs/${filename}`;
        await uploadBufferToSupabase(key, req.file.buffer, req.file.mimetype);

        req.file.filename = filename;
        req.file.size = req.file.size || req.file.buffer.length;
        req.file.url = getFileUrl(filename, 'designs');
        console.info(`Uploaded design to Supabase: ${req.file.url}`);
      } catch (uploadErr) {
        console.error('Supabase design upload error:', uploadErr.message);
        sentryCapture(uploadErr, req, { stage: 'upload', type: 'design', key });
        return res.status(500).json({ success: false, message: 'Failed to upload design to Supabase' });
      }
    }

    if (!USE_SUPABASE && req.file && req.file.filename) {
      req.file.url = getFileUrl(req.file.filename, 'designs');
    }

    next();
  });
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Upload a buffer to Supabase Storage
 * @param {string} key - storage key (e.g. 'products/file.png')
 * @param {Buffer} buffer - file buffer
 * @param {string} contentType - MIME type
 */
const uploadBufferToSupabase = async (key, buffer, contentType) => {
  if (!USE_SUPABASE || !supabase) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(key, buffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw error;
  }
};

/**
 * Capture exception with Sentry and attach request/file context
 * @param {Error} err
 * @param {Request} req
 * @param {Object} extra
 */
const sentryCapture = (err, req, extra = {}) => {
  if (!Sentry || !process.env.SENTRY_DSN) return;

  Sentry.withScope((scope) => {
    try {
      // User context
      if (req && req.user) {
        scope.setUser({ id: req.user.id, email: req.user.email });
        scope.setTag('user_role', req.user.role);
      }

      // File context
      if (req && req.file) {
        scope.setTag('filename', req.file.filename || req.file.originalname);
        scope.setTag('file_mimetype', req.file.mimetype);
        scope.setExtra('originalName', req.file.originalname);
        scope.setExtra('fileSize', req.file.size || (req.file.buffer && req.file.buffer.length));
      }

      // Route / param context
      try {
        const route = req && (req.originalUrl || req.url);
        if (route) {
          scope.setTag('route', route);
        }
        if (req && req.method) scope.setExtra('method', req.method);
        if (req && req.params && req.params.id) {
          // Use param id as either productId or designRequestId depending on endpoint
          // Heuristic: if uploading product route contains 'products' in path, tag as productId
          const pid = req.params.id;
          if (route && route.includes('/products')) {
            scope.setTag('productId', pid);
          } else if (route && route.includes('/design-requests')) {
            scope.setTag('designRequestId', pid);
          }
        }
      } catch (e) {
        // ignore param extraction errors
      }

      // Header breadcrumbs (limited set)
      try {
        const headers = {};
        if (req && req.headers) {
          ['user-agent', 'referer', 'x-forwarded-for', 'host'].forEach((h) => {
            if (req.headers[h]) headers[h] = req.headers[h];
          });
        }
        scope.addBreadcrumb({
          category: 'request',
          message: `${req && req.method} ${req && (req.originalUrl || req.url)}`,
          level: 'info',
          data: headers,
        });
        scope.setExtra('headers', headers);
      } catch (e) {
        // ignore headers extraction errors
      }

      Object.keys(extra || {}).forEach((k) => scope.setExtra(k, extra[k]));
    } catch (e) {
      // ignore
    }
    Sentry.captureException(err);
  });
};

/**
 * Create a signed URL for a private object
 * @param {string} key - storage key (e.g. 'products/file.png')
 * @param {number} expires - seconds until expiration
 * @returns {string} signed URL
 */
const createSignedUrl = async (key, expires = 60) => {
  if (!USE_SUPABASE || !supabase) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .createSignedUrl(key, expires);

  if (error) {
    throw error;
  }

  return data.signedUrl;
};


/**
 * Get file URL based on environment
 * @param {string} filename - filename
 * @param {string} type - 'products' or 'designs'
 * @returns {string} file URL
 */
const getFileUrl = (filename, type = 'products') => {
  if (!filename) return null;
  
  if (USE_SUPABASE && SUPABASE_URL && SUPABASE_STORAGE_BUCKET) {
    if (SUPABASE_PUBLIC_URL) {
      return `${SUPABASE_PUBLIC_URL.replace(/\/$/, '')}/${type}/${filename}`;
    }
    return `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${type}/${filename}`;
  }
  if (process.env.NODE_ENV === 'production') {
    // For production, use your backend URL or CDN
    const baseUrl = process.env.BACKEND_URL || 'https://arianation-crm-ecommerce.vercel.app';
    return `${baseUrl}/uploads/${type}/${filename}`;
  }
  
  // For development
  const port = process.env.PORT || 3000;
  return `http://localhost:${port}/uploads/${type}/${filename}`;
};

/**
 * Delete file from storage
 * @param {string} filename - filename to delete
 * @param {string} type - 'products' or 'designs'
 * @returns {boolean} success status
 */
const deleteFile = (filename, type = 'products') => {
  if (!filename) return false;
  
  try {
    const dir = type === 'products' ? productsDir : designsDir;
    const filePath = path.join(dir, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (error) {
    console.error(`Error deleting file ${filename}:`, error.message);
  }
  
  return false;
};

/**
 * Get file info
 * @param {string} filename - filename
 * @param {string} type - 'products' or 'designs'
 * @returns {object} file info or null
 */
const getFileInfo = (filename, type = 'products') => {
  if (!filename) return null;
  
  try {
    const dir = type === 'products' ? productsDir : designsDir;
    const filePath = path.join(dir, filename);
    
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      return {
        filename,
        size: stats.size,
        createdAt: stats.birthtime,
        url: getFileUrl(filename, type),
      };
    }
  } catch (error) {
    console.error(`Error getting file info for ${filename}:`, error.message);
  }
  
  return null;
};

module.exports = {
  uploadProductImage,
  uploadDesign,
  getFileUrl,
  deleteFile,
  getFileInfo,
  uploadBufferToSupabase,
  sentryCapture,
  createSignedUrl,
  baseUploadsDir,
  productsDir,
  designsDir,
};
