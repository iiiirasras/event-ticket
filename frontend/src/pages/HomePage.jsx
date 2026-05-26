import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import EventCard from '../components/EventCard';

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/events?limit=6&status=published')
      .then(res => {
        setEvents(res.data.events || res.data);
      })
      .catch(err => {
        setError('Failed to load events. Please try again later.');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <h1>Discover & Book Amazing Events</h1>
          <p>Find concerts, sports, conferences, festivals and more. Book your tickets in seconds.</p>
          <div className="hero-buttons">
            <Link to="/events" className="btn btn-primary" style={{ background: 'var(--accent)', fontSize: '1.05rem', padding: '0.75rem 2rem' }}>
              Browse Events
            </Link>
            <Link to="/register" className="btn btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.7)', fontSize: '1.05rem', padding: '0.75rem 2rem' }}>
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Featured Events</h2>

          {loading && (
            <div className="spinner-container">
              <div className="spinner"></div>
            </div>
          )}

          {error && (
            <div className="alert alert-error">{error}</div>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="empty-state">
              <h3>No events available yet</h3>
              <p>Check back soon for upcoming events!</p>
            </div>
          )}

          {!loading && !error && events.length > 0 && (
            <div className="grid-3">
              {events.map(event => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          )}

          {!loading && events.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Link to="/events" className="btn btn-outline">
                View All Events →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="section" style={{ background: 'white' }}>
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>Why Choose TicketHub?</h2>
          <div className="grid-3" style={{ marginTop: '1.5rem' }}>
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎫</div>
              <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Easy Booking</h3>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.95rem' }}>Book tickets in seconds with our streamlined checkout process.</p>
            </div>
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📱</div>
              <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>QR Code Tickets</h3>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.95rem' }}>Get instant QR code tickets delivered to your account.</p>
            </div>
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔒</div>
              <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Secure & Reliable</h3>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.95rem' }}>Your bookings are safe with us. Hassle-free cancellations available.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
