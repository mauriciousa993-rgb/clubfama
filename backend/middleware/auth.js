const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Obtener token del header
      token = req.headers.authorization.split(' ')[1];

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Obtener usuario del token
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'No autorizado, token inválido' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'No autorizado, sin token' });
  }
};

// Middleware para verificar si es admin
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Acceso denegado, solo administradores' });
  }
};

// Middleware para verificar si es jugador
const playerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'player') {
    next();
  } else {
    res.status(403).json({ message: 'Acceso denegado, solo jugadores' });
  }
};

module.exports = { protect, adminOnly, playerOnly };
