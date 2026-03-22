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
  const defaultImage = 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400&h=300&fit=crop';
  const inStock = product.quantity > 0;

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img
          src={getImageUrl(product.imagePath)}
          alt={product.name}
          className="product-image"
          onError={(e) => {
            e.currentTarget.src = defaultImage;
          }}
        />
        {!inStock && <div className="out-of-stock-badge">Out of Stock</div>}
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
          {inStock ? `📦 ${product.quantity} units in stock` : '❌ Out of stock'}
        </p>
      </div>
      <div className="product-card-footer">
        {isAdmin ? (
          <div className="admin-actions">
            <button
              className="edit-button"
              onClick={() => onEdit?.(product)}
            >
              ✏️ Edit
            </button>
            <button
              className="delete-button"
              onClick={() => onDelete?.(product.id)}
            >
              🗑️ Delete
            </button>
          </div>
        ) : (
          onBuy && (
            <button
              className="buy-button"
              onClick={() => onBuy(product.id)}
              disabled={!inStock}
            >
              🛒 BUY
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default ProductCard;




