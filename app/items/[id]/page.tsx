import ItemDetail from '@/components/item-detail';
import { API_URL } from '@/lib/dummyjson';

export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_URL}/products?limit=0&select=id`);
    const data = await res.json();
    return (data.products || []).map((p: { id: number }) => ({
      id: String(p.id),
    }));
  } catch {
    return [];
  }
}

export default function ItemPage() {
  return <ItemDetail />;
}
