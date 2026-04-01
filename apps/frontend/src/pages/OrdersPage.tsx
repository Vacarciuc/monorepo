import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders } from '../api/order.api';
import type { Order } from '../types/order';

const STATUS_LABELS: Record<string, string> = {
  pending: '⏳ În așteptare',
  confirmed: '✅ Confirmată',
  rejected: '❌ Respinsă',
  processing: '🔄 În procesare',
  shipped: '🚚 Expediată',
  delivered: '📦 Livrată',
  cancelled: '🚫 Anulată',
};

const statusLabel = (status: string) =>
  STATUS_LABELS[status?.toLowerCase()] ?? status;

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .catch((e) => {
        if (e.response?.status === 401) navigate('/login');
        else setError('Eroare la încărcarea comenzilor.');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ro-RO', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const orderTotal = (order: Order) =>
    order.total ?? (order.items ?? []).reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div className="page-container">
      <div className="cart-container">
        <h1 className="cart-title">📋 Comenzile Mele</h1>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Se încarcă comenzile...</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <p>Nu ai plasat nicio comandă încă.</p>
            <button className="submit-button cart-shop-btn" onClick={() => navigate('/products')}>
              Vezi Produse
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div
                  className="order-card-header"
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="order-card-left">
                    <span className="order-id">#{order.id.slice(0, 8)}…</span>
                    <span className="order-date">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="order-card-right">
                    <span className={`order-status status-${order.status?.toLowerCase()}`}>
                      {statusLabel(order.status)}
                    </span>
                    <span className="order-total">{orderTotal(order).toFixed(2)} MDL</span>
                    <span className="order-chevron">{expanded === order.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {expanded === order.id && (
                  <div className="order-card-body">
                    {(order.items ?? []).length === 0 ? (
                      <p className="order-empty-items">Niciun produs în această comandă.</p>
                    ) : (
                      <table className="order-items-table">
                        <thead>
                          <tr>
                            <th>Produs</th>
                            <th>Preț / buc</th>
                            <th>Cantitate</th>
                            <th>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item) => (
                            <tr key={item.productId}>
                              <td>{item.name ?? item.productId}</td>
                              <td>{Number(item.price).toFixed(2)} MDL</td>
                              <td>{item.quantity}</td>
                              <td>{(item.price * item.quantity).toFixed(2)} MDL</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={3}><strong>Total</strong></td>
                            <td><strong>{orderTotal(order).toFixed(2)} MDL</strong></td>
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;

