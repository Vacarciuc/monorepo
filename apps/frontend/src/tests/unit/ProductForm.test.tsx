import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

      const nameInput = screen.getByLabelText(/Product Name/i);
      const descInput = screen.getByLabelText(/Description/i);
      const priceInput = screen.getByLabelText(/Price/i);
      const submitButton = screen.getByRole('button', { name: /Add Product/i });

      fireEvent.change(nameInput, { target: { value: 'New Product' } });
      fireEvent.change(descInput, { target: { value: 'Product description' } });
      fireEvent.change(priceInput, { target: { value: '29.99' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'New Product',
          description: 'Product description',
          price: 29.99,
          image: undefined,
        });
      });
    });

    it('calls onCancel when cancel button is clicked', () => {
      render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

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

      const nameInput = screen.getByLabelText(/Product Name/i);
      const priceInput = screen.getByLabelText(/Price/i);
      const submitButton = screen.getByRole('button', { name: /Update Product/i });

      fireEvent.change(nameInput, { target: { value: 'Updated Product' } });
      fireEvent.change(priceInput, { target: { value: '149.99' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Updated Product',
          description: 'Existing description',
          price: 149.99,
          image: undefined,
        });
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
    it('displays image preview when valid image is selected', async () => {
      render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
      const input = screen.getByLabelText(/Product Image/i);

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        const imagePreview = screen.getByAltText('Preview');
        expect(imagePreview).toBeInTheDocument();
      });
    });

    it('displays error when non-image file is selected', () => {
      render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByLabelText(/Product Image/i) as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      expect(screen.getByText(/Please select a valid image file/i)).toBeInTheDocument();
    });

    it('displays error when file is too large', () => {
      render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.png', { type: 'image/png' });
      Object.defineProperty(largeFile, 'size', {
        value: 11 * 1024 * 1024,
        writable: false,
      });

      const input = screen.getByLabelText(/Product Image/i) as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [largeFile],
        writable: false,
      });

      fireEvent.change(input);

      expect(screen.getByText(/Image size must be less than/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('displays loading state during submission', async () => {
      mockOnSubmit.mockImplementation(() => {
        return new Promise((resolve) => setTimeout(resolve, 100));
      });

      render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/Product Name/i);
      const priceInput = screen.getByLabelText(/Price/i);
      const submitButton = screen.getByRole('button', { name: /Add Product/i });

      fireEvent.change(nameInput, { target: { value: 'Test' } });
      fireEvent.change(priceInput, { target: { value: '10' } });
      fireEvent.click(submitButton);

      expect(screen.getByText(/Saving.../i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('disables cancel button during submission', async () => {
      mockOnSubmit.mockImplementation(() => {
        return new Promise((resolve) => setTimeout(resolve, 100));
      });

      render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/Product Name/i);
      const priceInput = screen.getByLabelText(/Price/i);
      const submitButton = screen.getByRole('button', { name: /Add Product/i });
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });

      fireEvent.change(nameInput, { target: { value: 'Test' } });
      fireEvent.change(priceInput, { target: { value: '10' } });
      fireEvent.click(submitButton);

      expect(cancelButton).toBeDisabled();

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message on submission failure', async () => {
      mockOnSubmit.mockRejectedValue({
        response: { data: { message: 'Failed to save product' } },
      });

      render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/Product Name/i);
      const priceInput = screen.getByLabelText(/Price/i);
      const submitButton = screen.getByRole('button', { name: /Add Product/i });

      fireEvent.change(nameInput, { target: { value: 'Test' } });
      fireEvent.change(priceInput, { target: { value: '10' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to save product/i)).toBeInTheDocument();
      });
    });

    it('displays generic error message on submission failure without custom message', async () => {
      mockOnSubmit.mockRejectedValue(new Error('Network error'));

      render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/Product Name/i);
      const priceInput = screen.getByLabelText(/Price/i);
      const submitButton = screen.getByRole('button', { name: /Add Product/i });

      fireEvent.change(nameInput, { target: { value: 'Test' } });
      fireEvent.change(priceInput, { target: { value: '10' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to save product/i)).toBeInTheDocument();
      });
    });

    it('clears error when form is submitted again', async () => {
      mockOnSubmit
        .mockRejectedValueOnce({
          response: { data: { message: 'Failed to save product' } },
        })
        .mockResolvedValueOnce(undefined);

      render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/Product Name/i);
      const priceInput = screen.getByLabelText(/Price/i);
      const submitButton = screen.getByRole('button', { name: /Add Product/i });

      // First attempt - should fail
      fireEvent.change(nameInput, { target: { value: 'Test' } });
      fireEvent.change(priceInput, { target: { value: '10' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to save product/i)).toBeInTheDocument();
      });

      // Second attempt - should succeed and clear error
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/Failed to save product/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('requires product name', () => {
      render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/Product Name/i);
      expect(nameInput).toBeRequired();
    });

    it('requires price', () => {
      render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const priceInput = screen.getByLabelText(/Price/i);
      expect(priceInput).toBeRequired();
    });

    it('does not require description', () => {
      render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const descInput = screen.getByLabelText(/Description/i);
      expect(descInput).not.toBeRequired();
    });

    it('accepts price with decimal values', () => {
      render(<ProductForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const priceInput = screen.getByLabelText(/Price/i) as HTMLInputElement;
      expect(priceInput).toHaveAttribute('step', '0.01');
      expect(priceInput).toHaveAttribute('type', 'number');
    });
  });
});

