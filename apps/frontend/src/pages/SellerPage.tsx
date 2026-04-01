import { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import ProductForm from '../components/ProductForm';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/product.api';
import {
  getSellerOrders,
  confirmSellerOrder,
  rejectSellerOrder,
} from '../api/seller-order.api';
import type { SellerOrder } from '../api/seller-order.api';
import type { Product, CreateProductRequest, UpdateProductRequest } from '../types/product';
import { useAuth } from '../context/AuthContext';

type Tab = 'produse' | 'comenzi';

const STATUS_LABELS: Record<SellerOrder['status'], string> = {
  PENDING: '⏳ În așteptare',
  CONFIRMED: '✅ Confirmată',
  REJECTED: '❌ Respinsă',
};

const SellerPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('produse');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  // Modal comenzi
  const [selectedOrder, setSelectedOrder] = useState<SellerOrder | null>(null);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const { isSeller } = useAuth();

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => { if (activeTab === 'comenzi') fetchOrders(); }, [activeTab]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setProducts(await getProducts());
    } catch {
      setError('Eroare la încărcarea produselor.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      setOrders(await getSellerOrders());
    } catch {
      setError('Eroare la încărcarea comenzilor.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Ești sigur că vrei să ștergi acest produs?')) return;
    try {
      setError('');
      await deleteProduct(productId);
      setSuccessMessage('Produsul a fost șters cu succes!');
      await fetchProducts();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Eroare la ștergerea produsului.');
    }
  };

  const handleFormSubmit = async (data: CreateProductRequest | UpdateProductRequest) => {
    try {
      setError('');
      if (editingProduct) {
        await updateProduct(editingProduct.id, data as UpdateProductRequest);
        setSuccessMessage('Produs actualizat cu succes! ✏️');
      } else {
        await createProduct(data as CreateProductRequest);
        setSuccessMessage('Produs adăugat cu succes! ✅');
      }
      setShowForm(false);
      setEditingProduct(undefined);
      await fetchProducts();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      throw err;
    }
  };

  const handleConfirmOrder = async (order: SellerOrder) => {
    setProcessingOrder(order.id);
    try {
      setError('');
      await confirmSellerOrder(order.id);
      setSuccessMessage(`✅ Comanda #${order.orderId.slice(0, 8)} a fost confirmată!`);
      setSelectedOrder(null);
      await fetchOrders();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Eroare la confirmarea comenzii.');
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleRejectOrder = async (order: SellerOrder) => {
    if (!confirm('Ești sigur că vrei să respingi această comandă?')) return;
    setProcessingOrder(order.id);
    try {
      setError('');
      await rejectSellerOrder(order.id);
      setSuccessMessage(`Comanda #${order.orderId.slice(0, 8)} a fost respinsă.`);
      setSelectedOrder(null);
      await fetchOrders();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Eroare la respingerea comenzii.');
    } finally {
      setProcessingOrder(null);
    }
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('ro-RO', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }) : '—';

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;

  return (
    <div className="page-container">
      <div className="admin-container">
        <div className="admin-header">
          <h1 className="admin-title">
            {isSeller ? '📦 Produsele Mele' : '📦 Gestionare Produse'}
          </h1>
          <p className="admin-subtitle">
            {isSeller ? 'Administrează catalogul și comenzile tale' : 'Administrează toate produsele și comenzile'}
          </p>
        </div>

        {/* Tab-uri */}
        <div className="seller-tabs">
          <button
            className={`seller-tab${activeTab === 'produse' ? ' seller-tab--active' : ''}`}
            onClick={() => setActiveTab('produse')}
          >
            🛍️ Produse
          </button>
          <button
            className={`seller-tab${activeTab === 'comenzi' ? ' seller-tab--active' : ''}`}
            onClick={() => setActiveTab('comenzi')}
          >
            📋 Comenzi
            {pendingCount > 0 && (
              <span className="cart-badge" style={{ marginLeft: 6 }}>{pendingCount}</span>
            )}
          </button>
        </div>

        {successMessage && <div className="success-message">{successMessage}</div>}
        {error && <div className="error-message">{error}</div>}

        {/* Tab: Produse */}
        {activeTab === 'produse' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button className="add-product-button" onClick={() => { setEditingProduct(undefined); setShowForm(true); }}>
                ➕ Adaugă Produs
              </button>
            </div>
            {loading ? (
              <div className="loading">Se încarcă produsele...</div>
            ) : products.length === 0 ? (
              <div className="empty-state"><p>Nu există produse. Adaugă primul produs!</p></div>
            ) : (
              <div className="products-grid">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isAdmin={true}
                    onEdit={(p) => { setEditingProduct(p); setShowForm(true); }}
                    onDelete={handleDeleteProduct}
                  />
                ))}
              </div>
            )}
            {showForm && (
              <ProductForm
                product={editingProduct}
                onSubmit={handleFormSubmit}
                onCancel={() => { setShowForm(false); setEditingProduct(undefined); }}
              />
            )}
          </>
        )}

        {/* Tab: Comenzi */}
        {activeTab === 'comenzi' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button className="add-product-button" onClick={fetchOrders}>🔄 Reîmprospătează</button>
            </div>
            {loading ? (
              <div className="loading">Se încarcă comenzile...</div>
            ) : orders.length === 0 ? (
              <div className="empty-state"><p>Nu există comenzi încă.</p></div>
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className={`order-card order-card--seller order-card--${order.status.toLowerCase()}`}
                    onClick={() => order.status === 'PENDING' && setSelectedOrder(order)}
                    style={{ cursor: order.status === 'PENDING' ? 'pointer' : 'default' }}
                  >
                    <div className="order-card-header">
                      <div className="order-card-left">
                        <span className="order-id">#{order.orderId.slice(0, 8)}</span>
                        <span className="order-date">{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="order-card-right">
                        <span className={`order-status status-${order.status.toLowerCase()}`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                        <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                          {order.orderItems.length} produs{order.orderItems.length !== 1 ? 'e' : ''}
                        </span>
                        {order.status === 'PENDING' && (
                          <span className="seller-order-action-hint">👆 Click pentru acțiuni</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal detalii comandă + acțiuni */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">📋 Comandă #{selectedOrder.orderId.slice(0, 8)}</h2>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>

            <div className="modal-body">
              <p className="modal-meta">
                <strong>Primit la:</strong> {formatDate(selectedOrder.createdAt)}
              </p>
              <p className="modal-meta">
                <strong>Status:</strong>{' '}
                <span className={`order-status status-${selectedOrder.status.toLowerCase()}`}>
                  {STATUS_LABELS[selectedOrder.status]}
                </span>
              </p>

              <h3 className="modal-section-title">Produse comandate</h3>
              <table className="order-items-table">
                <thead>
                  <tr>
                    <th>Produs ID</th>
                    <th>Cantitate</th>
                    <th>Preț</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.orderItems.map((item, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: '0.8rem', opacity: 0.7 }}>{item.productId.slice(0, 12)}…</td>
                      <td>{item.quantity}</td>
                      <td>{item.price.toFixed(2)} RON</td>
                      <td>{(item.price * item.quantity).toFixed(2)} RON</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3}><strong>Total</strong></td>
                    <td>
                      <strong>
                        {selectedOrder.orderItems.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)} RON
                      </strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {selectedOrder.status === 'PENDING' && (
              <div className="modal-footer">
                <button
                  className="add-product-button"
                  disabled={processingOrder === selectedOrder.id}
                  onClick={() => handleConfirmOrder(selectedOrder)}
                >
                  ✅ Confirmă Comanda
                </button>
                <button
                  className="delete-button"
                  disabled={processingOrder === selectedOrder.id}
                  onClick={() => handleRejectOrder(selectedOrder)}
                >
                  ❌ Respinge Comanda
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerPage;

