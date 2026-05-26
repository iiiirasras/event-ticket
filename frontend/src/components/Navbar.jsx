import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="nav-logo">🎫 TicketHub</Link>
        <div className="nav-links">
          <Link to="/events">Events</Link>
          {user && <Link to="/dashboard">Dashboard</Link>}
          {user && <Link to="/my-tickets">My Tickets</Link>}
          {user && user.role === 'admin' && <Link to="/admin">Admin Panel</Link>}
          {!user ? (
            <>
              <Link to="/login">
                <button className="btn btn-outline btn-sm" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.6)' }}>
                  Login
                </button>
              </Link>
              <Link to="/register">
                <button className="btn btn-primary btn-sm" style={{ background: 'var(--accent)' }}>
                  Register
                </button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/profile" className="nav-user">
                Hi, {user.name.split(' ')[0]}
              </Link>
              <button className="btn btn-sm" onClick={handleLogout}
                style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
