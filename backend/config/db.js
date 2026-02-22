const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Opciones de conexión para MongoDB Atlas
    const connOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: 'majority'
    };

    // Usar MONGODB_URI de variables de entorno (Atlas) o fallback a local
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/club_fama_valle';
    
    const conn = await mongoose.connect(mongoURI, connOptions);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    
    // En producción, no continuar sin conexión
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 No se puede continuar sin conexión a MongoDB en producción');
      process.exit(1);
    } else {
      console.log('⚠️  Continuando sin conexión a MongoDB (modo desarrollo)...');
    }
  }
};

module.exports = connectDB;
