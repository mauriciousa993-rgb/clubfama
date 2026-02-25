const Payment = require('../models/Payment');
const User = require('../models/User');

// @desc    Subir comprobante de pago
// @route   POST /api/payments
// @access  Private (Player)
const uploadPaymentReceipt = async (req, res) => {
  try {
    const { amount, month_covered } = req.body;

    console.log('=== INICIO SUBIDA DE COMPROBANTE ===');
    console.log('Body recibido:', req.body);
    console.log('File recibido:', req.file);
    console.log('Headers:', req.headers['content-type']);

    if (!amount || !month_covered) {
      console.log('Error: Monto o mes faltante');
      return res.status(400).json({ message: 'Monto y mes son requeridos' });
    }

    // Verificar si hay archivo subido
    if (!req.file) {
      console.log('Error: No se recibió archivo');
      return res.status(400).json({ 
        message: 'El comprobante de pago es requerido',
        debug: 'No se detectó archivo en la solicitud. Asegúrate de enviar el archivo con el campo "receipt"'
      });
    }

    console.log('Archivo recibido correctamente:', req.file);
    console.log('Usuario:', req.user._id);
    console.log('Monto:', amount);
    console.log('Mes:', month_covered);


    // Determinar la URL del archivo según el tipo de almacenamiento
    const isCloudinaryConfigured = 
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_KEY !== 'your_api_key' &&
      process.env.CLOUDINARY_API_SECRET && 
      process.env.CLOUDINARY_API_SECRET !== 'your_api_secret';
    
    let receiptUrl;
    if (isCloudinaryConfigured) {
      // Cloudinary devuelve la URL completa en req.file.path
      receiptUrl = req.file.path;
    } else {
      // Almacenamiento local - usar solo el nombre del archivo para construir URL relativa
      receiptUrl = `/uploads/payments/${req.file.filename}`;
    }


    const payment = new Payment({
      player_ref: req.user._id,
      amount: amount,
      month_covered: month_covered,
      receipt_url: receiptUrl,
      status: 'pending'
    });


    const savedPayment = await payment.save();
    console.log('Pago guardado:', savedPayment);
    
    res.status(201).json(savedPayment);
  } catch (error) {
    console.error('========== ERROR DETALLADO AL SUBIR COMPROBANTE ==========');
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    console.error('Código:', error.code);
    console.error('Tipo:', error.name);
    console.error('===========================================================');
    
    res.status(500).json({ 
      message: 'Error al subir el comprobante',
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }

};


// @desc    Obtener pagos del usuario actual
// @route   GET /api/payments/my-payments
// @access  Private (Player)
const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ player_ref: req.user._id })
      .sort({ date_uploaded: -1 });
    
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los pagos' });
  }
};

// @desc    Obtener todos los pagos pendientes (Admin)
// @route   GET /api/payments/pending
// @access  Private (Admin)
const getPendingPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'pending' })
      .populate('player_ref', 'name email team_category')
      .sort({ date_uploaded: -1 });
    
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los pagos pendientes' });
  }
};

// @desc    Aprobar o rechazar pago (Admin)
// @route   PUT /api/payments/:id/status
// @access  Private (Admin)
const updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Pago no encontrado' });
    }

    payment.status = status;
    payment.date_approved = status === 'approved' ? Date.now() : null;

    await payment.save();

    // Si se aprueba, actualizar el estado de deuda del usuario
    if (status === 'approved') {
      await updateUserDebtStatus(payment.player_ref);
    }

    res.json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el estado del pago' });
  }
};

// @desc    Función auxiliar para actualizar debt_status del usuario
// @access  Private
const updateUserDebtStatus = async (userId) => {
  try {
    // Buscar pagos aprobados del usuario
    const approvedPayments = await Payment.find({ 
      player_ref: userId, 
      status: 'approved' 
    });

    // Obtener el mes actual
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });

    // Verificar si tiene al menos un pago aprobado del mes actual
    const hasCurrentMonthPayment = approvedPayments.some(payment => 
      payment.month_covered.toLowerCase() === currentMonth.toLowerCase()
    );

    // Actualizar estado de deuda
    await User.findByIdAndUpdate(userId, { 
      debt_status: !hasCurrentMonthPayment 
    });
  } catch (error) {
    console.error('Error al actualizar estado de deuda:', error);
  }
};

// @desc    Obtener todos los pagos (Admin)
// @route   GET /api/payments
// @access  Private (Admin)
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('player_ref', 'name email team_category')
      .sort({ date_uploaded: -1 });
    
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los pagos' });
  }
};

// @desc    Eliminar pago (Admin)
// @route   DELETE /api/payments/:id
// @access  Private (Admin)
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Pago no encontrado' });
    }

    await payment.deleteOne();

    res.json({ message: 'Pago eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el pago' });
  }
};

module.exports = {
  uploadPaymentReceipt,
  getMyPayments,
  getPendingPayments,
  updatePaymentStatus,
  getAllPayments,
  deletePayment
};
