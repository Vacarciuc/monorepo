import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCart } from '../api/cart.api';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isSeller, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      getCart()
        .then((c) => setCartCount(c.items.reduce((s, i) => s + i.quantity, 0)))
        .catch(() => {});
    }
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

          {/* Produse — vizibil pentru toți autentificați */}
          {isAuthenticated && (
            <Link to="/products" className="navbar-link">Produse</Link>
          )}

          {/* Coș + Comenzile mele — doar clienți */}
          {isAuthenticated && !isAdmin && !isSeller && (
            <>
              <Link to="/cart" className="navbar-link navbar-cart-link">
                🛒 Coș
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
              <Link to="/orders" className="navbar-link">📋 Comenzile Mele</Link>
            </>
          )}

          {/* Vânzător — gestionare produse */}
          {isAuthenticated && (isAdmin || isSeller) && (
            <Link to="/seller" className="navbar-link admin-link">
              📦 {isSeller ? 'Produsele Mele' : 'Produse'}
            </Link>
          )}

          {/* Admin — gestionare utilizatori (doar admin) */}
          {isAuthenticated && isAdmin && (
            <Link to="/admin" className="navbar-link admin-link">
              🛠️ Utilizatori
            </Link>
          )}

          {isAuthenticated && (
            <button onClick={handleLogout} className="navbar-button">Deconectare</button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
