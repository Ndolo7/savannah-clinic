'use client';

import { FormEvent, Fragment, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  LoaderCircle,
  LogOut,
  PackageSearch,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Category,
  formatCategory,
  getCategories,
  getMe,
  getProducts,
  login,
  Product,
  stockStatus,
} from '@/lib/dummyjson';

const LIMIT = 12;
const SORTS = [
  { value: 'title', label: 'Name' },
  { value: 'stock', label: 'Stock count' },
  { value: 'price', label: 'Price' },
  { value: 'rating', label: 'Rating' },
];
type Session = {
  accessToken: string;
  refreshToken: string;
  user: { firstName: string; lastName: string; username: string };
};
function readSession(): Session | null {
  try {
    return JSON.parse(sessionStorage.getItem('clinic-session') || 'null');
  } catch {
    return null;
  }
}
function writeSession(session: Session) {
  sessionStorage.setItem('clinic-session', JSON.stringify(session));
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="state-panel" role="alert">
      <AlertCircle size={24} />
      <div>
        <strong>We couldn&apos;t load this view</strong>
        <p>{message}</p>
        <button className="button secondary" onClick={onRetry}>
          <RefreshCw size={16} /> Try again
        </button>
      </div>
    </div>
  );
}
function Login({ onLogin }: { onLogin: (session: Session) => void }) {
  const [username, setUsername] = useState('emilys');
  const [password, setPassword] = useState('emilyspass');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await login(username, password);
      const session = {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: { firstName: result.firstName, lastName: result.lastName, username: result.username },
      };
      writeSession(session);
      onLogin(session);
    } catch {
      setError('Check your username and password, then try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand-mark">
          <PackageSearch size={24} />
        </div>
        <p className="eyebrow">Savannah clinic</p>
        <h1>Stock, within reach.</h1>
        <p className="muted">Sign in to manage supplies across your clinic.</p>
        <form onSubmit={submit} className="login-form">
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="button primary wide" disabled={busy}>
            {busy ? <LoaderCircle className="spin" size={17} /> : null}
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="login-hint">
          Demo access: <strong>emilys</strong> / <strong>emilyspass</strong>
        </p>
      </section>
    </main>
  );
}

export default function ClinicConsole() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const search = params.get('q') || '';
  const category = params.get('category') || '';
  const sortBy = params.get('sort') || 'title';
  const order = params.get('order') || 'asc';
  const page = Math.max(0, Number(params.get('page') || 0) || 0);
  useEffect(() => {
    setSession(readSession());
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!session) return;
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [session]);
  useEffect(() => {
    if (!session) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    const timer = window.setTimeout(
      () => {
        getProducts({ q: search, category, sortBy, order, page, limit: LIMIT }, controller.signal)
          .then((result) => {
            if (id === requestId.current) {
              setProducts(result.products);
              setTotal(result.total);
            }
          })
          .catch((err) => {
            if (err.name !== 'AbortError' && id === requestId.current)
              setError('The stock service is unavailable. Your filters are safe to retry.');
          })
          .finally(() => {
            if (id === requestId.current) setLoading(false);
          });
      },
      search ? 350 : 0,
    );
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [session, search, category, sortBy, order, page]);
  const pageCount = Math.max(1, Math.ceil(total / LIMIT));
  const displayPage = Math.min(page, pageCount - 1);
  useEffect(() => {
    if (page !== displayPage && total > 0) updateUrl({ page: displayPage });
  }, [page, displayPage, total]);
  function updateUrl(changes: Record<string, string | number>) {
    const next = new URLSearchParams(params.toString());
    Object.entries(changes).forEach(([key, value]) => {
      if (value === '' || (value === 0 && key === 'page'))
        next.delete(key === 'sortBy' ? 'sort' : key);
      else next.set(key === 'sortBy' ? 'sort' : key, String(value));
    });
    router.push(`${pathname}?${next.toString()}`);
  }
  function logout() {
    sessionStorage.removeItem('clinic-session');
    setSession(null);
    router.replace('/');
  }
  if (!hydrated)
    return (
      <div className="loading-screen" suppressHydrationWarning>
        <LoaderCircle className="spin" />
        Loading console…
      </div>
    );
  if (!session) return <Login onLogin={setSession} />;
  return (
    <main className="app-shell">
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark small">
            <PackageSearch size={18} />
          </span>
          <span>
            <strong>Savannah</strong>
            <small>Clinic stock</small>
          </span>
        </Link>
        <div className="user-menu">
          <span className="user-avatar">
            {session.user.firstName[0]}
            {session.user.lastName[0]}
          </span>
          <span className="user-name">
            {session.user.firstName} {session.user.lastName}
          </span>
          <button className="icon-button" onClick={logout} aria-label="Sign out" title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <section className="content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Supplies overview</p>
            <h1>Stock inventory</h1>
            <p className="muted">Keep your counts accurate, aisle by aisle.</p>
          </div>
          <div className="sync-note">
            <span className="status-dot" />
            Live catalogue
            <br />
            <small>Updates on refresh</small>
          </div>
        </div>
        <div className="toolbar">
          <label className="search-box">
            <Search size={18} />
            <span className="sr-only">Search stock</span>
            <input
              value={search}
              onChange={(e) => updateUrl({ q: e.target.value, page: 0 })}
              placeholder="Search items…"
            />
          </label>
          <div className="select-wrap">
            <SlidersHorizontal size={16} />
            <label className="sr-only" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => updateUrl({ category: e.target.value, page: 0 })}
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="select-wrap">
            <label className="sr-only" htmlFor="sort">
              Sort by
            </label>
            <select
              id="sort"
              value={`${sortBy}:${order}`}
              onChange={(e) => {
                const [nextSort, nextOrder] = e.target.value.split(':');
                updateUrl({ sort: nextSort, order: nextOrder, page: 0 });
              }}
            >
              {SORTS.map((item) => (
                <Fragment key={item.value}>
                  <option value={`${item.value}:asc`}>{item.label} A–Z</option>
                  <option value={`${item.value}:desc`}>{item.label} Z–A</option>
                </Fragment>
              ))}
            </select>
          </div>
        </div>
        {error ? (
          <ErrorState message={error} onRetry={() => updateUrl({ page })} />
        ) : loading ? (
          <div className="state-panel">
            <LoaderCircle className="spin" size={24} />
            <span>Loading stock…</span>
          </div>
        ) : products.length === 0 ? (
          <div className="state-panel">
            <PackageSearch size={24} />
            <div>
              <strong>No stock matches</strong>
              <p>Try a different search or clear your filters.</p>
              <button className="button secondary" onClick={() => router.push('/')}>
                Clear filters
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="table-card">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Unit price</th>
                    <th aria-label="Open item" />
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <Link className="item-link" href={`/items/${product.id}`}>
                          <span className="product-thumb">
                            <img src={product.thumbnail} alt="" />
                          </span>
                          <span>
                            <strong>{product.title}</strong>
                            <small>#{String(product.id).padStart(4, '0')}</small>
                          </span>
                        </Link>
                      </td>
                      <td>
                        <span className="category-pill">{formatCategory(product.category)}</span>
                      </td>
                      <td>
                        <span className={`stock ${product.stock <= 10 ? 'low' : ''}`}>
                          <span className="status-dot" />
                          {product.stock} <small>{stockStatus(product.stock)}</small>
                        </span>
                      </td>
                      <td>${product.price.toFixed(2)}</td>
                      <td>
                        <Link
                          className="row-arrow"
                          href={`/items/${product.id}`}
                          aria-label={`Open ${product.title}`}
                        >
                          <ArrowRight size={18} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <nav className="pagination" aria-label="Pagination">
              <span>
                Showing {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} of {total}
              </span>
              <div>
                <button
                  className="icon-button"
                  disabled={page === 0}
                  onClick={() => updateUrl({ page: page - 1 })}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={18} />
                </button>
                <strong>
                  Page {page + 1} of {pageCount}
                </strong>
                <button
                  className="icon-button"
                  disabled={page >= pageCount - 1}
                  onClick={() => updateUrl({ page: page + 1 })}
                  aria-label="Next page"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </nav>
          </>
        )}
      </section>
    </main>
  );
}
