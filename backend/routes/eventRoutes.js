const express = require('express');
const router = express.Router();
const { protect, adminOnly, adminOrAssistant } = require('../middleware/auth');
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getUpcomingEvents
} = require('../controllers/eventController');

// Rutas públicas (requieren autenticación)
router.get('/', protect, getEvents);
router.get('/upcoming', protect, getUpcomingEvents);
router.get('/:id', protect, getEventById);

// Rutas de administración (admin y asistente)
router.post('/', protect, adminOrAssistant, createEvent);
router.put('/:id', protect, adminOrAssistant, updateEvent);
router.delete('/:id', protect, adminOrAssistant, deleteEvent);

module.exports = router;
