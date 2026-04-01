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
      setSuccessMessage('Produsul a fost șters cu succes! 🗑️');
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
      setSuccessMessage(`Comanda #${order.orderId.slice(0, 8)} a fost confirmată! ✅`);
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
      await fetchOrders();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Eroare la respingerea comenzii.');
    } finally {
      setProcessingOrder(null);
    }
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

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
              <div className="users-table-wrapper">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Comandă</th>
                      <th>Produse</th>
                      <th>Status</th>
                      <th>Primit la</th>
                      <th>Procesat la</th>
                      <th>Acțiuni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="users-table-row">
                        <td className="users-td-id">#{order.orderId.slice(0, 8)}</td>
                        <td>
                          {order.orderItems.map((item, i) => (
                            <div key={i} style={{ fontSize: '0.85rem' }}>
                              {item.quantity}× <span style={{ opacity: 0.7 }}>{item.productId.slice(0, 8)}</span> — {(item.price * item.quantity).toFixed(2)} RON
                            </div>
                          ))}
                        </td>
                        <td>
                          <span className={`role-select role-${order.status.toLowerCase()}`} style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '0.8rem' }}>
                            {STATUS_LABELS[order.status]}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{formatDate(order.createdAt)}</td>
                        <td style={{ fontSize: '0.85rem' }}>{formatDate(order.processedAt)}</td>
                        <td>
                          {order.status === 'PENDING' && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                className="add-product-button"
                                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                disabled={processingOrder === order.id}
                                onClick={() => handleConfirmOrder(order)}
                              >
                                ✅ Confirmă
                              </button>
                              <button
                                className="delete-button"
                                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                disabled={processingOrder === order.id}
                                onClick={() => handleRejectOrder(order)}
                              >
                                ❌ Respinge
                              </button>
                            </div>
                          )}
                          {order.status !== 'PENDING' && <span style={{ opacity: 0.5 }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="users-count">Total: {orders.length} comandă/comenzi</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SellerPage;

