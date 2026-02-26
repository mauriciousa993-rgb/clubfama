const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
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

// Rutas de administración (solo admin)
router.post('/', protect, adminOnly, createEvent);
router.put('/:id', protect, adminOnly, updateEvent);
router.delete('/:id', protect, adminOnly, deleteEvent);

module.exports = router;
