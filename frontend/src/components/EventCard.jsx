import { Link } from 'react-router-dom';

export default function EventCard({ event }) {
  const minPrice = event.ticketTiers && event.ticketTiers.length > 0
    ? Math.min(...event.ticketTiers.map(t => t.price))
    : null;

  const seatsRemaining = event.seatsRemaining !== undefined
    ? event.seatsRemaining
    : (event.ticketTiers || []).reduce((acc, t) => acc + (t.quantity - t.sold), 0);

  const getSeatsBadge = () => {
    if (seatsRemaining === 0) return <span className="badge badge-danger">Sold Out</span>;
    if (seatsRemaining <= 20) return <span className="badge badge-warning">{seatsRemaining} left</span>;
    return <span className="badge badge-success">{seatsRemaining} seats</span>;
  };

  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString('en-AU', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <div className="card">
      <div className="card-img">
        {event.bannerImage ? (
          <img src={event.bannerImage} alt={event.title} />
        ) : (
          <div className="card-img-placeholder">
            {event.category?.icon || '🎫'}
          </div>
        )}
      </div>
      <div className="card-body">
        {event.category && (
          <span className="badge badge-info">{event.category.icon} {event.category.name}</span>
        )}
        <h3 className="event-card-title">{event.title}</h3>
        <p className="event-card-meta">📅 {formattedDate}</p>
        <p className="event-card-meta">📍 {event.venue}{event.city ? `, ${event.city}` : ''}</p>
        <div className="event-card-footer">
          <span className="event-price">
            {minPrice !== null && minPrice > 0 ? `From $${minPrice.toFixed(2)}` : 'Free'}
          </span>
          {getSeatsBadge()}
        </div>
        <Link to={`/events/${event._id}`} className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }}>
          View Details
        </Link>
      </div>
    </div>
  );
}
