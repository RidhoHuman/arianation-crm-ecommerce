const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Determine uploads directory
// On Vercel/serverless, use /tmp; locally use /public/uploads
let uploadsDir;
if (process.env.NODE_ENV === 'production') {
  // Vercel uses /tmp for temporary files
  uploadsDir = path.join(os.tmpdir(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  console.warn('⚠️  Using temporary uploads directory on serverless platform. Consider implementing cloud storage (S3, etc.) for production.');
} else {
  // Local development
  uploadsDir = path.join(__dirname, '../../public/uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter for design uploads
const designFileFilter = (req, file, cb) => {
  // Allow PNG, JPG, JPEG, PDF, AI, CDR, SVG
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.pdf', '.ai', '.cdr', '.svg'];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`), false);
  }
};

// Create multer instance for design uploads
const uploadDesign = multer({
  storage: storage,
  fileFilter: designFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Create multer instance for product images
const uploadProductImage = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(
        new Error(`Image type not allowed. Allowed types: ${allowedExtensions.join(', ')}`),
        false
      );
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

module.exports = {
  uploadDesign: uploadDesign.single('designFile'),
  uploadProductImage: uploadProductImage.single('image'),
};
