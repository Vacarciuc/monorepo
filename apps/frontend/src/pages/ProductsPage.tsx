import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import QuantityModal from '../components/QuantityModal';
import { getProducts } from '../api/product.api';
import { addToCart } from '../api/cart.api';
import type { Product } from '../types/product';

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setProducts(await getProducts());
    } catch (err: any) {
      if (err.response?.status === 401) navigate('/login');
      else setError('Eroare la încărcarea produselor. Încearcă din nou.');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) setSelectedProduct(product);
  };

  const handleAddToCart = async (quantity: number) => {
    if (!selectedProduct) return;
    await addToCart(selectedProduct.id, quantity);
    setSelectedProduct(null);
    setSuccessMessage(`✅ "${selectedProduct.name}" a fost adăugat în coș!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="page-container">
      <div className="products-container">
        <h1 className="products-title">🌿 Produse Disponibile</h1>
        <p className="products-subtitle">Răsfoiește piața noastră sustenabilă</p>

        {successMessage && <div className="success-message">{successMessage}</div>}
        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Se încarcă produsele...</div>
        ) : products.length === 0 ? (
          <div className="empty-state"><p>Nu există produse disponibile momentan.</p></div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onBuy={handleBuy} />
            ))}
          </div>
        )}
      </div>

      {selectedProduct && (
        <QuantityModal
          product={selectedProduct}
          onConfirm={handleAddToCart}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default ProductsPage;
