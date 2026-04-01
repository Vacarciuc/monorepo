import { useState } from 'react';
import type { Product } from '../types/product';
import { getImageUrl } from '../api/product.api';

interface ProductCardProps {
  product: Product;
  onBuy?: (productId: string) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
  isAdmin?: boolean;
}

const ProductCard = ({ product, onBuy, onEdit, onDelete, isAdmin = false }: ProductCardProps) => {
  const defaultImage =
    'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400&h=300&fit=crop';
  const inStock = product.quantity > 0;
  const hasImage = !!product.imagePath;
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div className="product-card">
      <div className="product-image-container">
        {/* Skeleton shown while the real image is loading */}
        {!imgLoaded && (
          <div className="product-image-skeleton" aria-label="Loading image…" />
        )}
        <img
          src={getImageUrl(product.imagePath)}
          alt={product.name}
          className={`product-image${imgLoaded ? ' loaded' : ''}`}
          style={imgLoaded ? undefined : { opacity: 0, position: 'absolute' }}
          onLoad={() => setImgLoaded(true)}
          onError={(e) => {
            e.currentTarget.src = defaultImage;
            setImgLoaded(true);
          }}
        />
        {!inStock && (
          <div className="out-of-stock-badge">Stoc Epuizat</div>
        )}
        {!hasImage && imgLoaded && (
          <div className="no-photo-badge">📷 Fără foto</div>
        )}
      </div>

      <div className="product-card-header">
        <h3 className="product-name">{product.name}</h3>
      </div>

      <div className="product-card-body">
        {product.description && (
          <p className="product-description">{product.description}</p>
        )}
        <p className="product-price">${Number(product.price).toFixed(2)}</p>
        <p className={`product-stock ${inStock ? 'in-stock' : 'no-stock'}`}>
          {inStock ? `📦 ${product.quantity} buc în stoc` : '❌ Stoc epuizat'}
        </p>
      </div>

      <div className="product-card-footer">
        {isAdmin ? (
          <div className="admin-actions">
            <button className="edit-button" onClick={() => onEdit?.(product)}>
              ✏️ Editează
            </button>
            <button className="delete-button" onClick={() => onDelete?.(product.id)}>
              🗑️ Șterge
            </button>
          </div>
        ) : (
          onBuy && (
            <button
              className="buy-button"
              onClick={() => onBuy(product.id)}
              disabled={!inStock}
            >
              🛒 CUMPĂRĂ
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default ProductCard;
