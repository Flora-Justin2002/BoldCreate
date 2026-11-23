import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ToastComponent } from '@syncfusion/ej2-react-notifications';
import {
  CURRENT_CUSTOMER_ID, DELIVERY_STATUSES, DRIVERS, LOW_STOCK, SEED_CATEGORIES, SEED_CUSTOMERS, SEED_NOTIFICATIONS,
  SEED_ORDERS, SEED_PRODUCTS, SEED_SLOTS, round2,
} from './seed.js';

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

export const TAX_RATE = 0.08;
export const FREE_SHIPPING_OVER = 100;
export const DELIVERY_OPTIONS = [
  { id: 'standard', label: 'Standard delivery', eta: '3–5 business days', price: 0, icon: '🚚' },
  { id: 'express', label: 'Express delivery', eta: '1–2 business days', price: 12.99, icon: '⚡' },
  { id: 'same-day', label: 'Same-day delivery', eta: 'Today, 6–10 PM', price: 19.99, icon: '🛵' },
];

export const ROLES = {
  Admin: { label: 'Admin', home: '/dashboard', user: 'Alex Morgan', email: 'alex.morgan@synckart.com', initials: 'AM' },
  'Store Manager': { label: 'Store Manager', home: '/dashboard', user: 'Sara Whitfield', email: 'sara.w@synckart.com', initials: 'SW' },
  'Delivery Executive': { label: 'Delivery Executive', home: '/orders', user: 'Marcus Lee', email: 'marcus.lee@synckart.com', initials: 'ML' },
  Customer: { label: 'Customer', home: '/shop', user: 'Jane Doe', email: 'jane.doe@example.com', initials: 'JD' },
};

export const price = (p) => round2(p.price * (1 - (p.discount || 0) / 100));

function usePersisted(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota (e.g. big images) – ignore */ }
  }, [key, value]);
  return [value, setValue];
}

const V = 'sk2_';
const nowIso = () => new Date().toISOString();

export function StoreProvider({ children }) {
  const [role, setRole] = usePersisted(V + 'role', 'Admin');
  const [theme, setTheme] = usePersisted(V + 'theme', 'light');
  const [products, setProducts] = usePersisted(V + 'products', SEED_PRODUCTS);
  const [categories, setCategories] = usePersisted(V + 'categories', SEED_CATEGORIES);
  const [customers, setCustomers] = usePersisted(V + 'customers', SEED_CUSTOMERS);
  const [orders, setOrders] = usePersisted(V + 'orders', SEED_ORDERS);
  const [slots, setSlots] = usePersisted(V + 'slots', SEED_SLOTS);
  const [notifications, setNotifications] = usePersisted(V + 'notifications', SEED_NOTIFICATIONS);
  const [wishlist, setWishlist] = usePersisted(V + 'wishlist', [3, 8, 14]);
  const [cart, setCart] = usePersisted(V + 'cart', []);
  const [lastOrder, setLastOrder] = usePersisted(V + 'lastOrder', null);
  const [announcement, setAnnouncement] = usePersisted(
    V + 'announcement',
    '<p><strong>Winter Sale is live!</strong> Enjoy up to <em>20% off</em> on selected electronics and fashion. Free shipping on orders over $100.</p>'
  );
  const toast = useRef(null);

  /* ---- theme ---- */
  useEffect(() => {
    document.body.classList.toggle('e-dark-mode', theme === 'dark');
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  const chartTheme = theme === 'dark' ? 'Tailwind3Dark' : 'Tailwind3';

  /* ---- feedback ---- */
  const notify = useCallback((title, content, type = 'Success') => {
    const cssClass = { Success: 'e-toast-success', Error: 'e-toast-danger', Info: 'e-toast-info', Warning: 'e-toast-warning' }[type];
    toast.current?.show({ title, content, cssClass });
  }, []);
  const pushNotification = useCallback((n) => {
    setNotifications((list) => [{ id: Date.now() + Math.random(), time: nowIso(), read: false, ...n }, ...list].slice(0, 40));
  }, [setNotifications]);
  const markAllRead = () => setNotifications((l) => l.map((n) => ({ ...n, read: true })));
  const markRead = (id) => setNotifications((l) => l.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const unread = notifications.filter((n) => !n.read).length;

  const stockAlert = useCallback((product, stock) => {
    if (stock <= 0) pushNotification({ type: 'inventory', title: 'Out of stock', text: `${product.name} is out of stock`, link: '/products' });
    else if (stock <= LOW_STOCK) pushNotification({ type: 'inventory', title: 'Inventory alert', text: `${product.name} – only ${stock} left`, link: '/products' });
  }, [pushNotification]);

  /* ---- products ---- */
  const saveProduct = (data) => {
    const stock = Number(data.stock) || 0;
    const status = data.status === 'Draft' ? 'Draft' : stock === 0 ? 'Out of Stock' : 'Active';
    const clean = { ...data, price: Number(data.price) || 0, stock, discount: Number(data.discount) || 0, rating: Number(data.rating) || 4, status };
    if (clean.id) {
      setProducts((l) => l.map((p) => (p.id === clean.id ? { ...p, ...clean } : p)));
      stockAlert(clean, stock);
      notify('Product updated', clean.name);
    } else {
      const id = Math.max(0, ...products.map((p) => p.id)) + 1;
      const full = {
        icon: '📦', color: '#2563eb', specs: {}, reviews: 0, featured: false, image: null,
        sku: `SK-${String(id).padStart(4, '0')}`, ...clean, id,
      };
      setProducts((l) => [full, ...l]);
      stockAlert(full, stock);
      notify('Product created', clean.name);
    }
  };
  const deleteProduct = (id) => {
    const p = products.find((x) => x.id === id);
    setProducts((l) => l.filter((x) => x.id !== id));
    setCart((c) => c.filter((i) => i.id !== id));
    setWishlist((w) => w.filter((x) => x !== id));
    notify('Product deleted', p?.name || '', 'Info');
  };

  /* ---- categories ---- */
  const saveCategory = (data) => {
    if (data.id) {
      const old = categories.find((c) => c.id === data.id);
      setCategories((l) => l.map((c) => (c.id === data.id ? { ...c, ...data } : c)));
      if (old && old.name !== data.name) setProducts((l) => l.map((p) => (p.category === old.name ? { ...p, category: data.name } : p)));
      notify('Category updated', data.name);
    } else {
      setCategories((l) => [...l, { ...data, id: Math.max(0, ...l.map((c) => c.id)) + 1 }]);
      notify('Category created', data.name);
    }
  };
  const deleteCategory = (id) => {
    const c = categories.find((x) => x.id === id);
    if (products.some((p) => p.category === c.name)) return notify('Cannot delete', `"${c.name}" still has products assigned.`, 'Warning');
    setCategories((l) => l.filter((x) => x.id !== id));
    notify('Category deleted', c.name, 'Info');
  };

  /* ---- customers ---- */
  const saveCustomer = (data) => {
    if (data.id) setCustomers((l) => l.map((c) => (c.id === data.id ? { ...c, ...data } : c)));
    else setCustomers((l) => [...l, { ...data, id: Math.max(0, ...l.map((c) => c.id)) + 1, joined: nowIso() }]);
    notify(data.id ? 'Customer updated' : 'Customer added', data.name);
  };
  const deleteCustomer = (id) => {
    setCustomers((l) => l.filter((c) => c.id !== id));
    notify('Customer removed', '', 'Info');
  };
  const customerStats = useMemo(() => {
    const m = {};
    orders.forEach((o) => {
      if (o.status === 'Cancelled') return;
      const s = (m[o.customerId] ||= { orders: 0, spent: 0, last: null });
      s.orders += 1; s.spent += o.total;
      if (!s.last || o.date > s.last) s.last = o.date;
    });
    return m;
  }, [orders]);

  /* ---- wishlist ---- */
  const toggleWishlist = (id) => {
    const has = wishlist.includes(id);
    setWishlist((w) => (has ? w.filter((x) => x !== id) : [...w, id]));
    notify(has ? 'Removed from wishlist' : 'Saved to wishlist', products.find((p) => p.id === id)?.name || '', 'Info');
  };

  /* ---- cart ---- */
  const addToCart = (product, qty = 1) => {
    if (product.stock <= 0 || product.status === 'Draft') return notify('Unavailable', `${product.name} is not available.`, 'Warning');
    setCart((c) => {
      const found = c.find((i) => i.id === product.id);
      if (found) return c.map((i) => (i.id === product.id ? { ...i, qty: Math.min(i.qty + qty, product.stock, 99) } : i));
      return [...c, { id: product.id, qty: Math.min(qty, product.stock) }];
    });
    notify('Added to cart', `${product.name} × ${qty}`);
  };
  const setQty = (id, qty) => {
    const p = products.find((x) => x.id === id);
    setCart((c) => c.map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(qty, 99, p?.stock || 99)) } : i)));
  };
  const removeFromCart = (id) => setCart((c) => c.filter((i) => i.id !== id));
  const clearCart = () => setCart([]);

  const lines = useMemo(
    () => cart.map((i) => ({ ...i, product: products.find((p) => p.id === i.id) })).filter((l) => l.product),
    [cart, products]
  );
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const listTotal = round2(lines.reduce((s, l) => s + l.qty * l.product.price, 0));
  const subtotal = round2(lines.reduce((s, l) => s + l.qty * price(l.product), 0));
  const savings = round2(listTotal - subtotal);
  const baseShipping = subtotal === 0 || subtotal >= FREE_SHIPPING_OVER ? 0 : 7.99;
  const totalsFor = (optionId = 'standard') => {
    const opt = DELIVERY_OPTIONS.find((o) => o.id === optionId) || DELIVERY_OPTIONS[0];
    const shipping = round2(opt.price + (opt.id === 'standard' ? baseShipping : 0));
    const tax = round2(subtotal * TAX_RATE);
    return { shipping, tax, total: round2(subtotal + shipping + tax), option: opt };
  };

  /* ---- payment gateway (mock "SyncPay") ---- */
  const chargeCard = (payment, amount) =>
    new Promise((resolve) => {
      setTimeout(() => {
        const digits = (payment.cardNumber || '').replace(/\s/g, '');
        if (payment.method === 'card') {
          if (digits === '4000000000000002') return resolve({ ok: false, error: 'Card declined by issuer (test card 4000 0000 0000 0002).' });
          if (digits === '4000000000009995') return resolve({ ok: false, error: 'Insufficient funds.' });
        }
        resolve({ ok: true, txn: `SP-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`, amount });
      }, 1600);
    });

  const placeOrder = ({ customer, shipping: addr, deliveryId, payment, txn }) => {
    const t = totalsFor(deliveryId);
    const seq = Math.max(...orders.map((o) => Number(o.id.split('-')[1])), 10000) + 1;
    const slot = new Date(Date.now() + (deliveryId === 'same-day' ? 0.2 : deliveryId === 'express' ? 1 : 3) * 86400000);
    slot.setMinutes(0, 0, 0); slot.setHours(Math.min(Math.max(slot.getHours() + 1, 9), 18));
    const driver = DRIVERS[seq % DRIVERS.length];
    const order = {
      id: `SK-${seq}`,
      customerId: CURRENT_CUSTOMER_ID,
      date: nowIso(),
      items: lines.map((l) => ({ productId: l.product.id, name: l.product.name, category: l.product.category, brand: l.product.brand, qty: l.qty, price: price(l.product) })),
      subtotal, shipping: t.shipping, tax: t.tax, total: t.total,
      status: 'Processing',
      payment: payment.method === 'cod' ? 'Pending' : 'Paid',
      paymentMethod: { card: 'Credit Card', paypal: 'PayPal', upi: 'UPI', cod: 'Cash on Delivery' }[payment.method],
      txn: txn || null,
      delivery: 'Pending',
      driver: driver.name,
      address: `${addr.address}, ${addr.city} ${addr.zip}`,
      city: addr.city,
      slotStart: slot.toISOString(),
      slotEnd: new Date(slot.getTime() + 2 * 3600000).toISOString(),
      deliveryOption: t.option.label.split(' ')[0],
      contact: customer,
    };
    setOrders((l) => [...l, order]);
    setSlots((l) => [...l, {
      Id: Math.max(0, ...l.map((s) => s.Id)) + 1, Subject: `${order.id} · ${customer.name}`, StartTime: order.slotStart, EndTime: order.slotEnd,
      Location: order.address, Description: `${order.items.length} item(s) · ${order.deliveryOption} delivery`, DriverId: driver.id, OrderId: order.id,
    }]);
    // decrement stock + inventory alerts
    setProducts((list) => list.map((p) => {
      const line = lines.find((l) => l.product.id === p.id);
      if (!line) return p;
      const stock = Math.max(0, p.stock - line.qty);
      stockAlert(p, stock);
      return { ...p, stock, status: p.status === 'Draft' ? 'Draft' : stock === 0 ? 'Out of Stock' : 'Active' };
    }));
    pushNotification({ type: 'order', title: 'New order received', text: `${order.id} · ${customer.name} · $${order.total.toFixed(2)}`, link: '/orders' });
    if (payment.method !== 'cod') pushNotification({ type: 'payment', title: 'Payment received', text: `$${order.total.toFixed(2)} captured via SyncPay (${txn})`, link: '/orders' });
    setLastOrder(order);
    clearCart();
    return order;
  };

  /* ---- delivery ---- */
  const updateDelivery = (orderId, delivery, silent) => {
    const i = DELIVERY_STATUSES.indexOf(delivery);
    if (i < 0) return;
    setOrders((l) => l.map((o) => {
      if (o.id !== orderId || o.status === 'Cancelled') return o;
      const status = delivery === 'Delivered' ? 'Completed' : i >= 2 ? 'Shipped' : 'Processing';
      const payment = delivery === 'Delivered' && o.payment === 'Pending' ? 'Paid' : o.payment;
      return { ...o, delivery, status, payment };
    }));
    if (!silent) {
      notify('Delivery updated', `${orderId} → ${delivery}`);
      pushNotification({ type: 'delivery', title: `Order ${delivery}`, text: `${orderId} moved to "${delivery}"`, link: '/orders' });
    }
  };
  const cancelOrder = (orderId) => {
    setOrders((l) => l.map((o) => (o.id === orderId ? { ...o, status: 'Cancelled', payment: o.payment === 'Paid' ? 'Refunded' : 'Failed', delivery: 'Pending' } : o)));
    notify('Order cancelled', orderId, 'Info');
  };
  const reassignSlot = (orderId, start, end) =>
    setOrders((l) => l.map((o) => (o.id === orderId ? { ...o, slotStart: new Date(start).toISOString(), slotEnd: new Date(end).toISOString() } : o)));

  const value = {
    role, setRole, roleInfo: ROLES[role], theme, setTheme, chartTheme,
    products, categories, customers, orders, slots, setSlots, notifications, wishlist, announcement, setAnnouncement,
    cart, lines, count, subtotal, listTotal, savings, totalsFor, lastOrder,
    notify, markAllRead, markRead, unread,
    saveProduct, deleteProduct, saveCategory, deleteCategory, saveCustomer, deleteCustomer, customerStats,
    toggleWishlist, addToCart, setQty, removeFromCart, clearCart,
    chargeCard, placeOrder, updateDelivery, cancelOrder, reassignSlot,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <ToastComponent ref={toast} position={{ X: 'Right', Y: 'Top' }} timeOut={3000} showCloseButton newestOnTop />
    </Ctx.Provider>
  );
}
