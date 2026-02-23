const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generar JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// @desc    Registrar nuevo usuario
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    console.log('🧾 Register hit', {
      origin: req.headers.origin,
      host: req.headers.host,
      path: req.originalUrl,
      hasBody: Boolean(req.body),
      keys: req.body ? Object.keys(req.body) : [],
    });

    // Verificar conexión a MongoDB
    const mongoose = require('mongoose');
    console.log('🔍 MongoDB readyState:', mongoose.connection.readyState);
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ MongoDB no está conectado. Estado:', mongoose.connection.readyState);
      return res.status(503).json({ 
        message: 'Servicio no disponible. Error de conexión a la base de datos. Por favor, contacta al administrador.' 
      });
    }

    const { name, email, password, role, team_category } = req.body;
    console.log('🧾 Register payload', {
      name: name ? '[present]' : '[missing]',
      email: email ? '[present]' : '[missing]',
      password: password ? '[present]' : '[missing]',
      role: role || '[default]',
      team_category: team_category || '[null]',
    });

    // Validar campos requeridos
    if (!name || !email || !password) {
      console.log('❌ Campos requeridos faltantes');
      return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos' });
    }

    // Verificar si el usuario ya existe
    console.log('🔍 Buscando usuario existente...');
    const userExists = await User.findOne({ email });
    console.log('🧾 Register userExists', { email, exists: Boolean(userExists) });

    if (userExists) {
      console.log('⚠️ Usuario ya existe:', email);
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Crear usuario
    console.log('📝 Creando nuevo usuario...');
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'player',
      team_category: team_category || null,
    });
    console.log('✅ Usuario creado:', user._id);

    if (user) {
      const token = generateToken(user._id);
      console.log('🔑 Token generado');
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        team_category: user.team_category,
        debt_status: user.debt_status,
        token: token,
      });
    } else {
      res.status(400).json({ message: 'Datos de usuario inválidos' });
    }
  } catch (error) {
    console.error('❌ ERROR EN REGISTRO:', error);
    console.error('Stack:', error.stack);
    // Devolver error completo para diagnóstico (temporal)
    res.status(500).json({
      message: 'Error al registrar usuario',
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
  }

};


// @desc    Autenticar usuario y obtener token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificar email y password
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        team_category: user.team_category,
        debt_status: user.debt_status,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Email o contraseña inválidos' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
};

// @desc    Obtener perfil del usuario
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener perfil' });
  }
};

// @desc    Actualizar perfil del usuario
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Campos permitidos para actualizar
    const allowedFields = [
      'name', 'team_category', 'document_type', 'document_number', 'birth_date', 'address', 'phone',
      'medical_history', 'allergies', 'diseases', 'emergency_contact',
      'father_name', 'father_phone', 'father_occupation',
      'mother_name', 'mother_phone', 'mother_occupation',
      'education_level', 'institution', 'career_grade', 'semester', 'photo_url'
    ];


    // Actualizar campos
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        // Si el valor es string vacío, guardar como null para evitar errores de enum
        if (req.body[field] === '') {
          user[field] = null;
        } else {
          user[field] = req.body[field];
        }
      }
    });


    // Marcar perfil como completado si tiene documento y fecha de nacimiento
    if (user.document_number && user.birth_date) {
      user.profile_completed = true;
    }

    user.updated_at = Date.now();
    await user.save();

    res.json({
      message: 'Perfil actualizado correctamente',
        user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        team_category: user.team_category,
        profile_completed: user.profile_completed,
        document_type: user.document_type,

        document_number: user.document_number,
        birth_date: user.birth_date,
        address: user.address,
        phone: user.phone,
        photo_url: user.photo_url,
        medical_history: user.medical_history,
        allergies: user.allergies,
        diseases: user.diseases,
        emergency_contact: user.emergency_contact,
        father_name: user.father_name,
        mother_name: user.mother_name,
        education_level: user.education_level,
        institution: user.institution,
        career_grade: user.career_grade,
        semester: user.semester
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar perfil' });
  }
};

// @desc    Obtener todos los usuarios (solo admin)
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'player' }).select('-password');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

// @desc    Subir foto de perfil
// @route   POST /api/auth/upload-photo
// @access  Private
const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha subido ninguna imagen' });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Guardar la URL relativa de la foto
    const photoUrl = `/uploads/profiles/${req.file.filename}`;
    user.photo_url = photoUrl;
    user.updated_at = Date.now();
    await user.save();

    res.json({
      message: 'Foto de perfil actualizada correctamente',
      photo_url: photoUrl
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al subir la foto' });
  }
};

// @desc    Eliminar usuario (solo admin)
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // No permitir que un admin se elimine a sí mismo
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta de administrador' });
    }

    await User.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
};

// @desc    Actualizar usuario (solo admin)
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Campos que el admin puede actualizar
    const allowedFields = [
      'name', 'team_category', 'document_type', 'document_number', 
      'birth_date', 'address', 'phone', 'debt_status',
      'medical_history', 'allergies', 'diseases', 'emergency_contact',
      'father_name', 'father_phone', 'father_occupation',
      'mother_name', 'mother_phone', 'mother_occupation',
      'education_level', 'institution', 'career_grade', 'semester'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (req.body[field] === '') {
          user[field] = null;
        } else {
          user[field] = req.body[field];
        }
      }
    });

    user.updated_at = Date.now();
    await user.save();

    res.json({
      message: 'Usuario actualizado correctamente',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        team_category: user.team_category,
        debt_status: user.debt_status,
        document_type: user.document_type,
        document_number: user.document_number,
        birth_date: user.birth_date,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
};


module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  getUsers,
  uploadPhoto,
  deleteUser,
  updateUser,
};
