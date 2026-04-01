import { useState, useEffect } from 'react';
import { getUsers, deleteUser, updateUserRole } from '../api/user.api';
import type { User, UserRole } from '../types/user';

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: '🛠️ Admin',
  SELLER: '🏪 Vânzător',
  CUSTOMER: '👤 Client',
};

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'CUSTOMER', label: '👤 Client' },
  { value: 'SELLER', label: '🏪 Vânzător' },
  { value: 'ADMIN', label: '🛠️ Admin' },
];

const AdminPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [changingRole, setChangingRole] = useState<number | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      setUsers(await getUsers());
    } catch {
      setError('Eroare la încărcarea utilizatorilor.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Ești sigur că vrei să ștergi utilizatorul "${user.username}" (${user.email})?`)) return;
    try {
      setError('');
      await deleteUser(user.id);
      setSuccess(`Utilizatorul "${user.username}" a fost șters.`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Eroare la ștergerea utilizatorului.');
    }
  };

  const handleRoleChange = async (user: User, newRole: UserRole) => {
    if (newRole === user.role) return;
    setChangingRole(user.id);
    try {
      setError('');
      const updated = await updateUserRole(user.id, newRole);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setSuccess(`Rolul lui "${user.username}" a fost schimbat în ${ROLE_LABELS[newRole]}. ✅`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Eroare la schimbarea rolului.');
    } finally {
      setChangingRole(null);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ro-RO', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  return (
    <div className="page-container">
      <div className="admin-container">
        <div className="admin-header">
          <h1 className="admin-title">🛠️ Panou Administrare</h1>
          <p className="admin-subtitle">Gestionează utilizatorii platformei</p>
          <button className="add-product-button" onClick={fetchUsers}>
            🔄 Reîmprospătează
          </button>
        </div>

        {success && <div className="success-message">{success}</div>}
        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Se încarcă utilizatorii...</div>
        ) : users.length === 0 ? (
          <div className="empty-state"><p>Nu există utilizatori înregistrați.</p></div>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Utilizator</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Înregistrat</th>
                  <th>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="users-table-row">
                    <td className="users-td-id">#{user.id}</td>
                    <td className="users-td-name">
                      <span className="users-avatar">
                        {user.username?.charAt(0).toUpperCase() ?? '?'}
                      </span>
                      {user.username}
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        className={`role-select role-${user.role.toLowerCase()}`}
                        value={user.role}
                        disabled={changingRole === user.id}
                        onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteUser(user)}
                        title="Șterge utilizator"
                      >
                        Șterge
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="users-count">Total: {users.length} utilizator{users.length !== 1 ? 'i' : ''}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
