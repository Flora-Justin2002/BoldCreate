import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import { Empty, PageHeader } from '../components/Ui.jsx';
import { price, useStore } from '../store.jsx';
import { sanitize } from '../utils.js';

const SORTS = { featured: 'Featured', 'price-asc': 'Price: low to high', 'price-desc': 'Price: high to low', rating: 'Top rated' };

export default function Shop() {
  const { products, categories, announcement } = useStore();
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') || '', cat = sp.get('cat') || 'All', sort = sp.get('sort') || 'featured';
  const min = Number(sp.get('min') || 0), max = Number(sp.get('max') || 2500);
  const top = Math.ceil(Math.max(...products.map((p) => price(p)), 100) / 50) * 50;
  const set = (k, v) => { const n = new URLSearchParams(sp); if (v === '' || v == null) n.delete(k); else n.set(k, v); setSp(n, { replace: true }); };

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    let l = products.filter((p) => p.status !== 'Draft')
      .filter((p) => cat === 'All' || p.category === cat)
      .filter((p) => price(p) >= min && price(p) <= max)
      .filter((p) => !t || `${p.name} ${p.brand} ${p.category} ${p.description}`.toLowerCase().includes(t));
    if (sort === 'price-asc') l = [...l].sort((a, b) => price(a) - price(b));
    if (sort === 'price-desc') l = [...l].sort((a, b) => price(b) - price(a));
    if (sort === 'rating') l = [...l].sort((a, b) => b.rating - a.rating);
    if (sort === 'featured') l = [...l].sort((a, b) => Number(b.featured) - Number(a.featured));
    return l;
  }, [products, q, cat, sort, min, max]);

  return (
    <>
      {announcement && <div className="banner" dangerouslySetInnerHTML={{ __html: sanitize(announcement) }} />}
      <PageHeader title="Shop" subtitle={`${list.length} products`} />
      <div className="shop-layout">
        <aside className="panel filters" aria-label="Filters">
          <h4>Search</h4>
          <input className="input" value={q} onChange={(e) => set('q', e.target.value)} placeholder="Search products…" aria-label="Search products" />
          <h4>Category</h4>
          <ul className="filter-list">
            {['All', ...categories.map((c) => c.name)].map((c) => (
              <li key={c}><button className={cat === c ? 'on' : ''} onClick={() => set('cat', c === 'All' ? '' : c)}>{categories.find((x) => x.name === c)?.icon || '🛍️'} {c}</button></li>
            ))}
          </ul>
          <h4>Price range</h4>
          <div className="price-inputs">
            <input className="input" type="number" min="0" value={min || ''} placeholder="Min" aria-label="Minimum price" onChange={(e) => set('min', e.target.value)} />
            <span>–</span>
            <input className="input" type="number" min="0" value={sp.get('max') || ''} placeholder={`Max ${top}`} aria-label="Maximum price" onChange={(e) => set('max', e.target.value)} />
          </div>
          <input type="range" min="0" max={top} step="10" value={Math.min(max, top)} onChange={(e) => set('max', e.target.value)} aria-label="Maximum price slider" />
          <h4>Sort by</h4>
          <select className="input" value={sort} onChange={(e) => set('sort', e.target.value)} aria-label="Sort">
            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button className="link-btn" onClick={() => setSp({}, { replace: true })}>Reset filters</button>
        </aside>
        <div>
          {list.length === 0 ? <Empty title="No products match"><button className="link-btn" onClick={() => setSp({})}>Clear filters</button></Empty> : (
            <div className="product-grid">{list.map((p) => <ProductCard key={p.id} product={p} />)}</div>
          )}
        </div>
      </div>
    </>
  );
}
