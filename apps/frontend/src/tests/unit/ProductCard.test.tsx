import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductCard from '../../components/ProductCard';
import type { Product } from '../../types/product';

// Mock the product API module
vi.mock('../../api/product.api', () => ({
  getImageUrl: (path?: string) =>
    path ? `http://localhost:3003${path}` : 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400&h=300&fit=crop',
}));

const baseProduct: Product = {
  id: 'p-1',
  name: 'Organic Green Tea',
  description: 'Rich in antioxidants.',
  price: 24.99,
  quantity: 150,
  imagePath: '/uploads/products/tea.jpg',
  sellerId: '00000000-0000-0000-0000-000000000001',
};

describe('ProductCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('renders product name', () => {
      render(<ProductCard product={baseProduct} />);
      expect(screen.getByText('Organic Green Tea')).toBeInTheDocument();
    });

    it('renders product price formatted to 2 decimal places', () => {
      render(<ProductCard product={baseProduct} />);
      expect(screen.getByText('$24.99')).toBeInTheDocument();
    });

    it('renders product description', () => {
      render(<ProductCard product={baseProduct} />);
      expect(screen.getByText('Rich in antioxidants.')).toBeInTheDocument();
    });

    it('does not render description when missing', () => {
      const product = { ...baseProduct, description: undefined };
      render(<ProductCard product={product} />);
      expect(screen.queryByText('Rich in antioxidants.')).not.toBeInTheDocument();
    });

    it('renders product image with correct alt text', () => {
      render(<ProductCard product={baseProduct} />);
      const img = screen.getByAltText('Organic Green Tea') as HTMLImageElement;
      expect(img).toBeInTheDocument();
    });

    it('shows skeleton while image is loading', () => {
      const { container } = render(<ProductCard product={baseProduct} />);
      expect(container.querySelector('.product-image-skeleton')).toBeInTheDocument();
    });

    it('hides skeleton after image loads', () => {
      const { container } = render(<ProductCard product={baseProduct} />);
      const img = screen.getByAltText('Organic Green Tea') as HTMLImageElement;
      fireEvent.load(img);
      expect(container.querySelector('.product-image-skeleton')).not.toBeInTheDocument();
    });
  });

  describe('Stock / Quantity display', () => {
    it('shows in-stock message when quantity > 0', () => {
      render(<ProductCard product={baseProduct} />);
      expect(screen.getByText(/150 units in stock/i)).toBeInTheDocument();
    });

    it('shows out-of-stock message when quantity is 0', () => {
      const product = { ...baseProduct, quantity: 0 };
      render(<ProductCard product={product} />);
      // Both the badge and the paragraph contain "out of stock" text
      const elements = screen.getAllByText(/out of stock/i);
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it('shows out-of-stock badge overlay when quantity is 0', () => {
      const product = { ...baseProduct, quantity: 0 };
      render(<ProductCard product={product} />);
      const badge = screen.getByText('Out of Stock');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('out-of-stock-badge');
    });

    it('does not show out-of-stock badge when in stock', () => {
      const { container } = render(<ProductCard product={baseProduct} />);
      expect(container.querySelector('.out-of-stock-badge')).toBeNull();
    });
  });

  describe('Customer view (buy button)', () => {
    it('renders buy button in customer mode', () => {
      const onBuy = vi.fn();
      render(<ProductCard product={baseProduct} onBuy={onBuy} />);
      expect(screen.getByRole('button', { name: /BUY/i })).toBeInTheDocument();
    });

    it('buy button is enabled when in stock', () => {
      const onBuy = vi.fn();
      render(<ProductCard product={baseProduct} onBuy={onBuy} />);
      expect(screen.getByRole('button', { name: /BUY/i })).not.toBeDisabled();
    });

    it('buy button is disabled when out of stock', () => {
      const onBuy = vi.fn();
      const product = { ...baseProduct, quantity: 0 };
      render(<ProductCard product={product} onBuy={onBuy} />);
      expect(screen.getByRole('button', { name: /BUY/i })).toBeDisabled();
    });

    it('calls onBuy with product id when buy button clicked', () => {
      const onBuy = vi.fn();
      render(<ProductCard product={baseProduct} onBuy={onBuy} />);
      fireEvent.click(screen.getByRole('button', { name: /BUY/i }));
      expect(onBuy).toHaveBeenCalledWith('p-1');
    });

    it('does not render buy button when onBuy is not provided', () => {
      render(<ProductCard product={baseProduct} />);
      expect(screen.queryByRole('button', { name: /BUY/i })).not.toBeInTheDocument();
    });
  });

  describe('Admin view', () => {
    it('renders edit and delete buttons in admin mode', () => {
      render(<ProductCard product={baseProduct} isAdmin onEdit={vi.fn()} onDelete={vi.fn()} />);
      expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
    });

    it('does not render buy button in admin mode', () => {
      render(<ProductCard product={baseProduct} isAdmin onEdit={vi.fn()} onDelete={vi.fn()} />);
      expect(screen.queryByRole('button', { name: /BUY/i })).not.toBeInTheDocument();
    });

    it('calls onEdit with full product object when edit clicked', () => {
      const onEdit = vi.fn();
      render(<ProductCard product={baseProduct} isAdmin onEdit={onEdit} onDelete={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: /Edit/i }));
      expect(onEdit).toHaveBeenCalledWith(baseProduct);
    });

    it('calls onDelete with product id when delete clicked', () => {
      const onDelete = vi.fn();
      render(<ProductCard product={baseProduct} isAdmin onEdit={vi.fn()} onDelete={onDelete} />);
      fireEvent.click(screen.getByRole('button', { name: /Delete/i }));
      expect(onDelete).toHaveBeenCalledWith('p-1');
    });
  });
});



