import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductCard from '../../components/ProductCard';
import type { Product } from '../../types/product';

describe('ProductCard', () => {
  const mockProduct: Product = {
    id: '1',
    name: 'Test Product',
    price: 99.99,
    description: 'Test description',
    imagePath: '/uploads/test.jpg',
  };

  const mockOnBuy = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Customer View', () => {
    it('renders product information correctly', () => {
      render(<ProductCard product={mockProduct} onBuy={mockOnBuy} />);

      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('$99.99')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('renders product image with correct source', () => {
      render(<ProductCard product={mockProduct} onBuy={mockOnBuy} />);

      const image = screen.getByAltText('Test Product') as HTMLImageElement;
      expect(image).toBeInTheDocument();
      expect(image.src).toContain('/uploads/test.jpg');
    });

    it('renders product without description', () => {
      const productWithoutDesc = { ...mockProduct, description: undefined };
      render(<ProductCard product={productWithoutDesc} onBuy={mockOnBuy} />);

      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('$99.99')).toBeInTheDocument();
      expect(screen.queryByText('Test description')).not.toBeInTheDocument();
    });

    it('renders product without image path', () => {
      const productWithoutImage = { ...mockProduct, imagePath: undefined };
      render(<ProductCard product={productWithoutImage} onBuy={mockOnBuy} />);

      const image = screen.getByAltText('Test Product') as HTMLImageElement;
      expect(image).toBeInTheDocument();
      // Should use default image from unsplash
      expect(image.src).toContain('unsplash.com');
    });

    it('displays buy button when onBuy is provided', () => {
      render(<ProductCard product={mockProduct} onBuy={mockOnBuy} />);

      const buyButton = screen.getByRole('button', { name: /BUY/i });
      expect(buyButton).toBeInTheDocument();
    });

    it('calls onBuy with correct product id when buy button is clicked', () => {
      render(<ProductCard product={mockProduct} onBuy={mockOnBuy} />);

      const buyButton = screen.getByRole('button', { name: /BUY/i });
      fireEvent.click(buyButton);

      expect(mockOnBuy).toHaveBeenCalledWith('1');
      expect(mockOnBuy).toHaveBeenCalledTimes(1);
    });

    it('does not display buy button when onBuy is not provided', () => {
      render(<ProductCard product={mockProduct} />);

      const buyButton = screen.queryByRole('button', { name: /BUY/i });
      expect(buyButton).not.toBeInTheDocument();
    });

    it('formats price with two decimal places', () => {
      const productWithWholeNumber = { ...mockProduct, price: 100 };
      render(<ProductCard product={productWithWholeNumber} onBuy={mockOnBuy} />);

      expect(screen.getByText('$100.00')).toBeInTheDocument();
    });
  });

  describe('Admin View', () => {
    it('renders admin action buttons when isAdmin is true', () => {
      render(
        <ProductCard
          product={mockProduct}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isAdmin={true}
        />
      );

      expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /BUY/i })).not.toBeInTheDocument();
    });

    it('calls onEdit with product when edit button is clicked', () => {
      render(
        <ProductCard
          product={mockProduct}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isAdmin={true}
        />
      );

      const editButton = screen.getByRole('button', { name: /Edit/i });
      fireEvent.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(mockProduct);
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('calls onDelete with product id when delete button is clicked', () => {
      render(
        <ProductCard
          product={mockProduct}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isAdmin={true}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith('1');
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it('does not call onEdit when onEdit is not provided', () => {
      render(
        <ProductCard
          product={mockProduct}
          onDelete={mockOnDelete}
          isAdmin={true}
        />
      );

      const editButton = screen.getByRole('button', { name: /Edit/i });
      fireEvent.click(editButton);

      expect(mockOnEdit).not.toHaveBeenCalled();
    });

    it('does not call onDelete when onDelete is not provided', () => {
      render(
        <ProductCard
          product={mockProduct}
          onEdit={mockOnEdit}
          isAdmin={true}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      expect(mockOnDelete).not.toHaveBeenCalled();
    });
  });

  describe('Image Error Handling', () => {
    it('falls back to default image on image load error', () => {
      render(<ProductCard product={mockProduct} onBuy={mockOnBuy} />);

      const image = screen.getByAltText('Test Product') as HTMLImageElement;

      // Simulate image load error
      fireEvent.error(image);

      // Should fall back to default unsplash image
      expect(image.src).toContain('unsplash.com');
    });
  });
});


