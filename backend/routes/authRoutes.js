const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { upload } = require('../config/cloudinaryProfiles');
const {
  register,
  login,
  getProfile,
  updateProfile,
  getUsers,
  uploadPhoto,
  deleteUser,
  updateUser
} = require('../controllers/authController');


// Rutas públicas
router.post('/register', register);
router.post('/login', login);

// Rutas protegidas
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/users', protect, adminOnly, getUsers);

// Rutas de administración (solo admin)
router.delete('/users/:id', protect, adminOnly, deleteUser);
router.put('/users/:id', protect, adminOnly, updateUser);

// Ruta para subir foto de perfil
router.post('/upload-photo', protect, upload.single('photo'), uploadPhoto);


module.exports = router;
