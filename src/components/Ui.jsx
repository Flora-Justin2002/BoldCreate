import React from 'react';
import { Link } from 'react-router-dom';
import { STATUS_TONE } from '../utils.js';

export function Badge({ children, tone }) {
  return <span className={`pill pill-${tone || STATUS_TONE[children] || 'gray'}`}>{children}</span>;
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function ProductThumb({ product, size = 44 }) {
  if (product.image) return <img className="thumb" src={product.image} alt={product.name} style={{ width: size, height: size }} />;
  return (
    <span className="thumb emoji" style={{ width: size, height: size, '--c': product.color, fontSize: size * 0.5 }} role="img" aria-label={product.name}>
      {product.icon}
    </span>
  );
}

export function ProductImage({ product, large }) {
  if (product.image) return <div className={`pimg ${large ? 'large' : ''}`}><img src={product.image} alt={product.name} /></div>;
  return (
    <div className={`pimg ${large ? 'large' : ''}`} style={{ '--c': product.color }} role="img" aria-label={product.name}>
      <span>{product.icon}</span>
    </div>
  );
}

export function Stars({ value, count }) {
  const full = Math.round(value);
  return (
    <span className="stars" aria-label={`${value} out of 5 stars`}>
      <span className="stars-on">{'★'.repeat(full)}</span><span className="stars-off">{'★'.repeat(5 - full)}</span>
      <small> {Number(value).toFixed(1)}{count != null && ` (${Number(count).toLocaleString()})`}</small>
    </span>
  );
}

export function Empty({ icon = '🔎', title, children }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

export function Breadcrumb({ items }) {
  return (
    <p className="crumbs">
      {items.map((it, i) => (
        <span key={i}>{it.to ? <Link to={it.to}>{it.label}</Link> : it.label}{i < items.length - 1 && ' / '}</span>
      ))}
    </p>
  );
}

/* KPI card – Syncfusion Card markup + sparkline-style hint */
export function KpiCard({ icon, label, value, delta, tone = 'blue', children }) {
  return (
    <div className={`e-card kpi kpi-${tone}`}>
      <div className="e-card-content kpi-body">
        <span className="kpi-icon" aria-hidden="true">{icon}</span>
        <div>
          <div className="kpi-label">{label}</div>
          <div className="kpi-value">{value}</div>
          {delta && <div className={`kpi-delta ${delta.startsWith('-') ? 'down' : 'up'}`}>{delta.startsWith('-') ? '▼' : '▲'} {delta.replace('-', '')} <span>vs last month</span></div>}
        </div>
      </div>
      {children}
    </div>
  );
}
