const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Verificar si Cloudinary está configurado correctamente (no usar placeholders)
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_KEY !== 'your_api_key' &&
  process.env.CLOUDINARY_API_SECRET && 
  process.env.CLOUDINARY_API_SECRET !== 'your_api_secret';

let storage;

if (isCloudinaryConfigured) {
  // Usar Cloudinary si está configurado
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'club-fama-valle/payments',
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
      resource_type: 'auto'
    }
  });
  console.log('✅ Cloudinary configurado correctamente');
} else {

  // Usar almacenamiento local si Cloudinary no está configurado
  const uploadDir = path.join(__dirname, '../../uploads/payments');
  
  // Crear directorio si no existe
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
  console.log('⚠️  Cloudinary no configurado. Usando almacenamiento local en:', uploadDir);
}

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

module.exports = { cloudinary, upload };
