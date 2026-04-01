import { useState, type FormEvent, type ChangeEvent } from 'react';
import type { Product, CreateProductRequest, UpdateProductRequest } from '../types/product';
import { getImageUrl } from '../api/product.api';

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: CreateProductRequest | UpdateProductRequest) => Promise<void>;
  onCancel: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ProductForm = ({ product, onSubmit, onCancel }: ProductFormProps) => {
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [quantity, setQuantity] = useState(product?.quantity?.toString() ?? '0');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(
    product?.imagePath ? getImageUrl(product.imagePath) : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError('');

    if (!file) {
      setImage(null);
      setImagePreview(product?.imagePath ? getImageUrl(product.imagePath) : '');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      e.target.value = '';
      return;
    }

    // Check file size (10MB max)
    if (file.size > MAX_FILE_SIZE) {
      setError(`Image size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      e.target.value = '';
      return;
    }

    setImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const productData: CreateProductRequest | UpdateProductRequest = {
        name,
        description: description || undefined,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10) || 0,
        image: image || undefined,
      };

      await onSubmit(productData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Eroare la salvarea produsului.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-form-overlay">
      <div className="product-form-container">
        <h2 className="product-form-title">
          {product ? '✏️ Editează Produsul' : '➕ Adaugă Produs Nou'}
        </h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Nume Produs *
            </label>
            <input
              id="name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex. Ceai Verde Organic"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Descriere
            </label>
            <textarea
              id="description"
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrierea produsului..."
              rows={4}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price" className="form-label">
                Preț (MDL) *
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
              <label htmlFor="quantity" className="form-label">
                Stoc (bucăți)
              </label>
              <input
                id="quantity"
                type="number"
                step="1"
                min="0"
                className="form-input"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="image" className="form-label">
              Imagine Produs (Max 10MB)
            </label>
            <input
              id="image"
              type="file"
              accept="image/*"
              className="form-input"
              onChange={handleImageChange}
            />
            <small className="form-hint">
              Formate acceptate: JPG, PNG, GIF, WebP (Dimensiune maximă: 10MB)
            </small>
            {imagePreview && (
              <div className="image-preview">
                <img
                  src={imagePreview}
                  alt="Previzualizare"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/150?text=Imagine+Invalidă';
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
              Anulează
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Se salvează...' : product ? 'Actualizează Produsul' : 'Adaugă Produsul'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;

