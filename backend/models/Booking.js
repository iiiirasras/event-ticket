const mongoose = require('mongoose');

const bookedTicketSchema = new mongoose.Schema({
  tierName:  { type: String, required: true },
  quantity:  { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
});

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  tickets: [bookedTicketSchema],
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'refunded'],
    default: 'confirmed',
  },
  qrCode: {
    type: String,  // base64 data URL
    default: '',
  },
  qrData: {
    type: String,  // unique string encoded into the QR
    default: '',
  },
  paymentRef: {
    type: String,
    default: () => 'PAY-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
  },
  cancelledAt: {
    type: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
