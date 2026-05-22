const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// ============================================================
// DIRECTORY SETUP
// ============================================================

// Determine uploads directory based on environment
let baseUploadsDir;
if (process.env.NODE_ENV === 'production') {
  // Vercel uses /tmp for temporary files
  baseUploadsDir = path.join(os.tmpdir(), 'uploads');
  console.warn('⚠️  Using temporary uploads directory on serverless platform. Consider implementing cloud storage (S3, etc.) for production.');
} else {
  // Local development - use uploads folder in project root
  baseUploadsDir = path.join(__dirname, '../../uploads');
}

// Create subdirectories
const productsDir = path.join(baseUploadsDir, 'products');
const designsDir = path.join(baseUploadsDir, 'designs');

[baseUploadsDir, productsDir, designsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ============================================================
// STORAGE CONFIGURATION
// ============================================================

const productImageStorage = multer.diskStorage({
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

const designFileStorage = multer.diskStorage({
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

  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Image type not allowed. Allowed: ${allowedExtensions.join(', ')}`));
  }
};

const designFileFilter = (req, file, cb) => {
  // Allow PNG, JPG, JPEG, PDF, AI, CDR, SVG, PSD
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.pdf', '.ai', '.cdr', '.svg', '.psd', '.zip'];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed: ${allowedExtensions.join(', ')}`));
  }
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
  uploadProductInstance.single('image')(req, res, (err) => {
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
    next();
  });
};

const uploadDesign = (req, res, next) => {
  uploadDesignInstance.single('designFile')(req, res, (err) => {
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
    next();
  });
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Get file URL based on environment
 * @param {string} filename - filename
 * @param {string} type - 'products' or 'designs'
 * @returns {string} file URL
 */
const getFileUrl = (filename, type = 'products') => {
  if (!filename) return null;
  
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
  baseUploadsDir,
  productsDir,
  designsDir,
};
