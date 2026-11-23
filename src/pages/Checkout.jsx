import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StepperComponent } from '@syncfusion/ej2-react-navigations';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { DialogComponent } from '@syncfusion/ej2-react-popups';
import { Empty, PageHeader } from '../components/Ui.jsx';
import { Field } from './Products.jsx';
import { Summary } from './Cart.jsx';
import { DELIVERY_OPTIONS, useStore } from '../store.jsx';
import { CURRENT_CUSTOMER_ID } from '../seed.js';
import { money } from '../utils.js';

const STEPS = [
  { label: 'Shipping', iconCss: 'e-icons e-location' },
  { label: 'Delivery', iconCss: 'e-icons e-chevron-right' },
  { label: 'Payment', iconCss: 'e-icons e-credit-card' },
  { label: 'Review', iconCss: 'e-icons e-check' },
];
const METHODS = [
  { id: 'card', label: 'Credit / Debit card', icon: '💳' },
  { id: 'paypal', label: 'PayPal', icon: '🅿️' },
  { id: 'upi', label: 'UPI', icon: '📱' },
  { id: 'cod', label: 'Cash on delivery', icon: '💵' },
];

const luhn = (num) => {
  let sum = 0, alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = Number(num[i]);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n; alt = !alt;
  }
  return sum % 10 === 0;
};

export default function Checkout() {
  const { lines, customers, totalsFor, chargeCard, placeOrder, notify } = useStore();
  const navigate = useNavigate();
  const me = customers.find((c) => c.id === CURRENT_CUSTOMER_ID);
  const [step, setStep] = useState(0);
  const stepRef = useRef(0);
  const [ship, setShip] = useState({ name: me?.name || '', email: me?.email || '', phone: me?.phone || '', address: me?.address || '', city: me?.city || '', zip: me?.zip || '' });
  const [delivery, setDelivery] = useState('standard');
  const [pay, setPay] = useState({ method: 'card', cardNumber: '', name: '', expiry: '', cvc: '', upi: '' });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [failure, setFailure] = useState('');

  if (!lines.length && !processing) return <Empty icon="🛒" title="Nothing to check out"><Link to="/shop">Browse products</Link></Empty>;

  const go = (n) => { stepRef.current = n; setStep(n); setErrors({}); };

  const validate = () => {
    const e = {};
    if (step === 0) {
      if (ship.name.trim().length < 2) e.name = 'Required';
      if (!/^\S+@\S+\.\S+$/.test(ship.email)) e.email = 'Valid email required';
      if (!/^[0-9+()\-\s]{7,20}$/.test(ship.phone)) e.phone = 'Valid phone required';
      if (ship.address.trim().length < 4) e.address = 'Required';
      if (!ship.city.trim()) e.city = 'Required';
      if (!/^[A-Za-z0-9\- ]{3,10}$/.test(ship.zip)) e.zip = 'Invalid ZIP';
    }
    if (step === 2) {
      if (pay.method === 'card') {
        const d = pay.cardNumber.replace(/\s/g, '');
        if (!/^\d{13,19}$/.test(d) || !luhn(d)) e.cardNumber = 'Enter a valid card number (try 4242 4242 4242 4242)';
        if (pay.name.trim().length < 2) e.name = 'Name on card required';
        const m = pay.expiry.match(/^(\d{2})\/(\d{2})$/);
        if (!m || Number(m[1]) < 1 || Number(m[1]) > 12 || new Date(2000 + Number(m[2]), Number(m[1])) < new Date()) e.expiry = 'Use a future date MM/YY';
        if (!/^\d{3,4}$/.test(pay.cvc)) e.cvc = '3–4 digits';
      }
      if (pay.method === 'upi' && !/^[\w.\-]{2,}@[\w]{2,}$/.test(pay.upi)) e.upi = 'e.g. name@bank';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const next = () => validate() && go(step + 1);

  const submit = async () => {
    setFailure('');
    setProcessing(true);
    const t = totalsFor(delivery);
    const res = pay.method === 'cod' ? { ok: true, txn: null } : await chargeCard(pay, t.total);
    if (!res.ok) { setProcessing(false); setFailure(res.error); notify('Payment failed', res.error, 'Error'); return; }
    const order = placeOrder({ customer: { name: ship.name, email: ship.email, phone: ship.phone }, shipping: ship, deliveryId: delivery, payment: pay, txn: res.txn });
    setProcessing(false);
    navigate('/confirmation', { state: { id: order.id }, replace: true });
  };

  const fmtCard = (v) => v.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
  const fmtExp = (v) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };
  const s = (k) => (e) => setShip({ ...ship, [k]: e.target.value });
  const method = METHODS.find((m) => m.id === pay.method);

  return (
    <>
      <PageHeader title="Checkout" subtitle="Secure checkout powered by SyncPay (demo gateway — no real charges)" />
      <div className="panel stepper-wrap">
        <StepperComponent steps={STEPS} activeStep={step} linear={false}
          stepChanging={(a) => { if (a.activeStep > stepRef.current) a.cancel = true; else if (a.activeStep !== stepRef.current) go(a.activeStep); }} />
      </div>

      <div className="cart-layout">
        <section className="panel">
          {step === 0 && (
            <div className="form-grid">
              <h3 className="full">Shipping address</h3>
              <Field label="Full name" error={errors.name}><input value={ship.name} onChange={s('name')} autoComplete="name" /></Field>
              <Field label="Email" error={errors.email}><input type="email" value={ship.email} onChange={s('email')} autoComplete="email" /></Field>
              <Field label="Phone" error={errors.phone}><input value={ship.phone} onChange={s('phone')} autoComplete="tel" /></Field>
              <Field label="Street address" error={errors.address}><input value={ship.address} onChange={s('address')} autoComplete="street-address" /></Field>
              <Field label="City" error={errors.city}><input value={ship.city} onChange={s('city')} /></Field>
              <Field label="ZIP / Postal code" error={errors.zip}><input value={ship.zip} onChange={s('zip')} /></Field>
            </div>
          )}

          {step === 1 && (
            <>
              <h3>Delivery options</h3>
              <div className="option-list" role="radiogroup" aria-label="Delivery options">
                {DELIVERY_OPTIONS.map((o) => {
                  const t = totalsFor(o.id);
                  return (
                    <label key={o.id} className={`option ${delivery === o.id ? 'on' : ''}`}>
                      <input type="radio" name="delivery" checked={delivery === o.id} onChange={() => setDelivery(o.id)} />
                      <span className="o-icon">{o.icon}</span>
                      <span className="grow"><b>{o.label}</b><small>{o.eta}</small></span>
                      <b>{t.shipping ? money(t.shipping) : 'Free'}</b>
                    </label>
                  );
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3>Payment method</h3>
              <div className="option-list" role="radiogroup" aria-label="Payment method">
                {METHODS.map((m) => (
                  <label key={m.id} className={`option ${pay.method === m.id ? 'on' : ''}`}>
                    <input type="radio" name="pay" checked={pay.method === m.id} onChange={() => { setPay({ ...pay, method: m.id }); setErrors({}); }} />
                    <span className="o-icon">{m.icon}</span><span className="grow"><b>{m.label}</b></span>
                  </label>
                ))}
              </div>
              {pay.method === 'card' && (
                <div className="form-grid">
                  <Field label="Card number" error={errors.cardNumber} full><input inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" value={pay.cardNumber} onChange={(e) => setPay({ ...pay, cardNumber: fmtCard(e.target.value) })} /></Field>
                  <Field label="Name on card" error={errors.name} full><input autoComplete="cc-name" value={pay.name} onChange={(e) => setPay({ ...pay, name: e.target.value })} /></Field>
                  <Field label="Expiry (MM/YY)" error={errors.expiry}><input autoComplete="cc-exp" placeholder="08/29" value={pay.expiry} onChange={(e) => setPay({ ...pay, expiry: fmtExp(e.target.value) })} /></Field>
                  <Field label="CVC" error={errors.cvc}><input type="password" inputMode="numeric" autoComplete="cc-csc" maxLength={4} value={pay.cvc} onChange={(e) => setPay({ ...pay, cvc: e.target.value.replace(/\D/g, '') })} /></Field>
                  <small className="muted full">Demo gateway: <code>4242 4242 4242 4242</code> succeeds · <code>4000 0000 0000 0002</code> is declined. Card details are never stored.</small>
                </div>
              )}
              {pay.method === 'upi' && <div className="form-grid one"><Field label="UPI ID" error={errors.upi}><input value={pay.upi} placeholder="name@bank" onChange={(e) => setPay({ ...pay, upi: e.target.value })} /></Field></div>}
              {pay.method === 'paypal' && <p className="muted">You will be redirected to a simulated PayPal approval step.</p>}
              {pay.method === 'cod' && <p className="muted">Pay in cash when your order arrives.</p>}
            </>
          )}

          {step === 3 && (
            <>
              <h3>Review your order</h3>
              <div className="review-grid">
                <div><h4>Ship to</h4><p>{ship.name}<br />{ship.address}<br />{ship.city} {ship.zip}<br />{ship.phone}</p><button className="link-btn" onClick={() => go(0)}>Edit</button></div>
                <div><h4>Delivery</h4><p>{DELIVERY_OPTIONS.find((o) => o.id === delivery).label}<br />{DELIVERY_OPTIONS.find((o) => o.id === delivery).eta}</p><button className="link-btn" onClick={() => go(1)}>Edit</button></div>
                <div><h4>Payment</h4><p>{method.icon} {method.label}{pay.method === 'card' && <><br />•••• {pay.cardNumber.replace(/\s/g, '').slice(-4)}</>}</p><button className="link-btn" onClick={() => go(2)}>Edit</button></div>
              </div>
              {failure && <div className="alert danger" role="alert">❌ {failure} Please change the payment method or try another card.</div>}
            </>
          )}

          <div className="form-actions between">
            <ButtonComponent disabled={step === 0 || processing} onClick={() => go(step - 1)}>← Back</ButtonComponent>
            {step < 3
              ? <ButtonComponent cssClass="e-primary" onClick={next}>Continue →</ButtonComponent>
              : <ButtonComponent cssClass="e-success" disabled={processing} onClick={submit}>Pay {money(totalsFor(delivery).total)} &amp; place order</ButtonComponent>}
          </div>
        </section>
        <Summary delivery={delivery}>items</Summary>
      </div>

      <DialogComponent visible={processing} isModal showCloseIcon={false} width="340px" closeOnEscape={false} cssClass="sk-dialog center" header="SyncPay">
        <div className="processing"><div className="spinner" /><p><b>Processing payment…</b></p><small className="muted">Please do not close this window.</small></div>
      </DialogComponent>
    </>
  );
}
