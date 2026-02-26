const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  time: {
    type: String, // HH:MM
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  event_type: {
    type: String,
    enum: ['entrenamiento', 'partido', 'reunion', 'torneo', 'otro'],
    default: 'entrenamiento'
  },
  team_category: {
    type: String,
    enum: ['femenino', 'mini', 'juvenil', 'elite', 'all'],
    default: 'all'
  },
  recurrence: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly'],
    default: 'none'
  },
  recurrence_end_date: {
    type: String, // YYYY-MM-DD
    default: null
  },
  parent_event_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null
  },
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

// Índices para búsquedas eficientes
eventSchema.index({ date: 1, is_active: 1 });
eventSchema.index({ team_category: 1 });
eventSchema.index({ created_by: 1 });

module.exports = mongoose.model('Event', eventSchema);
