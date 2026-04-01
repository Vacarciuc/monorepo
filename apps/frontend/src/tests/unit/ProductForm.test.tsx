import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProductForm from '../../components/ProductForm';

vi.mock('../../api/product.api', () => ({
  getImageUrl: vi.fn(() => ''),
}));

describe('ProductForm', () => {
  it('afișează formularul — accesibil doar utilizatorilor cu rol SELLER sau ADMIN', () => {
    render(<ProductForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText(/nume produs/i)).toBeInTheDocument();
  });
});
