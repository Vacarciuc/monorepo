import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductCard from '../../components/ProductCard';
import type { Product } from '../../types/product';

describe('ProductCard', () => {
  const mockProduct: Product = {
    id: '1',
    name: 'Test Product',
    price: 99.99,
    description: 'Test description',
  };

  const mockOnBuy = vi.fn();

  it('renders product information', () => {
    render(<ProductCard product={mockProduct} onBuy={mockOnBuy} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('renders product without description', () => {
    const productWithoutDesc = { ...mockProduct, description: undefined };
    render(<ProductCard product={productWithoutDesc} onBuy={mockOnBuy} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.queryByText('Test description')).not.toBeInTheDocument();
  });

  it('calls onBuy when button is clicked', () => {
    render(<ProductCard product={mockProduct} onBuy={mockOnBuy} />);

    const buyButton = screen.getByRole('button', { name: /BUY/i });
    fireEvent.click(buyButton);

    expect(mockOnBuy).toHaveBeenCalledWith('1');
  });
});


