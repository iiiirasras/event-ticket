const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth',       require('./routes/authRoutes'));
app.use('/api/events',     require('./routes/eventRoutes'));
app.use('/api/bookings',   require('./routes/bookingRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/venues',     require('./routes/venueRoutes'));
app.use('/api/admin',      require('./routes/adminRoutes'));

app.get('/', (req, res) => res.json({ message: 'Event Ticketing API running' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
