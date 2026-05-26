const QRCode = require('qrcode');
const Booking = require('../models/Booking');
const Event = require('../models/Event');

// POST /api/bookings  — authenticated user
const createBooking = async (req, res) => {
  try {
    const { eventId, tickets } = req.body; // tickets: [{tierName, quantity}]
    if (!eventId || !tickets || !tickets.length) {
      return res.status(400).json({ message: 'eventId and tickets are required' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.status !== 'published') return res.status(400).json({ message: 'Event is not available for booking' });

    const now = new Date();
    if (new Date(event.date) < now) return res.status(400).json({ message: 'Event has already passed' });

    let totalAmount = 0;
    const bookedTickets = [];

    for (const req_ticket of tickets) {
      const tier = event.ticketTiers.find(t => t.name === req_ticket.tierName);
      if (!tier) return res.status(400).json({ message: `Ticket tier "${req_ticket.tierName}" not found` });
      const available = tier.quantity - tier.sold;
      if (req_ticket.quantity > available) {
        return res.status(400).json({ message: `Only ${available} tickets left for "${tier.name}"` });
      }
      bookedTickets.push({ tierName: tier.name, quantity: req_ticket.quantity, unitPrice: tier.price });
      totalAmount += tier.price * req_ticket.quantity;
    }

    // Deduct seats
    for (const bt of bookedTickets) {
      const tier = event.ticketTiers.find(t => t.name === bt.tierName);
      tier.sold += bt.quantity;
    }
    await event.save();

    // Generate QR
    const qrData = `BOOKING-${req.user._id}-${eventId}-${Date.now()}`;
    const qrCode = await QRCode.toDataURL(qrData);

    const booking = await Booking.create({
      user: req.user._id,
      event: eventId,
      tickets: bookedTickets,
      totalAmount,
      qrCode,
      qrData,
    });

    await booking.populate('event', 'title date venue');
    res.status(201).json({ booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/bookings/my  — authenticated user
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('event', 'title date venue status bannerImage')
      .sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/bookings/:id  — authenticated user (own booking)
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('event', 'title date venue status bannerImage')
      .populate('user', 'name email');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    // Allow own booking or admin
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json({ booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/bookings/:id  — authenticated user (cancel own)
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('event');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    // Enforce 24-hour cancellation window (skip for admin)
    if (req.user.role !== 'admin') {
      const eventDate = new Date(booking.event.date);
      const hoursUntilEvent = (eventDate - new Date()) / (1000 * 60 * 60);
      if (hoursUntilEvent < 24) {
        return res.status(400).json({ message: 'Cancellation is only allowed up to 24 hours before the event' });
      }
    }

    // Restore seats
    const event = await Event.findById(booking.event._id);
    if (event) {
      for (const bt of booking.tickets) {
        const tier = event.ticketTiers.find(t => t.name === bt.tierName);
        if (tier) tier.sold = Math.max(0, tier.sold - bt.quantity);
      }
      await event.save();
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();
    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createBooking, getMyBookings, getBookingById, cancelBooking };
