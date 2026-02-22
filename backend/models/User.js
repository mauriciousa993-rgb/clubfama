const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'player'],
    default: 'player'
  },
  team_category: {
    type: String,
    enum: ['femenino', 'mini', 'juvenil', 'elite'],
    default: null
  },

  debt_status: {
    type: Boolean,
    default: true
  },
  // Información personal completa
  document_type: {
    type: String,
    enum: ['cedula', 'tarjeta_identidad', 'pasaporte', 'otro'],
    default: null
  },
  document_number: {
    type: String,
    default: null
  },
  birth_date: {
    type: Date,
    default: null
  },
  address: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    default: null
  },
  photo_url: {
    type: String,
    default: null
  },
  // Información médica
  medical_history: {
    type: String,
    default: null
  },
  allergies: {
    type: String,
    default: null
  },
  diseases: {
    type: String,
    default: null
  },
  emergency_contact: {
    name: { type: String, default: null },
    phone: { type: String, default: null },
    relationship: { type: String, default: null }
  },
  // Información de padres (para menores de edad)
  father_name: {
    type: String,
    default: null
  },
  father_phone: {
    type: String,
    default: null
  },
  father_occupation: {
    type: String,
    default: null
  },
  mother_name: {
    type: String,
    default: null
  },
  mother_phone: {
    type: String,
    default: null
  },
  mother_occupation: {
    type: String,
    default: null
  },
  // Información académica
  education_level: {
    type: String,
    enum: ['primaria', 'secundaria', 'tecnico', 'universitario', 'profesional', 'otro'],
    default: null
  },
  institution: {
    type: String,
    default: null
  },
  career_grade: {
    type: String,
    default: null
  },
  semester: {
    type: String,
    default: null
  },
  // Perfil completado
  profile_completed: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});


// Encriptar contraseña antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método para comparar contraseñas
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
