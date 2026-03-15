import { useState, type FormEvent } from 'react';
import type { Product, CreateProductRequest, UpdateProductRequest } from '../types/product';

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: CreateProductRequest | UpdateProductRequest) => Promise<void>;
  onCancel: () => void;
}

const ProductForm = ({ product, onSubmit, onCancel }: ProductFormProps) => {
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const productData = {
        name,
        description: description || undefined,
        price: parseFloat(price),
        imageUrl: imageUrl || undefined,
      };

      await onSubmit(productData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-form-overlay">
      <div className="product-form-container">
        <h2 className="product-form-title">
          {product ? '✏️ Edit Product' : '➕ Add New Product'}
        </h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Product Name *
            </label>
            <input
              id="name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Organic Green Tea"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Product description..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="price" className="form-label">
              Price ($) *
            </label>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="imageUrl" className="form-label">
              Image URL
            </label>
            <input
              id="imageUrl"
              type="url"
              className="form-input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            {imageUrl && (
              <div className="image-preview">
                <img
                  src={imageUrl}
                  alt="Preview"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/150?text=Invalid+URL';
                  }}
                />
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;

