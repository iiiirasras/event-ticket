const mongoose = require('mongoose');

const ticketTierSchema = new mongoose.Schema({
  name:      { type: String, required: true },   // e.g. "General Admission"
  price:     { type: Number, required: true, min: 0 },
  quantity:  { type: Number, required: true, min: 0 },
  sold:      { type: Number, default: 0 },
});

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: [true, 'Event date is required'],
  },
  endDate: {
    type: Date,
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: [true, 'Venue is required'],
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: 1,
  },
  ticketTiers: [ticketTierSchema],
  bannerImage: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled'],
    default: 'draft',
  },
  tags: [String],
}, { timestamps: true });

// Virtual: total seats remaining
eventSchema.virtual('seatsRemaining').get(function () {
  return this.ticketTiers.reduce((acc, t) => acc + (t.quantity - t.sold), 0);
});

eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
