import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import ProductCard from '../components/ProductCard.jsx';
import { Breadcrumb, Empty, ProductImage, Stars } from '../components/Ui.jsx';
import { price, useStore } from '../store.jsx';
import { getReviews } from '../data.js';
import { money } from '../utils.js';

export default function ProductDetail() {
  const { id } = useParams();
  const { products, addToCart, wishlist, toggleWishlist, role } = useStore();
  const p = products.find((x) => x.id === Number(id));
  const [qty, setQty] = useState(1);
  const [view, setView] = useState(0);
  const [tab, setTab] = useState('desc');
  useEffect(() => { setQty(1); setView(0); setTab('desc'); }, [id]);

  if (!p) return <Empty icon="🫥" title="Product not found"><Link to="/shop">Back to shop</Link></Empty>;
  const related = products.filter((x) => x.category === p.category && x.id !== p.id && x.status !== 'Draft').slice(0, 4);
  const reviews = getReviews(p);
  const specs = Object.entries(p.specs || {});
  const out = p.stock <= 0;
  const fav = wishlist.includes(p.id);
  const canBuy = role === 'Customer';
  // Gallery: main image plus three alternate "angles" rendered as tinted variants of the product art
  const angles = [{ label: 'Front', rot: 0 }, { label: 'Angle', rot: -8 }, { label: 'Detail', rot: 8 }, { label: 'In use', rot: 0 }];

  return (
    <>
      <Breadcrumb items={[{ label: 'Shop', to: '/shop' }, { label: p.category, to: `/shop?cat=${encodeURIComponent(p.category)}` }, { label: p.name }]} />
      <div className="detail panel">
        <div className="gallery">
          <div className="gallery-main" style={{ transform: `rotate(${angles[view].rot}deg)` }}><ProductImage product={p} large /></div>
          <div className="thumbs" role="tablist" aria-label="Image gallery">
            {angles.map((a, i) => (
              <button key={a.label} role="tab" aria-selected={view === i} className={view === i ? 'on' : ''} onClick={() => setView(i)} aria-label={`View ${a.label}`}>
                <ProductImage product={p} />
              </button>
            ))}
          </div>
        </div>
        <div className="info">
          <span className="chip">{p.category}</span>
          <h1>{p.name}</h1>
          <p className="muted">by {p.brand} · SKU {p.sku}</p>
          <Stars value={p.rating} count={p.reviews} />
          <div className="price-big">
            {money(price(p))} {p.discount > 0 && <><s className="muted">{money(p.price)}</s> <span className="sale-tag static">-{p.discount}%</span></>}
          </div>
          <p>{p.description}</p>
          <p className={out ? 'txt-red' : p.stock <= 10 ? 'txt-amber' : 'txt-green'}>{out ? 'Out of stock' : p.stock <= 10 ? `Only ${p.stock} left` : 'In stock · ships within 24h'}</p>
          {canBuy ? (
            <div className="buy-row">
              <div className="qty" role="group" aria-label="Quantity">
                <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease">−</button>
                <span>{qty}</span>
                <button onClick={() => setQty(Math.min(p.stock || 1, qty + 1))} aria-label="Increase">+</button>
              </div>
              <ButtonComponent cssClass="e-primary" disabled={out} onClick={() => addToCart(p, qty)}>Add to Cart</ButtonComponent>
              <ButtonComponent cssClass={fav ? 'e-success' : 'e-outline'} onClick={() => toggleWishlist(p.id)}>{fav ? '❤️ Saved' : '🤍 Wishlist'}</ButtonComponent>
            </div>
          ) : <p className="muted">Switch to the Customer role to purchase.</p>}
        </div>
      </div>

      <section className="panel">
        <div className="seg" role="tablist">
          {[['desc', 'Description'], ['specs', 'Specifications'], ['reviews', `Reviews (${reviews.length})`]].map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        {tab === 'desc' && <p>{p.description} Backed by a 30-day return policy and a 1-year warranty.</p>}
        {tab === 'specs' && (specs.length ? <dl className="dl specs">{specs.map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}</dl> : <p className="muted">No specifications listed.</p>)}
        {tab === 'reviews' && (
          <ul className="reviews">
            {reviews.map((r) => (
              <li key={r.id}><Stars value={r.rating} /><b>{r.title}</b><p>{r.text}</p><small className="muted">{r.author} · {r.date}</small></li>
            ))}
          </ul>
        )}
      </section>

      {related.length > 0 && (
        <>
          <h2>Related products</h2>
          <div className="product-grid">{related.map((r) => <ProductCard key={r.id} product={r} />)}</div>
        </>
      )}
    </>
  );
}
