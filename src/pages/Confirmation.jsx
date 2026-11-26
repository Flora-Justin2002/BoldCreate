import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { Timeline } from './Orders.jsx';
import { Badge } from '../components/Ui.jsx';
import { useStore } from '../store.jsx';
import { fmtDateTime, money } from '../utils.js';

export default function Confirmation() {
  const { lastOrder: o } = useStore();
  if (!o) return <Navigate to="/shop" replace />;
  return (
    <div className="confirm">
      <div className="confirm-hero">
        <div className="check">✓</div>
        <h1>Thank you, {o.contact?.name?.split(' ')[0] || 'there'}!</h1>
        <p className="muted">Your order <b>{o.id}</b> has been placed. A confirmation was sent to {o.contact?.email}.</p>
      </div>
      <div className="grid-2">
        <section className="panel">
          <h3>Order summary</h3>
          <ul className="line-items">
            {o.items.map((i) => <li key={i.productId}><span>{i.name} × {i.qty}</span><b>{money(i.price * i.qty)}</b></li>)}
            <li className="muted"><span>Shipping</span><span>{o.shipping ? money(o.shipping) : 'Free'}</span></li>
            <li className="muted"><span>Tax</span><span>{money(o.tax)}</span></li>
            <li className="total"><span>Total</span><b>{money(o.total)}</b></li>
          </ul>
          <dl className="dl">
            <dt>Payment</dt><dd>{o.paymentMethod} · <Badge>{o.payment}</Badge></dd>
            {o.txn && <><dt>Transaction</dt><dd><code>{o.txn}</code></dd></>}
            <dt>Ship to</dt><dd>{o.address}</dd>
            <dt>Delivery slot</dt><dd>{fmtDateTime(o.slotStart)} ({o.deliveryOption})</dd>
          </dl>
        </section>
        <section className="panel"><h3>Tracking</h3><Timeline order={o} /></section>
      </div>
      <div className="form-actions center">
        <Link to="/my-orders"><ButtonComponent>View my orders</ButtonComponent></Link>
        <Link to="/shop"><ButtonComponent cssClass="e-primary">Continue shopping</ButtonComponent></Link>
      </div>
    </div>
  );
}
