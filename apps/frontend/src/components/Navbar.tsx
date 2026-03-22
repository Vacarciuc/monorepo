import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { getCart } from '../api/cart.api';

const Navbar = () => {
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();
  const isAdmin = authService.isAdmin();
  const isSeller = authService.isSeller();
  const [cartCount, setCartCount] = useState(0);

  // Always fetch cart count — works even without login (mock customer fallback)
  useEffect(() => {
    getCart()
      .then((c) => setCartCount(c.items.reduce((s, i) => s + i.quantity, 0)))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">🌿 GreenMarket</Link>
        <div className="navbar-menu">
          <Link to="/products" className="navbar-link">Products</Link>

          {/* Cart — always visible for non-admin/non-seller */}
          {!isAdmin && !isSeller && (
            <Link to="/cart" className="navbar-link navbar-cart-link">
              🛒 Cart
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
          )}

          {(isAdmin || isSeller) && (
            <>
              <Link to="/admin" className="navbar-link admin-link">
                {isSeller ? 'My Products' : 'Admin Panel'}
              </Link>
              {/* Sellers/Admins can still shop */}
              <Link to="/cart" className="navbar-link navbar-cart-link">
                🛒 Cart
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
            </>
          )}

          {isAuthenticated ? (
            <button onClick={handleLogout} className="navbar-button">Logout</button>
          ) : (
            <>
              <Link to="/login" className="navbar-link">Login</Link>
              <Link to="/register" className="navbar-link">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

