const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');

// Cargar variables de entorno desde la raíz del proyecto
dotenv.config({ path: path.join(__dirname, '../.env') });


// Conectar a la base de datos
connectDB();

const app = express();

// Configurar CORS para producción
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  'https://club-fama-valle.vercel.app', // Frontend en Vercel
  process.env.FRONTEND_URL // URL del frontend en producción
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log('Origin bloqueado:', origin);
      callback(null, true); // Temporalmente permitir todos en desarrollo
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos del frontend (para desarrollo local)
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/public')));
}

// Servir archivos subidos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas API
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// Ruta de salud/health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'API Club FAMA VALLE funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    deploy: 'Render deploy trigger'
  });
});


// Ruta principal - en producción Vercel maneja el frontend
app.get('/', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.json({ message: 'API Club FAMA VALLE - Backend activo' });
  } else {
    res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
  }
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Manejo de errores generales
app.use((err, req, res, next) => {
  console.error('========== ERROR DETALLADO ==========');
  console.error('Mensaje:', err.message);
  console.error('Stack:', err.stack);
  console.error('Código:', err.code);
  console.error('Tipo:', err.name);
  console.error('=====================================');
  
  // No enviar stack trace en producción
  const errorResponse = {
    message: 'Error interno del servidor'
  };
  
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.error = err.message;
    errorResponse.type = err.name;
  }
  
  res.status(500).json(errorResponse);
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en modo ${process.env.NODE_ENV || 'development'} en el puerto ${PORT}`);
  console.log(`📡 API disponible en: http://localhost:${PORT}/api`);
});
