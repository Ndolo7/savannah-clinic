'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, Clipboard, LoaderCircle, PackageSearch, RefreshCw } from 'lucide-react';
import { getProduct, Product, stockStatus, updateProduct } from '@/lib/dummyjson';

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stock, setStock] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  function load() {
    setLoading(true);
    setError('');
    getProduct(id)
      .then((item) => {
        setProduct(item);
        setStock(String(item.stock));
      })
      .catch(() => setError('This item could not be found or the stock service is unavailable.'))
      .finally(() => setLoading(false));
  }
  useEffect(() => {
    if (sessionStorage.getItem('clinic-session')) load();
    else router.replace('/');
  }, [id]);
  async function save(event: FormEvent) {
    event.preventDefault();
    const next = Number(stock);
    if (!Number.isInteger(next) || next < 0) return;
    setSaving(true);
    setSaved(false);
    try {
      const result = await updateProduct(Number(id), next);
      setProduct((current) => (current ? { ...current, stock: result.stock } : result));
      setStock(String(result.stock));
      setSaved(true);
    } catch {
      setError('The correction was not saved. Check your connection and retry.');
    } finally {
      setSaving(false);
    }
  }
  if (loading)
    return (
      <div className="loading-screen" suppressHydrationWarning>
        <LoaderCircle className="spin" />
        Loading item…
      </div>
    );
  if (error || !product)
    return (
      <main className="detail-page">
        <Link href="/" className="back-link">
          <ArrowLeft size={17} /> Back to inventory
        </Link>
        <div className="state-panel">
          <PackageSearch size={24} />
          <div>
            <strong>Unable to open item</strong>
            <p>{error}</p>
            <button className="button secondary" onClick={load}>
              <RefreshCw size={16} /> Try again
            </button>
          </div>
        </div>
      </main>
    );
  return (
    <main className="detail-page">
      <Link href="/" className="back-link">
        <ArrowLeft size={17} /> Back to inventory
      </Link>
      <div className="detail-grid">
        <section className="detail-image">
          <img src={product.images?.[0] || product.thumbnail} alt={product.title} />
        </section>
        <section className="detail-copy">
          <p className="eyebrow">Item #{String(product.id).padStart(4, '0')}</p>
          <h1>{product.title}</h1>
          <p className="muted">{product.description}</p>
          <div className="detail-meta">
            <span>{product.category}</span>
            <span>SKU {product.sku || 'Not assigned'}</span>
            <span>${product.price.toFixed(2)} unit price</span>
          </div>
          <form className="correction-card" onSubmit={save}>
            <div>
              <p className="eyebrow">Physical count</p>
              <h2>Correct stock</h2>
              <p className="muted">
                Current system count: <strong>{product.stock}</strong> ·{' '}
                {stockStatus(product.stock)}
              </p>
            </div>
            <label>
              New count
              <input
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => {
                  setStock(e.target.value);
                  setSaved(false);
                }}
                required
              />
            </label>
            {saved && (
              <p className="success" role="status">
                <Check size={16} /> Stock correction saved
              </p>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary wide" disabled={saving}>
              {saving ? <LoaderCircle className="spin" size={17} /> : <Clipboard size={17} />}
              {saving ? 'Saving correction…' : 'Save correction'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
