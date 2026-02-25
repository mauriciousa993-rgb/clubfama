const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const {
  uploadPaymentReceipt,
  getMyPayments,
  getPendingPayments,
  updatePaymentStatus,
  getAllPayments,
  deletePayment
} = require('../controllers/paymentController');

// Rutas para jugadores
router.post('/', protect, upload.single('receipt'), uploadPaymentReceipt);
router.get('/my-payments', protect, getMyPayments);

// Rutas para administradores
router.get('/pending', protect, adminOnly, getPendingPayments);
router.get('/', protect, adminOnly, getAllPayments);
router.put('/:id/status', protect, adminOnly, updatePaymentStatus);
router.delete('/:id', protect, adminOnly, deletePayment);

module.exports = router;
