import { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import ProductForm from '../components/ProductForm';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/product.api';
import type { Product, CreateProductRequest, UpdateProductRequest } from '../types/product';
import { useAuth } from '../context/AuthContext';

const SellerPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const { isSeller } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch {
      setError('Eroare la încărcarea produselor.');
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

  return (
    <div className="page-container">
      <div className="admin-container">
        <div className="admin-header">
          <h1 className="admin-title">
            {isSeller ? '📦 Produsele Mele' : '📦 Gestionare Produse'}
          </h1>
          <p className="admin-subtitle">
            {isSeller ? 'Administrează catalogul tău de produse' : 'Administrează toate produsele'}
          </p>
          <button className="add-product-button" onClick={() => { setEditingProduct(undefined); setShowForm(true); }}>
            ➕ Adaugă Produs
          </button>
        </div>

        {successMessage && <div className="success-message">{successMessage}</div>}
        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Se încarcă produsele...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <p>Nu există produse. Adaugă primul produs!</p>
          </div>
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
      </div>
    </div>
  );
};

export default SellerPage;

