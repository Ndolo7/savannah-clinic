export const API_URL = 'https://dummyjson.com';

export type Product = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
  brand?: string;
  thumbnail: string;
  images?: string[];
  sku?: string;
  weight?: number;
  dimensions?: { width: number; height: number; depth: number };
};

export type ProductResponse = { products: Product[]; total: number; skip: number; limit: number };
export type Category = { slug: string; name: string; url: string };

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, { ...init, cache: 'no-store' });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export async function login(username: string, password: string) {
  return request<{
    accessToken: string;
    refreshToken: string;
    username: string;
    firstName: string;
    lastName: string;
  }>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, expiresInMins: 1 }),
  });
}
export async function getMe(token: string) {
  return request<{ firstName: string; lastName: string; username: string }>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}
export async function getCategories() {
  return request<Category[]>('/products/categories');
}
export function buildProductsPath(params: {
  q?: string;
  category?: string;
  sortBy: string;
  order: string;
  page: number;
  limit: number;
}) {
  const { q, category, sortBy, order, page, limit } = params;
  const base = q
    ? `/products/search?q=${encodeURIComponent(q)}`
    : category
      ? `/products/category/${encodeURIComponent(category)}`
      : '/products';
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}limit=${limit}&skip=${page * limit}&sortBy=${sortBy}&order=${order}`;
}

export async function getProducts(
  params: {
    q?: string;
    category?: string;
    sortBy: string;
    order: string;
    page: number;
    limit: number;
  },
  signal?: AbortSignal,
) {
  return request<ProductResponse>(buildProductsPath(params), { signal });
}
export async function getProduct(id: string, signal?: AbortSignal) {
  return request<Product>(`/products/${id}`, { signal });
}
export async function updateProduct(id: number, stock: number) {
  return request<Product>(`/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stock }),
  });
}
export function formatCategory(value: string) {
  return value.replaceAll('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
export function stockStatus(stock: number) {
  return stock <= 10 ? 'Low stock' : stock <= 30 ? 'Monitor' : 'In stock';
}
