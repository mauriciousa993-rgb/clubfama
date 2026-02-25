const mongoose = require('mongoose');

// Movimiento de un jugador en un paso específico
const playerMovementSchema = new mongoose.Schema({
  player_number: { type: Number, required: true },
  player_name: { type: String, default: '' },
  position_x: { type: Number, required: true }, // Porcentaje 0-100
  position_y: { type: Number, required: true }, // Porcentaje 0-100
  has_ball: { type: Boolean, default: false },
  action: { 
    type: String, 
    enum: ['move', 'pass', 'shoot', 'screen', 'cut', 'stay', 'dribble', 'receive'],
    default: 'move'
  },
  action_description: { type: String, default: '' }
});

// Un paso/fase de la jugada
const stepSchema = new mongoose.Schema({
  step_number: { type: Number, required: true },
  duration: { type: Number, default: 2000 }, // ms
  description: { type: String, default: '' },
  player_movements: [playerMovementSchema],
  ball_position: {
    x: { type: Number, default: null },
    y: { type: Number, default: null }
  }
});

const formationSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  code: { 
    type: String, 
    required: true, 
    unique: true 
  }, // Ej: "PNR-01", "ATAQUE-1"
  description: { 
    type: String, 
    default: '' 
  },
  play_type: {
    type: String,
    enum: ['ataque', 'defensa', 'transicion', 'out_of_bounds', 'freethrow', 'sistema'],
    default: 'ataque'
  },
  team_category: {
    type: String,
    enum: ['femenino', 'mini', 'juvenil', 'elite', 'all'],
    default: 'all'
  },
  total_steps: { 
    type: Number, 
    default: 1 
  },
  steps: [stepSchema],
  starting_positions: [playerMovementSchema], // Posición inicial
  created_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  is_active: { 
    type: Boolean, 
    default: true 
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

module.exports = mongoose.model('Formation', formationSchema);
