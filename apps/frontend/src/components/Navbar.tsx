import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';

const Navbar = () => {
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();
  const isAdmin = authService.isAdmin();
  const isSeller = authService.isSeller();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          🌿 GreenMarket
        </Link>
        <div className="navbar-menu">
          <Link to="/products" className="navbar-link">
            Products
          </Link>
          {(isAdmin || isSeller) && (
            <Link to="/admin" className="navbar-link admin-link">
              {isSeller ? 'My Products' : 'Admin Panel'}
            </Link>
          )}
          {isAuthenticated ? (
            <button onClick={handleLogout} className="navbar-button">
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="navbar-link">
                Login
              </Link>
              <Link to="/register" className="navbar-link">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

