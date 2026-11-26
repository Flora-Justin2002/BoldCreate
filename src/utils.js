import DOMPurify from 'dompurify';

export const money = (n) => (Number(n) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
export const fmtDate = (iso, opts = { year: 'numeric', month: 'short', day: 'numeric' }) => new Date(iso).toLocaleDateString('en-US', opts);
export const fmtDateTime = (iso) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
export const timeAgo = (iso) => {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso)) / 60000));
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
};

// Rich Text Editor output is user-authored HTML – always sanitize before rendering.
export const sanitize = (html) => DOMPurify.sanitize(html || '');

export const STATUS_TONE = {
  Active: 'green', Completed: 'green', Paid: 'green', Delivered: 'green', VIP: 'blue',
  Processing: 'blue', Shipped: 'blue', Packed: 'blue', 'Out for Delivery': 'blue',
  Pending: 'amber', Draft: 'gray', Inactive: 'gray', 'Out of Stock': 'red',
  Cancelled: 'red', Failed: 'red', Refunded: 'amber', Returned: 'red',
};

export const pageAnchor = (id) => `#${id}`;

/* Escape a CSV/Excel cell and neutralise formula injection */
export const safeCell = (v) => {
  const s = String(v ?? '');
  return /^[=+\-@]/.test(s) ? `'${s}` : s;
};
