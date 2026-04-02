import { useState } from 'react';
import type { Product } from '../types/product';
import { getImageUrl } from '../api/product.api';

interface QuantityModalProps {
  product: Product;
  onConfirm: (quantity: number) => Promise<void>;
  onClose: () => void;
}

const QuantityModal = ({ product, onConfirm, onClose }: QuantityModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const max = product.quantity;

  const handleConfirm = async () => {
    if (quantity < 1 || quantity > max) return;
    setLoading(true);
    setError('');
    try {
      await onConfirm(quantity);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Nu s-a putut adăuga în coș.');
      setLoading(false);
    }
  };

  const defaultImage =
    'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400&h=300&fit=crop';

  return (
    <div className="qty-modal-overlay" onClick={onClose}>
      <div className="qty-modal" onClick={(e) => e.stopPropagation()}>
        {/* Product preview */}
        <div className="qty-modal-product">
          <img
            src={getImageUrl(product.imagePath)}
            alt={product.name}
            className="qty-modal-image"
            onError={(e) => { e.currentTarget.src = defaultImage; }}
          />
          <div className="qty-modal-info">
            <h3 className="qty-modal-name">{product.name}</h3>
            <p className="qty-modal-price">{Number(product.price).toFixed(2)} MDL / buc</p>
            <p className="qty-modal-stock">📦 {max} în stoc</p>
          </div>
        </div>

        <h2 className="qty-modal-title">Câte bucăți dorești?</h2>

        {error && <div className="error-message">{error}</div>}

        {/* Quantity picker */}
        <div className="qty-picker">
          <button
            className="qty-btn"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1 || loading}
          >
            −
          </button>
          <input
            type="number"
            className="qty-input"
            value={quantity}
            min={1}
            max={max}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v)) setQuantity(Math.min(max, Math.max(1, v)));
            }}
          />
          <button
            className="qty-btn"
            onClick={() => setQuantity((q) => Math.min(max, q + 1))}
            disabled={quantity >= max || loading}
          >
            +
          </button>
        </div>

        <p className="qty-subtotal">
          Subtotal: <strong>{(Number(product.price) * quantity).toFixed(2)} MDL</strong>
        </p>

        {/* Actions */}
        <div className="form-actions">
          <button className="cancel-button" onClick={onClose} disabled={loading}>
            Anulează
          </button>
          <button className="submit-button" onClick={handleConfirm} disabled={loading || quantity < 1 || quantity > max}>
            {loading ? 'Se adaugă...' : '🛒 Adaugă în Coș'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuantityModal;

