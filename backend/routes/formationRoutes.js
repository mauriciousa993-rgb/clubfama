const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const formationController = require('../controllers/formationController');

// Rutas públicas (jugadores pueden ver)
router.get('/', protect, formationController.getFormations);
router.get('/:id', protect, formationController.getFormationById);

// Rutas protegidas (solo admin/entrenador)
router.post('/', protect, adminOnly, formationController.createFormation);
router.put('/:id', protect, adminOnly, formationController.updateFormation);
router.delete('/:id', protect, adminOnly, formationController.deleteFormation);
router.post('/:id/duplicate', protect, adminOnly, formationController.duplicateFormation);

module.exports = router;
