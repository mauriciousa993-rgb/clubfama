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
let uploadDir;

if (isCloudinaryConfigured) {
  // Usar Cloudinary si está configurado
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'club-fama-valle/profiles',
      allowed_formats: ['jpg', 'jpeg', 'png'],
      resource_type: 'image',
      transformation: [{ width: 500, height: 500, crop: 'limit' }]
    }
  });
  console.log('✅ Cloudinary configurado correctamente para fotos de perfil');
} else {
  // Usar almacenamiento local si Cloudinary no está configurado
  uploadDir = path.join(__dirname, '../../uploads/profiles');
  
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
      const ext = path.extname(file.originalname);
      cb(null, 'profile-' + uniqueSuffix + ext);
    }
  });
  console.log('⚠️  Cloudinary no configurado. Usando almacenamiento local en:', uploadDir);
}

// Filtro de archivos - solo imágenes
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos JPG, JPEG o PNG'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});

module.exports = { cloudinary, upload, uploadDir };
