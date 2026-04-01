import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCart } from '../api/cart.api';
import { getOrders } from '../api/order.api';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isSeller, username, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [hasNewOrders, setHasNewOrders] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    getCart()
      .then((c) => setCartCount(c.items.reduce((s, i) => s + i.quantity, 0)))
      .catch(() => {});

    // Verifică dacă există comenzi cu status != pending (notificare)
    if (!isAdmin && !isSeller) {
      getOrders()
        .then((orders) => setHasNewOrders(orders.some((o) => o.status !== 'pending')))
        .catch(() => {});
    }
  }, [isAuthenticated, isAdmin, isSeller]);

  // Închide dropdown la click în afară
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const initial = username
    ? username.charAt(0).toUpperCase()
    : '?';

  const avatarColor = isAdmin
    ? 'var(--avatar-admin)'
    : isSeller
      ? 'var(--avatar-seller)'
      : 'var(--avatar-user)';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">🌿 GreenMarket</Link>

        {/* Linkuri navigare — icoane fără text */}
        <div className="navbar-menu">
          {isAuthenticated && (
            <Link to="/products" className="navbar-icon-link" title="Produse">
              🛍️
            </Link>
          )}

          {/* Coș + Comenzile mele — doar clienți (user) */}
          {isAuthenticated && !isAdmin && !isSeller && (
            <>
              <Link to="/cart" className="navbar-icon-link navbar-cart-link" title="Coșul meu">
                🛒
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
              <Link to="/orders" className="navbar-icon-link" title="Comenzile mele">
                📋
                {hasNewOrders && <span className="orders-badge" />}
              </Link>
            </>
          )}

          {/* Seller — panou produse + comenzi */}
          {isAuthenticated && (isAdmin || isSeller) && (
            <Link to="/seller" className="navbar-icon-link" title={isSeller ? 'Produsele Mele' : 'Produse'}>
              📦
            </Link>
          )}

          {/* Admin — gestionare utilizatori */}
          {isAuthenticated && isAdmin && (
            <Link to="/admin" className="navbar-icon-link" title="Administrare utilizatori">
              🛠️
            </Link>
          )}

          {/* Avatar utilizator + dropdown */}
          {isAuthenticated && (
            <div className="navbar-avatar-wrapper" ref={dropdownRef}>
              <button
                className="navbar-avatar"
                style={{ background: avatarColor }}
                onClick={() => setDropdownOpen((v) => !v)}
                title={username ?? 'Contul meu'}
                aria-label="Meniu cont"
              >
                {initial}
              </button>

              {dropdownOpen && (
                <div className="navbar-dropdown">
                  <div className="navbar-dropdown-header">
                    <span className="navbar-dropdown-avatar" style={{ background: avatarColor }}>
                      {initial}
                    </span>
                    <div>
                      <p className="navbar-dropdown-name">{username ?? '—'}</p>
                      <p className="navbar-dropdown-role">
                        {isAdmin ? '🛠️ Admin' : isSeller ? '🏪 Vânzător' : '👤 Client'}
                      </p>
                    </div>
                  </div>
                  <div className="navbar-dropdown-divider" />
                  <button className="navbar-dropdown-logout" onClick={handleLogout}>
                    🚪 Deconectare
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
