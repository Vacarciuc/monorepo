import { useState } from 'react';
import { Link } from 'react-router-dom';
import { roleService } from '../services/role.service';

const RoleSelector = () => {
  const [selectedRole, setSelectedRole] = useState(roleService.getRole() || 'CUSTOMER');

  const handleRoleChange = (role: 'CUSTOMER' | 'ADMIN') => {
    setSelectedRole(role);
    roleService.saveRole(role);
    window.location.reload(); // Refresh to update navbar
  };

  return (
    <div className="role-selector">
      <h3>🔧 Testing Mode - Select Your Role:</h3>
      <div className="role-buttons">
        <button
          className={`role-button ${selectedRole === 'CUSTOMER' ? 'active' : ''}`}
          onClick={() => handleRoleChange('CUSTOMER')}
        >
          👤 Customer
        </button>
        <button
          className={`role-button ${selectedRole === 'ADMIN' ? 'active' : ''}`}
          onClick={() => handleRoleChange('ADMIN')}
        >
          🛠️ Admin
        </button>
      </div>
    </div>
  );
};

const HomePage = () => {
  return (
    <div className="page-container">
      <div className="home-container">
        <div className="home-hero">
          <h1 className="home-title">🌿 Welcome to GreenMarket</h1>
          <p className="home-description">
            Your sustainable marketplace for quality products
          </p>

          <RoleSelector />

          <div className="home-actions">
            <Link to="/products" className="home-button primary">
              Browse Products
            </Link>
            <Link to="/admin" className="home-button secondary">
              Admin Panel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

