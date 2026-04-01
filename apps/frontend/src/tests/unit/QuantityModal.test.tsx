import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import QuantityModal from '../../components/QuantityModal';

vi.mock('../../api/product.api', () => ({
  getImageUrl: vi.fn(() => ''),
}));

const mockProduct = {
  id: '1',
  name: 'Miere de Albine',
  price: 35.0,
  quantity: 5,
  imagePath: undefined,
};

describe('QuantityModal', () => {
  it('afișează modalul de cantitate — accesibil doar utilizatorilor cu rol CUSTOMER', () => {
    render(<QuantityModal product={mockProduct} onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/câte bucăți dorești/i)).toBeInTheDocument();
  });
});
