import React from 'react';
import { Link } from 'react-router-dom';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { ProductImage, Stars } from './Ui.jsx';
import { price, useStore } from '../store.jsx';
import { money } from '../utils.js';

export default function ProductCard({ product }) {
  const { addToCart, wishlist, toggleWishlist, role } = useStore();
  const out = product.stock <= 0;
  const fav = wishlist.includes(product.id);
  const canBuy = role === 'Customer';
  return (
    <div className="e-card product-card">
      <div className="card-media">
        <Link to={`/shop/${product.id}`} className="card-link" aria-label={product.name}><ProductImage product={product} /></Link>
        <span className="chip">{product.category}</span>
        {product.discount > 0 && <span className="sale-tag">-{product.discount}%</span>}
        {canBuy && (
          <button className={`heart ${fav ? 'on' : ''}`} onClick={() => toggleWishlist(product.id)} aria-pressed={fav} aria-label={fav ? 'Remove from wishlist' : 'Add to wishlist'}>
            {fav ? '❤️' : '🤍'}
          </button>
        )}
      </div>
      <div className="e-card-header">
        <div className="e-card-header-caption">
          <Link to={`/shop/${product.id}`} className="e-card-header-title pname">{product.name}</Link>
          <small className="muted">{product.brand}</small>
          <Stars value={product.rating} count={product.reviews} />
        </div>
      </div>
      <div className="e-card-content price-row">
        <span className="price">{money(price(product))}</span>
        {product.discount > 0 && <s className="muted">{money(product.price)}</s>}
        {out ? <span className="oos">Out of stock</span> : product.stock <= 10 && <span className="low">Only {product.stock} left</span>}
      </div>
      {canBuy && (
        <div className="e-card-actions">
          <ButtonComponent cssClass="e-primary full" iconCss="e-icons e-cart" disabled={out} onClick={() => addToCart(product)}>Add to Cart</ButtonComponent>
        </div>
      )}
    </div>
  );
}
