import { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import ProductForm from '../components/ProductForm';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/product.api';
import type { Product, CreateProductRequest, UpdateProductRequest } from '../types/product';

const AdminPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (err: any) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(undefined);
    setShowForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      setError('');
      await deleteProduct(productId);
      setSuccessMessage('Product deleted successfully! 🗑️');
      await fetchProducts();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleFormSubmit = async (data: CreateProductRequest | UpdateProductRequest) => {
    try {
      setError('');

      if (editingProduct) {
        await updateProduct(editingProduct.id, data as UpdateProductRequest);
        setSuccessMessage('Product updated successfully! ✏️');
      } else {
        await createProduct(data as CreateProductRequest);
        setSuccessMessage('Product added successfully! ✅');
      }

      setShowForm(false);
      setEditingProduct(undefined);
      await fetchProducts();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      throw err; // Let the form handle the error
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProduct(undefined);
  };

  return (
    <div className="page-container">
      <div className="admin-container">
        <div className="admin-header">
          <h1 className="admin-title">🛠️ Admin Panel</h1>
          <p className="admin-subtitle">Manage your products</p>
          <button className="add-product-button" onClick={handleAddProduct}>
            ➕ Add New Product
          </button>
        </div>

        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <p>No products yet. Add your first product!</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isAdmin={true}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
              />
            ))}
          </div>
        )}

        {showForm && (
          <ProductForm
            product={editingProduct}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        )}
      </div>
    </div>
  );
};

export default AdminPage;

