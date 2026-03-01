const express = require('express');
const router = express.Router();
const { protect, adminOnly, adminOrAssistant } = require('../middleware/auth');
const formationController = require('../controllers/formationController');

// Rutas públicas (jugadores pueden ver)
router.get('/', protect, formationController.getFormations);
router.get('/:id', protect, formationController.getFormationById);

// Rutas protegidas (admin y asistente pueden crear/editar)
router.post('/', protect, adminOrAssistant, formationController.createFormation);
router.put('/:id', protect, adminOrAssistant, formationController.updateFormation);
router.delete('/:id', protect, adminOrAssistant, formationController.deleteFormation);
router.post('/:id/duplicate', protect, adminOrAssistant, formationController.duplicateFormation);

module.exports = router;
