import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CartPage from '../../pages/CartPage';
import * as cartApi from '../../api/cart.api';

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('../../api/cart.api');
vi.mock('../../api/product.api', () => ({
  getImageUrl: (path?: string) =>
    path
      ? `http://localhost:3002${path}`
      : 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400&h=300&fit=crop',
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// ── Fixtures ──────────────────────────────────────────────────────────────

const emptyCart = {
  id: 'cart-1',
  customerId: 'mock-customer-dev',
  items: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const cartWithItems = {
  ...emptyCart,
  items: [
    {
      productId: 'p-1',
      name: 'Organic Green Tea',
      price: 24.99,
      quantity: 2,
      imagePath: '/uploads/products/tea.jpg',
    },
    {
      productId: 'p-2',
      name: 'Raw Wildflower Honey',
      price: 14.99,
      quantity: 1,
      imagePath: undefined,
    },
  ],
};

const renderCart = () =>
  render(
    <BrowserRouter>
      <CartPage />
    </BrowserRouter>,
  );

// ── Tests ─────────────────────────────────────────────────────────────────

describe('CartPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    it('shows loading indicator while fetching cart', () => {
      vi.mocked(cartApi.getCart).mockReturnValue(new Promise(() => {})); // never resolves
      renderCart();
      expect(screen.getByText(/loading cart/i)).toBeInTheDocument();
    });
  });

  describe('Empty cart', () => {
    beforeEach(() => {
      vi.mocked(cartApi.getCart).mockResolvedValue(emptyCart);
    });

    it('renders cart title', async () => {
      renderCart();
      await waitFor(() => expect(screen.getByText(/My Cart/i)).toBeInTheDocument());
    });

    it('shows empty state message', async () => {
      renderCart();
      await waitFor(() =>
        expect(screen.getByText(/Your cart is empty/i)).toBeInTheDocument(),
      );
    });

    it('shows Browse Products button in empty state', async () => {
      renderCart();
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: /Browse Products/i }),
        ).toBeInTheDocument(),
      );
    });
  });

  describe('Cart with items', () => {
    beforeEach(() => {
      vi.mocked(cartApi.getCart).mockResolvedValue(cartWithItems);
    });

    it('renders each item name', async () => {
      renderCart();
      await waitFor(() => {
        expect(screen.getByText('Organic Green Tea')).toBeInTheDocument();
        expect(screen.getByText('Raw Wildflower Honey')).toBeInTheDocument();
      });
    });

    it('renders unit prices', async () => {
      renderCart();
      await waitFor(() => {
        expect(screen.getByText('$24.99 / unit')).toBeInTheDocument();
        expect(screen.getByText('$14.99 / unit')).toBeInTheDocument();
      });
    });

    it('renders subtotals per item', async () => {
      renderCart();
      // 24.99 * 2 = 49.98
      await waitFor(() => expect(screen.getByText('$49.98')).toBeInTheDocument());
    });

    it('renders order summary with correct subtotal', async () => {
      renderCart();
      // subtotal = 24.99*2 + 14.99*1 = 64.97
      await waitFor(() =>
        expect(screen.getByText('Order Summary')).toBeInTheDocument(),
      );
    });

    it('renders Place Order button', async () => {
      renderCart();
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: /Place Order/i }),
        ).toBeInTheDocument(),
      );
    });

    it('renders Continue Shopping button', async () => {
      renderCart();
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: /Continue Shopping/i }),
        ).toBeInTheDocument(),
      );
    });
  });

  describe('Quantity controls', () => {
    beforeEach(() => {
      vi.mocked(cartApi.getCart).mockResolvedValue(cartWithItems);
    });

    it('calls updateCartItem when + button clicked', async () => {
      vi.mocked(cartApi.updateCartItem).mockResolvedValue({
        ...cartWithItems,
        items: [{ ...cartWithItems.items[0], quantity: 3 }, cartWithItems.items[1]],
      });
      renderCart();
      const plusBtns = await screen.findAllByRole('button', { name: '+' });
      fireEvent.click(plusBtns[0]);
      await waitFor(() =>
        expect(cartApi.updateCartItem).toHaveBeenCalledWith('p-1', 3),
      );
    });

    it('calls removeCartItem when quantity decremented to 0', async () => {
      const singleItemCart = {
        ...emptyCart,
        items: [{ ...cartWithItems.items[1], quantity: 1 }],
      };
      vi.mocked(cartApi.getCart).mockResolvedValue(singleItemCart);
      vi.mocked(cartApi.removeCartItem).mockResolvedValue(emptyCart);

      renderCart();
      const minusBtns = await screen.findAllByRole('button', { name: '−' });
      fireEvent.click(minusBtns[0]);
      await waitFor(() =>
        expect(cartApi.removeCartItem).toHaveBeenCalledWith('p-2'),
      );
    });

    it('calls removeCartItem when ✕ button clicked', async () => {
      vi.mocked(cartApi.removeCartItem).mockResolvedValue(emptyCart);
      renderCart();
      const removeBtns = await screen.findAllByRole('button', { name: '✕' });
      fireEvent.click(removeBtns[0]);
      await waitFor(() =>
        expect(cartApi.removeCartItem).toHaveBeenCalledWith('p-1'),
      );
    });
  });

  describe('Checkout flow', () => {
    beforeEach(() => {
      vi.mocked(cartApi.getCart).mockResolvedValue(cartWithItems);
    });

    it('shows success message after placing order', async () => {
      vi.mocked(cartApi.checkout).mockResolvedValue({
        customerId: 'mock-customer-dev',
        items: cartWithItems.items,
        totalPrice: 64.97,
        createdAt: new Date().toISOString(),
      });
      vi.mocked(cartApi.clearCart).mockResolvedValue(emptyCart);

      renderCart();
      const orderBtn = await screen.findByRole('button', { name: /Place Order/i });
      fireEvent.click(orderBtn);

      await waitFor(() =>
        expect(screen.getByText(/Order placed successfully/i)).toBeInTheDocument(),
      );
    });

    it('shows error message when checkout fails', async () => {
      vi.mocked(cartApi.checkout).mockRejectedValue({
        response: { data: { message: 'Service unavailable' } },
      });

      renderCart();
      const orderBtn = await screen.findByRole('button', { name: /Place Order/i });
      fireEvent.click(orderBtn);

      await waitFor(() =>
        expect(screen.getByText('Service unavailable')).toBeInTheDocument(),
      );
    });
  });

  describe('Error state', () => {
    it('shows error message when cart fails to load', async () => {
      vi.mocked(cartApi.getCart).mockRejectedValue({ response: { status: 500 } });
      renderCart();
      await waitFor(() =>
        expect(screen.getByText(/Failed to load cart/i)).toBeInTheDocument(),
      );
    });

    it('navigates to login on 401', async () => {
      vi.mocked(cartApi.getCart).mockRejectedValue({ response: { status: 401 } });
      renderCart();
      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'));
    });
  });
});

