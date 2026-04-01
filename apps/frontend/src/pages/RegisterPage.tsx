import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, register, login } = useAuth();

  // Already logged in → go straight to products
  if (isAuthenticated) {
    return <Navigate to="/products" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Parolele nu se potrivesc.');
      return;
    }
    if (password.length < 8) {
      setError('Parola trebuie să aibă cel puțin 8 caractere.');
      return;
    }

    setLoading(true);
    try {
      await register({ email, username, password });
      // Auto-login after successful registration
      await login({ email, password });
      navigate('/products');
    } catch (err: any) {
      const data = err.response?.data;
      const msg =
        err.response?.status === 409
          ? 'Un cont cu acest email există deja.'
          : Array.isArray(data?.message)
            ? data.message.join(', ')
            : data?.message || 'Înregistrare eșuată. Încearcă din nou.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">🌿 Alătură-te GreenMarket</h1>
          <p className="auth-subtitle">Creează-ți contul</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                id="email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplu.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="username" className="form-label">Nume utilizator</label>
              <input
                id="username"
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="nume_utilizator"
                required
                minLength={3}
                maxLength={30}
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Parolă</label>
              <input
                id="password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirmă Parola</label>
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Se creează contul...' : 'Înregistrare'}
            </button>
          </form>

          <p className="auth-footer">
            Ai deja cont?{' '}
            <Link to="/login" className="auth-link">Conectează-te aici</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
