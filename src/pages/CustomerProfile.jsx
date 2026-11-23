import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar } from './Customers.jsx';
import { Badge, Breadcrumb, Empty, KpiCard } from '../components/Ui.jsx';
import { useStore } from '../store.jsx';
import { fmtDate, money } from '../utils.js';

export default function CustomerProfile() {
  const { id } = useParams();
  const { customers, orders, customerStats } = useStore();
  const c = customers.find((x) => x.id === Number(id));
  if (!c) return <Empty icon="👤" title="Customer not found"><Link to="/customers">Back to customers</Link></Empty>;

  const mine = orders.filter((o) => o.customerId === c.id).sort((a, b) => b.date.localeCompare(a.date));
  const st = customerStats[c.id] || { orders: 0, spent: 0 };
  const favourites = Object.entries(mine.flatMap((o) => o.items).reduce((m, it) => ({ ...m, [it.category]: (m[it.category] || 0) + it.qty }), {})).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <Breadcrumb items={[{ label: 'Customers', to: '/customers' }, { label: c.name }]} />
      <section className="panel profile-hero">
        <Avatar name={c.name} size={84} />
        <div className="grow">
          <h1>{c.name} <Badge>{c.status}</Badge></h1>
          <ul className="meta-list">
            <li>✉️ {c.email}</li><li>📞 {c.phone}</li><li>📍 {c.address}, {c.city} {c.zip}</li><li>🗓️ Customer since {fmtDate(c.joined)}</li>
          </ul>
        </div>
      </section>
      <div className="kpi-grid three">
        <KpiCard icon="🧾" label="Total orders" value={st.orders} tone="blue" />
        <KpiCard icon="💰" label="Lifetime spend" value={money(st.spent)} tone="green" />
        <KpiCard icon="🛒" label="Avg. order value" value={money(st.orders ? st.spent / st.orders : 0)} tone="blue" />
      </div>
      <div className="grid-2 wide-left">
        <section className="panel">
          <h3>Order history</h3>
          {mine.length === 0 ? <Empty icon="🧾" title="No orders yet" /> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Delivery</th></tr></thead>
                <tbody>
                  {mine.map((o) => (
                    <tr key={o.id}><td><b>{o.id}</b></td><td>{fmtDate(o.date)}</td><td>{o.items.reduce((n, i) => n + i.qty, 0)}</td><td>{money(o.total)}</td><td><Badge>{o.status}</Badge></td><td><Badge>{o.delivery}</Badge></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="panel">
          <h3>Shopping behaviour</h3>
          {favourites.length === 0 ? <p className="muted">No data yet.</p> : (
            <ul className="bars">
              {favourites.map(([cat, n]) => (
                <li key={cat}><span>{cat}</span><div className="bar"><i style={{ width: `${(n / favourites[0][1]) * 100}%` }} /></div><b>{n}</b></li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
