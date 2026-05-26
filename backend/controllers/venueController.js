const Venue = require('../models/Venue');
const Event = require('../models/Event');

// GET /api/venues  — public
const getVenues = async (req, res) => {
  try {
    const { active } = req.query;
    const query = active === 'true' ? { isActive: true } : {};
    const venues = await Venue.find(query).sort({ name: 1 });
    res.json({ venues });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/venues/:id  — public
const getVenueById = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) return res.status(404).json({ message: 'Venue not found' });
    res.json({ venue });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/venues  — admin
const createVenue = async (req, res) => {
  try {
    const venue = await Venue.create(req.body);
    res.status(201).json({ venue });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/venues/:id  — admin
const updateVenue = async (req, res) => {
  try {
    const venue = await Venue.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!venue) return res.status(404).json({ message: 'Venue not found' });
    res.json({ venue });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/venues/:id  — admin
const deleteVenue = async (req, res) => {
  try {
    // Check if any active events use this venue
    const activeEvents = await Event.countDocuments({
      venue: req.params.id,
      status: { $in: ['published', 'draft'] },
    });
    if (activeEvents > 0) {
      return res.status(400).json({
        message: `Cannot delete venue — it is used by ${activeEvents} active event(s)`,
      });
    }
    const venue = await Venue.findByIdAndDelete(req.params.id);
    if (!venue) return res.status(404).json({ message: 'Venue not found' });
    res.json({ message: 'Venue deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getVenues, getVenueById, createVenue, updateVenue, deleteVenue };
