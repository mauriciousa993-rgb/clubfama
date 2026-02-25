const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const mongoose = require('mongoose');
const path = require('path');


// Cargar variables de entorno desde la raíz del proyecto
dotenv.config({ path: path.join(__dirname, '../.env') });


// Conectar a la base de datos
connectDB();

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://clubfama.vercel.app',
  'http://localhost:8080',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS bloqueado para el origen: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Middleware adicional para logging
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log(`📡 ${req.method} ${req.url} - Origin: ${origin || 'N/A'}`);
  next();
});






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
app.use('/api/formations', require('./routes/formationRoutes'));


// Ruta de salud/health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'API Club FAMA VALLE funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta de prueba simple (GET) - para verificar CORS sin preflight
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'Test exitoso - Backend respondiendo',
    origin: req.headers.origin || 'No origin',
    timestamp: new Date().toISOString()
  });
});

// Ruta de prueba POST - para diagnosticar si llegan las peticiones POST
app.post('/api/test-post', (req, res) => {
  console.log('🧪 Test POST recibido:', {
    body: req.body,
    headers: req.headers['content-type'],
    origin: req.headers.origin
  });
  res.json({ 
    status: 'OK',
    message: 'Test POST exitoso',
    receivedBody: req.body,
    timestamp: new Date().toISOString()
  });
});


// Ruta para verificar estado de MongoDB
app.get('/api/health/db', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({
    database: 'MongoDB',
    status: states[dbState] || 'unknown',
    readyState: dbState,
    connected: dbState === 1,
    timestamp: new Date().toISOString()
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
  console.log(`🔄 Deploy actualizado: ${new Date().toISOString()}`);
});
