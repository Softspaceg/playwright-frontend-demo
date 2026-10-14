import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <span className="brand">🛍️ Demo Shop</span>
      <div className="nav-right">
        <span className="muted" data-testid="user-email">
          {user?.email}
        </span>
        <button className="btn btn-outline" onClick={handleLogout} data-testid="logout-button">
          Log out
        </button>
      </div>
    </header>
  );
}
