import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QuantityModal from '../../components/QuantityModal';
import type { Product } from '../../types/product';

vi.mock('../../api/product.api', () => ({
  getImageUrl: (path?: string) =>
    path
      ? `http://localhost:3002${path}`
      : 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400&h=300&fit=crop',
}));

const product: Product = {
  id: 'p-1',
  name: 'Organic Green Tea',
  description: 'Premium green tea',
  price: 24.99,
  quantity: 10,
  imagePath: '/uploads/products/tea.jpg',
};

describe('QuantityModal', () => {
  const onConfirm = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderModal = (p = product) =>
    render(<QuantityModal product={p} onConfirm={onConfirm} onClose={onClose} />);

  describe('Rendering', () => {
    it('shows product name', () => {
      renderModal();
      expect(screen.getByText('Organic Green Tea')).toBeInTheDocument();
    });

    it('shows product price per unit', () => {
      renderModal();
      expect(screen.getByText('$24.99 / unit')).toBeInTheDocument();
    });

    it('shows stock quantity', () => {
      renderModal();
      expect(screen.getByText(/10 in stock/i)).toBeInTheDocument();
    });

    it('defaults to quantity 1', () => {
      renderModal();
      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      expect(input.value).toBe('1');
    });

    it('shows subtotal label', () => {
      renderModal();
      expect(screen.getByText(/Subtotal/i)).toBeInTheDocument();
    });

    it('shows Cancel and Add to Cart buttons', () => {
      renderModal();
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add to Cart/i })).toBeInTheDocument();
    });
  });

  describe('Quantity controls', () => {
    it('increments quantity when + clicked', () => {
      renderModal();
      const plusBtn = screen.getByRole('button', { name: '+' });
      fireEvent.click(plusBtn);
      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      expect(input.value).toBe('2');
    });

    it('decrements quantity when − clicked', () => {
      renderModal();
      const plusBtn = screen.getByRole('button', { name: '+' });
      fireEvent.click(plusBtn); // 2
      const minusBtn = screen.getByRole('button', { name: '−' });
      fireEvent.click(minusBtn); // back to 1
      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      expect(input.value).toBe('1');
    });

    it('does not go below 1 when decrement clicked at minimum', () => {
      renderModal();
      const minusBtn = screen.getByRole('button', { name: '−' });
      fireEvent.click(minusBtn);
      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      expect(input.value).toBe('1');
    });

    it('does not exceed max stock', () => {
      renderModal();
      // set to max
      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '10' } });
      const plusBtn = screen.getByRole('button', { name: '+' });
      expect(plusBtn).toBeDisabled();
    });

    it('clamps manual input to max stock', () => {
      renderModal();
      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '99' } });
      expect(input.value).toBe('10'); // clamped to max
    });

    it('updates subtotal when quantity changes', () => {
      renderModal();
      const plusBtn = screen.getByRole('button', { name: '+' });
      fireEvent.click(plusBtn); // qty = 2 → subtotal = 49.98
      expect(screen.getByText(/\$49\.98/)).toBeInTheDocument();
    });
  });

  describe('Confirm / Cancel', () => {
    it('calls onClose when Cancel clicked', () => {
      renderModal();
      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when overlay clicked', () => {
      renderModal();
      const overlay = document.querySelector('.qty-modal-overlay') as HTMLElement;
      fireEvent.click(overlay);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onConfirm with quantity when Add to Cart clicked', async () => {
      onConfirm.mockResolvedValue(undefined);
      renderModal();
      fireEvent.click(screen.getByRole('button', { name: /Add to Cart/i }));
      await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(1));
    });

    it('calls onConfirm with updated quantity', async () => {
      onConfirm.mockResolvedValue(undefined);
      renderModal();
      const plusBtn = screen.getByRole('button', { name: '+' });
      fireEvent.click(plusBtn); // qty = 2
      fireEvent.click(screen.getByRole('button', { name: /Add to Cart/i }));
      await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(2));
    });

    it('shows error message when onConfirm rejects', async () => {
      onConfirm.mockRejectedValue({
        response: { data: { message: 'Only 1 unit available' } },
      });
      renderModal();
      fireEvent.click(screen.getByRole('button', { name: /Add to Cart/i }));
      await waitFor(() =>
        expect(screen.getByText('Only 1 unit available')).toBeInTheDocument(),
      );
    });

    it('disables buttons while loading', async () => {
      onConfirm.mockReturnValue(new Promise(() => {})); // never resolves
      renderModal();
      fireEvent.click(screen.getByRole('button', { name: /Add to Cart/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /Adding/i })).toBeDisabled();
      });
    });
  });

  describe('Max quantity enforcement', () => {
    it('respects product.quantity as the max', () => {
      const lowStockProduct = { ...product, quantity: 3 };
      renderModal(lowStockProduct);
      expect(screen.getByText(/3 in stock/i)).toBeInTheDocument();
      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      expect(input).toHaveAttribute('max', '3');
    });
  });
});

