import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ProductForm from '../../components/ProductForm';
import type { Product } from '../../types/product';

describe('ProductForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Product Mode', () => {
    it('renders form with empty fields', () => {
      render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText(/Add New Product/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Product Name/i)).toHaveValue('');
      expect(screen.getByLabelText(/Description/i)).toHaveValue('');
      expect(screen.getByLabelText(/Price/i)).toHaveValue(null);
    });

    it('renders all form fields', () => {
      render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByLabelText(/Product Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Price/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Product Image/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add Product/i })).toBeInTheDocument();
    });

    it('updates form fields when user types', () => {
      render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/Product Name/i) as HTMLInputElement;
      const descInput = screen.getByLabelText(/Description/i) as HTMLTextAreaElement;
      const priceInput = screen.getByLabelText(/Price/i) as HTMLInputElement;

      fireEvent.change(nameInput, { target: { value: 'New Product' } });
      fireEvent.change(descInput, { target: { value: 'Product description' } });
      fireEvent.change(priceInput, { target: { value: '29.99' } });

      expect(nameInput.value).toBe('New Product');
      expect(descInput.value).toBe('Product description');
      expect(priceInput.value).toBe('29.99');
    });

    it('calls onSubmit with form data when submitted', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fireEvent.change(screen.getByLabelText(/Product Name/i), { target: { value: 'New Product' } });
      fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Product description' } });
      fireEvent.change(screen.getByLabelText(/Price/i), { target: { value: '29.99' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Add Product/i }));
      });

      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'New Product',
        description: 'Product description',
        price: 29.99,
        image: undefined,
      });
    });

    it('calls onCancel when cancel button is clicked', () => {
      render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edit Product Mode', () => {
    const existingProduct: Product = {
      id: '1',
      name: 'Existing Product',
      description: 'Existing description',
      price: 99.99,
      imagePath: '/uploads/product.jpg',
    };

    it('renders form with existing product data', () => {
      render(<ProductForm product={existingProduct} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText(/Edit Product/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Product Name/i)).toHaveValue('Existing Product');
      expect(screen.getByLabelText(/Description/i)).toHaveValue('Existing description');
      expect(screen.getByLabelText(/Price/i)).toHaveValue(99.99);
    });

    it('displays update button instead of add button', () => {
      render(<ProductForm product={existingProduct} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByRole('button', { name: /Update Product/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Add Product/i })).not.toBeInTheDocument();
    });

    it('calls onSubmit with updated data', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      render(<ProductForm product={existingProduct} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fireEvent.change(screen.getByLabelText(/Product Name/i), { target: { value: 'Updated Product' } });
      fireEvent.change(screen.getByLabelText(/Price/i), { target: { value: '149.99' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Update Product/i }));
      });

      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Updated Product',
        description: 'Existing description',
        price: 149.99,
        image: undefined,
      });
    });

    it('displays existing image preview', () => {
      render(<ProductForm product={existingProduct} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const imagePreview = screen.getByAltText('Preview') as HTMLImageElement;
      expect(imagePreview).toBeInTheDocument();
      expect(imagePreview.src).toContain('/uploads/product.jpg');
    });
  });

  describe('Image Upload', () => {
    it('displays error when non-image file is selected', () => {
      render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByLabelText(/Product Image/i) as HTMLInputElement;

      Object.defineProperty(input, 'files', { value: [file], writable: false });
      fireEvent.change(input);

      expect(screen.getByText(/Please select a valid image file/i)).toBeInTheDocument();
    });

    it('displays error when file is too large', () => {
      render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const largeFile = new File(['x'], 'large.png', { type: 'image/png' });
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024, writable: false });

      const input = screen.getByLabelText(/Product Image/i) as HTMLInputElement;
      Object.defineProperty(input, 'files', { value: [largeFile], writable: false });
      fireEvent.change(input);

      expect(screen.getByText(/Image size must be less than/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message on submission failure', async () => {
      mockOnSubmit.mockRejectedValue({
        response: { data: { message: 'Failed to save product' } },
      });

      render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fireEvent.change(screen.getByLabelText(/Product Name/i), { target: { value: 'Test' } });
      fireEvent.change(screen.getByLabelText(/Price/i), { target: { value: '10' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Add Product/i }));
      });

      expect(screen.getByText(/Failed to save product/i)).toBeInTheDocument();
    });

    it('displays generic error on failure without custom message', async () => {
      mockOnSubmit.mockRejectedValue(new Error('Network error'));

      render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fireEvent.change(screen.getByLabelText(/Product Name/i), { target: { value: 'Test' } });
      fireEvent.change(screen.getByLabelText(/Price/i), { target: { value: '10' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Add Product/i }));
      });

      expect(screen.getByText(/Failed to save product/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('requires product name', () => {
      render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      expect(screen.getByLabelText(/Product Name/i)).toBeRequired();
    });

    it('requires price', () => {
      render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      expect(screen.getByLabelText(/Price/i)).toBeRequired();
    });

    it('does not require description', () => {
      render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      expect(screen.getByLabelText(/Description/i)).not.toBeRequired();
    });

    it('accepts price with decimal values', () => {
      render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      const priceInput = screen.getByLabelText(/Price/i);
      expect(priceInput).toHaveAttribute('step', '0.01');
      expect(priceInput).toHaveAttribute('type', 'number');
    });
  });
});

