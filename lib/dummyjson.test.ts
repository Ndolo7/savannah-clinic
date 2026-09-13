import { describe, expect, it } from 'vitest';
import { buildProductsPath } from './dummyjson';

describe('buildProductsPath', () => {
  it('encodes search and keeps pagination and sort parameters', () => {
    expect(
      buildProductsPath({
        q: 'surgical mask',
        sortBy: 'stock',
        order: 'desc',
        page: 2,
        limit: 12,
      }),
    ).toBe('/products/search?q=surgical%20mask&limit=12&skip=24&sortBy=stock&order=desc');
  });

  it('uses the category endpoint when there is no search query', () => {
    expect(
      buildProductsPath({
        category: 'skin-care',
        sortBy: 'title',
        order: 'asc',
        page: 0,
        limit: 12,
      }),
    ).toBe('/products/category/skin-care?limit=12&skip=0&sortBy=title&order=asc');
  });

  it('starts every changed filter at an explicit page boundary', () => {
    const path = buildProductsPath({ sortBy: 'price', order: 'asc', page: 0, limit: 12 });
    expect(new URLSearchParams(path.split('?')[1]).get('skip')).toBe('0');
  });
});
