import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../api/product.api';
import { getCart, updateCartItem, removeCartItem, clearCart, checkout } from '../api/cart.api';
import type { Cart, CartItem } from '../types/cart';

const VAT_RATE = 0.19;         // 19 %
const SHIPPING_THRESHOLD = 100; // free shipping above this
const SHIPPING_COST = 9.99;

const CartPage = () => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const defaultImage =
    'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400&h=300&fit=crop';

  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      setCart(await getCart());
    } catch (e: any) {
      if (e.response?.status === 401) navigate('/login');
      else setError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { loadCart(); }, [loadCart]);

  const handleQuantityChange = async (item: CartItem, newQty: number) => {
    try {
      setError('');
      if (newQty === 0) {
        setCart(await removeCartItem(item.productId));
      } else {
        setCart(await updateCartItem(item.productId, newQty));
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Nu s-a putut actualiza produsul.');
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      setError('');
      setCart(await removeCartItem(productId));
    } catch {
      setError('Nu s-a putut elimina produsul.');
    }
  };

  const handleClear = async () => {
    if (!confirm('Golești tot coșul?')) return;
    try {
      setCart(await clearCart());
    } catch {
      setError('Nu s-a putut goli coșul.');
    }
  };

  const handleOrder = async () => {
    setOrderLoading(true);
    setError('');
    try {
      await checkout();
      setSuccess('🎉 Comanda a fost plasată cu succes! O vom procesa în curând.');
      setCart(await clearCart());
      setTimeout(() => setSuccess(''), 5000);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Nu s-a putut plasa comanda.');
    } finally {
      setOrderLoading(false);
    }
  };

  // ── derived totals ─────────────────────────────────────────────────────────
  const items = cart?.items ?? [];
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const vat = subtotal * VAT_RATE;
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : items.length > 0 ? SHIPPING_COST : 0;
  const total = subtotal + vat + shipping;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      <div className="cart-container">
        <h1 className="cart-title">🛒 Coșul Meu</h1>

        {success && <div className="success-message">{success}</div>}
        {error   && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Se încarcă coșul...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p>Coșul tău este gol.</p>
            <button className="submit-button cart-shop-btn" onClick={() => navigate('/products')}>
              Vezi Produse
            </button>
          </div>
        ) : (
          <div className="cart-layout">
            {/* ── Items list ─────────────────────────────────────────── */}
            <div className="cart-items">
              {items.map((item) => (
                <div key={item.productId} className="cart-item">
                  <img
                    src={getImageUrl(item.imagePath)}
                    alt={item.name}
                    className="cart-item-image"
                    onError={(e) => { e.currentTarget.src = defaultImage; }}
                  />
                  <div className="cart-item-details">
                    <p className="cart-item-name">{item.name}</p>
                    <p className="cart-item-unit-price">{item.price.toFixed(2)} RON / buc</p>
                  </div>
                  <div className="cart-item-qty">
                    <button className="qty-btn" onClick={() => handleQuantityChange(item, item.quantity - 1)}>−</button>
                    <span className="qty-display">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => handleQuantityChange(item, item.quantity + 1)}>+</button>
                  </div>
                  <p className="cart-item-subtotal">
                    {(item.price * item.quantity).toFixed(2)} RON
                  </p>
                  <button className="cart-remove-btn" title="Elimină" onClick={() => handleRemove(item.productId)}>✕</button>
                </div>
              ))}

              <button className="cart-clear-btn" onClick={handleClear}>
                🗑️ Golește coșul
              </button>
            </div>

            {/* ── Summary panel ──────────────────────────────────────── */}
            <div className="cart-summary">
              <h2 className="cart-summary-title">Sumar Comandă</h2>

              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span>{subtotal.toFixed(2)} RON</span>
              </div>
              <div className="cart-summary-row">
                <span>TVA (19%)</span>
                <span>{vat.toFixed(2)} RON</span>
              </div>
              <div className="cart-summary-row">
                <span>Transport</span>
                <span>
                  {shipping === 0
                    ? <span className="free-shipping">GRATUIT</span>
                    : `${shipping.toFixed(2)} RON`}
                </span>
              </div>
              {shipping > 0 && (
                <p className="shipping-hint">
                  Adaugă încă {(SHIPPING_THRESHOLD - subtotal).toFixed(2)} RON pentru transport gratuit
                </p>
              )}
              <div className="cart-summary-divider" />
              <div className="cart-summary-total">
                <span>Total</span>
                <span>{total.toFixed(2)} RON</span>
              </div>

              <button
                className="submit-button cart-order-btn"
                onClick={handleOrder}
                disabled={orderLoading || items.length === 0}
              >
                {orderLoading ? 'Se plasează comanda...' : '✅ Plasează Comanda'}
              </button>

              <button
                className="cancel-button cart-continue-btn"
                onClick={() => navigate('/products')}
              >
                ← Continuă Cumpărăturile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;

