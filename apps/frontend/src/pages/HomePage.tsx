import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { isAdmin, isSeller } = useAuth();

  return (
    <div className="page-container">
      <div className="home-container">
        <div className="home-hero">
          <h1 className="home-title">🌿 Bine ai venit la GreenMarket</h1>
          <p className="home-description">
            Piața ta sustenabilă pentru produse de calitate
          </p>

          <div className="home-actions">
            <Link to="/products" className="home-button primary">
              Vezi Produse
            </Link>
            {(isAdmin || isSeller) && (
              <Link to="/seller" className="home-button secondary">
                📦 Produsele Mele
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" className="home-button secondary">
                🛠️ Administrare Utilizatori
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

