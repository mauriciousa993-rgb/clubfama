const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Opciones de conexión para MongoDB Atlas
    // Nota: useNewUrlParser y useUnifiedTopology están deprecados en Node.js Driver 4.0+
    // y han sido eliminados. Usar mongoose 6+ para evitar estos warnings.
    const connOptions = {
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
    console.error('⚠️ El servidor continuará ejecutándose pero sin conexión a la base de datos');
    
    // No cerrar el servidor, permitir que responda a requests (aunque fallen)
    // Esto permite diagnosticar problemas de CORS sin depender de MongoDB
  }

};

module.exports = connectDB;
module.exports.isConnected = () => mongoose.connection.readyState === 1;
