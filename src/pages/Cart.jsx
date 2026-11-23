import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { Empty, PageHeader, ProductThumb } from '../components/Ui.jsx';
import { FREE_SHIPPING_OVER, price, useStore } from '../store.jsx';
import { money } from '../utils.js';

export function Summary({ delivery = 'standard', children }) {
  const { lines, subtotal, listTotal, savings, totalsFor } = useStore();
  const t = totalsFor(delivery);
  return (
    <aside className="panel summary">
      <h3>Order summary</h3>
      {lines.length > 0 && children === 'items' && (
        <ul className="line-items">{lines.map((l) => <li key={l.id}><span>{l.product.name} × {l.qty}</span><b>{money(price(l.product) * l.qty)}</b></li>)}</ul>
      )}
      <ul className="line-items">
        <li><span>List price</span><span>{money(listTotal)}</span></li>
        {savings > 0 && <li className="txt-green"><span>Discounts</span><span>−{money(savings)}</span></li>}
        <li><span>Subtotal</span><span>{money(subtotal)}</span></li>
        <li><span>Shipping ({t.option.label})</span><span>{t.shipping ? money(t.shipping) : 'Free'}</span></li>
        <li><span>Tax (8%)</span><span>{money(t.tax)}</span></li>
        <li className="total"><span>Total</span><b>{money(t.total)}</b></li>
      </ul>
      {children !== 'items' && children}
    </aside>
  );
}

export default function Cart() {
  const { lines, setQty, removeFromCart, clearCart, subtotal } = useStore();
  const navigate = useNavigate();
  if (!lines.length) return <Empty icon="🛒" title="Your cart is empty"><Link to="/shop">Continue shopping</Link></Empty>;
  const toFree = FREE_SHIPPING_OVER - subtotal;
  return (
    <>
      <PageHeader title="Shopping Cart" subtitle={`${lines.length} items`} actions={<button className="link-btn danger" onClick={clearCart}>Clear cart</button>} />
      <div className="cart-layout">
        <div>
          {toFree > 0 ? <div className="alert info">Add <b>{money(toFree)}</b> more for free standard shipping.</div> : <div className="alert ok">🎉 You qualify for free standard shipping.</div>}
          <div className="panel flush">
            <table className="table cart-table">
              <thead><tr><th>Product</th><th>Price</th><th>Quantity</th><th>Total</th><th><span className="sr">Remove</span></th></tr></thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.id}>
                    <td><div className="profile-cell"><ProductThumb product={l.product} size={52} /><span className="cell-stack"><Link to={`/shop/${l.id}`}><b>{l.product.name}</b></Link><small className="muted">{l.product.brand}{l.product.discount > 0 && ` · ${l.product.discount}% off`}</small></span></div></td>
                    <td>{money(price(l.product))}{l.product.discount > 0 && <><br /><s className="muted">{money(l.product.price)}</s></>}</td>
                    <td>
                      <div className="qty" role="group" aria-label={`Quantity for ${l.product.name}`}>
                        <button onClick={() => (l.qty > 1 ? setQty(l.id, l.qty - 1) : removeFromCart(l.id))} aria-label="Decrease">−</button>
                        <span>{l.qty}</span>
                        <button onClick={() => setQty(l.id, l.qty + 1)} disabled={l.qty >= l.product.stock} aria-label="Increase">+</button>
                      </div>
                    </td>
                    <td><b>{money(price(l.product) * l.qty)}</b></td>
                    <td><button className="link-btn danger" onClick={() => removeFromCart(l.id)} aria-label={`Remove ${l.product.name}`}>🗑️</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Summary>
          <ButtonComponent cssClass="e-primary full" onClick={() => navigate('/checkout')}>Proceed to checkout</ButtonComponent>
          <Link to="/shop" className="center-link">Continue shopping</Link>
        </Summary>
      </div>
    </>
  );
}
