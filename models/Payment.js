const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  player_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  month_covered: {
    type: String,
    required: true,
    enum: ['January', 'February', 'March', 'April', 'May', 'June', 
           'July', 'August', 'September', 'October', 'November', 'December']
  },
  receipt_url: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  date_uploaded: {
    type: Date,
    default: Date.now
  },
  date_approved: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('Payment', paymentSchema);
