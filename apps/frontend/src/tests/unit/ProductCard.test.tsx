import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProductCard from '../../components/ProductCard';

vi.mock('../../api/product.api', () => ({
  getImageUrl: vi.fn(() => 'http://example.com/img.jpg'),
}));

const mockProduct = {
  id: '1',
  name: 'Ceai Verde',
  description: 'Ceai ecologic',
  price: 25.99,
  quantity: 10,
  imagePath: '/uploads/ceai.jpg',
};

describe('ProductCard', () => {
  it('afișează produsul — accesibil tuturor utilizatorilor autentificați', () => {
    render(<ProductCard product={mockProduct} onBuy={vi.fn()} />);
    expect(screen.getByText('Ceai Verde')).toBeInTheDocument();
  });
});
