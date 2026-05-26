const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Venue name is required'],
    trim: true,
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
  },
  country: {
    type: String,
    default: 'Australia',
    trim: true,
  },
  capacity: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
    default: '',
  },
  facilities: [String],   // e.g. ['Parking', 'Wheelchair Access', 'Food & Beverage']
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Venue', venueSchema);
