import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCart } from '../api/cart.api';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isSeller, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    getCart()
      .then((c) => setCartCount(c.items.reduce((s, i) => s + i.quantity, 0)))
      .catch(() => {});
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">🌿 GreenMarket</Link>
        <div className="navbar-menu">
          {isAuthenticated &&
            <Link to="/products" className="navbar-link">Products</Link>
          }

          {!isAdmin && !isSeller && (
            <Link to="/cart" className="navbar-link navbar-cart-link">
              🛒 Cart
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
          )}

          { isAuthenticated && (isAdmin || isSeller) && (
            <>
              <Link to="/admin" className="navbar-link admin-link">
                {isSeller ? 'My Products' : 'Admin Panel'}
              </Link>
              <Link to="/cart" className="navbar-link navbar-cart-link">
                🛒 Cart
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
            </>
          )}

          {isAuthenticated &&
            <button onClick={handleLogout} className="navbar-button">Logout</button>
          }
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
