const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Conexión a MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://clubfama:clubfama123@cluster0.yycgg.mongodb.net/clubfama?retryWrites=true&w=majority';

async function createAssistantUser() {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Conectado a MongoDB');

    // Definir esquema de usuario inline
    const userSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      team_category: String,
      category: String,
      position: String,
      additionalInfo: String,
      debt_status: Boolean,
      document_type: String,
      document_number: String,
      birth_date: Date,
      birth_department: String,
      birth_municipality: String,
      nationality: String,
      gender: String,
      address: String,
      phone: String,
      photo_url: String,
      medical_history: String,
      allergies: String,
      diseases: String,
      height: String,
      weight: String,
      eps: String,
      blood_type: String,
      emergency_contact: Object,
      father_name: String,
      father_phone: String,
      father_occupation: String,
      mother_name: String,
      mother_phone: String,
      mother_occupation: String,
      education_level: String,
      institution: String,
      career_grade: String,
      semester: String,
      profile_completed: Boolean,
      created_at: Date,
      updated_at: Date
    });

    const User = mongoose.model('User', userSchema);

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: 'asistente@clubfama.com' });
    if (existingUser) {
      console.log('⚠️ El usuario asistente@clubfama.com ya existe');
      console.log('📊 Rol actual:', existingUser.role);
      
      // Actualizar el rol a assistant
      existingUser.role = 'assistant';
      await existingUser.save();
      console.log('✅ Usuario actualizado al rol de asistente');
    } else {
      // Crear nuevo usuario asistente
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('asistente123', salt);

      const assistantUser = new User({
        name: 'Asistente',
        email: 'asistente@clubfama.com',
        password: hashedPassword,
        role: 'assistant',
        team_category: null,
        category: null,
        position: null,
        additionalInfo: null,
        debt_status: false,
        document_type: null,
        document_number: null,
        birth_date: null,
        birth_department: null,
        birth_municipality: null,
        nationality: null,
        gender: null,
        address: null,
        phone: null,
        photo_url: null,
        medical_history: null,
        allergies: null,
        diseases: null,
        height: null,
        weight: null,
        eps: null,
        blood_type: null,
        emergency_contact: {},
        father_name: null,
        father_phone: null,
        father_occupation: null,
        mother_name: null,
        mother_phone: null,
        mother_occupation: null,
        education_level: null,
        institution: null,
        career_grade: null,
        semester: null,
        profile_completed: false,
        created_at: new Date(),
        updated_at: new Date()
      });

      await assistantUser.save();
      console.log('✅ Usuario asistente creado exitosamente');
    }

    console.log('\n📋 Credenciales del asistente:');
    console.log('   Email: asistente@clubfama.com');
    console.log('   Contraseña: asistente123');
    console.log('   Rol: assistant');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
  }
}

createAssistantUser();
