import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ROLES, useStore } from '../store.jsx';
import { timeAgo } from '../utils.js';

export const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['Admin', 'Store Manager'] },
  { to: '/products', label: 'Products', icon: '📦', roles: ['Admin', 'Store Manager'] },
  { to: '/categories', label: 'Categories', icon: '🗂️', roles: ['Admin', 'Store Manager'] },
  { to: '/customers', label: 'Customers', icon: '👥', roles: ['Admin', 'Store Manager'] },
  { to: '/orders', label: 'Orders', icon: '🧾', roles: ['Admin', 'Store Manager', 'Delivery Executive'] },
  { to: '/analytics', label: 'Analytics', icon: '📈', roles: ['Admin', 'Store Manager'] },
  { to: '/announcements', label: 'Announcements', icon: '📣', roles: ['Admin'] },
  { to: '/shop', label: 'Shop', icon: '🛍️', roles: ['Admin', 'Store Manager', 'Customer'] },
  { to: '/wishlist', label: 'Wishlist', icon: '❤️', roles: ['Customer'] },
  { to: '/my-orders', label: 'My Orders', icon: '🧾', roles: ['Customer'] },
];
const CUSTOMER_ONLY_ROUTES = ['/cart', '/checkout', '/confirmation'];
const NOTE_ICON = { order: '🧾', inventory: '⚠️', delivery: '🚚', payment: '💳' };

function useOutsideClick(ref, handler) {
  useEffect(() => {
    const fn = (e) => ref.current && !ref.current.contains(e.target) && handler();
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [ref, handler]);
}

export default function Layout() {
  const { role, setRole, roleInfo, theme, setTheme, count, notifications, unread, markAllRead, markRead, notify } = useStore();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sk2_collapsed') === '1');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [open, setOpen] = useState(null); // 'notif' | 'profile'
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const menuRef = useRef(null);
  useOutsideClick(menuRef, () => setOpen(null));

  useEffect(() => { localStorage.setItem('sk2_collapsed', collapsed ? '1' : '0'); }, [collapsed]);
  useEffect(() => { setMobileOpen(false); setOpen(null); window.scrollTo(0, 0); }, [pathname]);

  const items = NAV.filter((n) => n.roles.includes(role));
  const canCart = role === 'Customer';

  // role-based route guard
  const allowed =
    items.some((n) => pathname === n.to || pathname.startsWith(n.to + '/')) ||
    (canCart && CUSTOMER_ONLY_ROUTES.includes(pathname));
  useEffect(() => { if (!allowed) navigate(roleInfo.home, { replace: true }); }, [allowed, navigate, roleInfo.home]);

  const switchRole = (r) => {
    setRole(r);
    setOpen(null);
    notify('Role switched', `You are now viewing SyncKart as ${r}.`, 'Info');
    navigate(ROLES[r].home);
  };
  const search = (e) => {
    e.preventDefault();
    navigate(`/shop?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className={`shell ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`}>
      <aside className="sidebar" aria-label="Main navigation">
        <Link to={roleInfo.home} className="brand" aria-label="SyncKart home">
          <span className="brand-mark">S</span>
          <span className="brand-text">Sync<b>Kart</b></span>
        </Link>
        <nav>
          {items.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title={n.label}>
              <span className="nav-icon" aria-hidden="true">{n.icon}</span>
              <span className="nav-label">{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <span className="role-chip">{role}</span>
        </div>
      </aside>
      {mobileOpen && <div className="scrim" onClick={() => setMobileOpen(false)} />}

      <div className="main-col">
        <header className="topbar">
          <button className="icon-btn" onClick={() => (window.innerWidth <= 900 ? setMobileOpen((v) => !v) : setCollapsed((v) => !v))} aria-label="Toggle sidebar">☰</button>

          <form className="search" onSubmit={search} role="search">
            <span aria-hidden="true">🔍</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" aria-label="Search products" />
          </form>

          <div className="topbar-actions" ref={menuRef}>
            <button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            <div className="menu-wrap">
              <button className="icon-btn" onClick={() => setOpen(open === 'notif' ? null : 'notif')} aria-label={`Notifications, ${unread} unread`} aria-expanded={open === 'notif'}>
                🔔{unread > 0 && <span className="badge">{unread}</span>}
              </button>
              {open === 'notif' && (
                <div className="popover notif">
                  <div className="popover-head"><b>Notifications</b><button className="link-btn" onClick={markAllRead}>Mark all read</button></div>
                  <ul>
                    {notifications.slice(0, 8).map((n) => (
                      <li key={n.id} className={n.read ? '' : 'unread'}>
                        <button onClick={() => { markRead(n.id); setOpen(null); if (n.link && items.some((i) => i.to === n.link)) navigate(n.link); }}>
                          <span className="n-icon">{NOTE_ICON[n.type] || '🔔'}</span>
                          <span><b>{n.title}</b><small>{n.text}</small><em>{timeAgo(n.time)}</em></span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {canCart && (
              <Link to="/cart" className="icon-btn" aria-label={`Cart, ${count} items`}>
                🛒{count > 0 && <span className="badge green">{count}</span>}
              </Link>
            )}

            <div className="menu-wrap">
              <button className="profile-btn" onClick={() => setOpen(open === 'profile' ? null : 'profile')} aria-expanded={open === 'profile'} aria-label="User profile">
                <span className="avatar">{roleInfo.initials}</span>
                <span className="who"><b>{roleInfo.user}</b><small>{role}</small></span>
              </button>
              {open === 'profile' && (
                <div className="popover profile">
                  <div className="popover-head col"><b>{roleInfo.user}</b><small>{roleInfo.email}</small></div>
                  <div className="role-list" role="group" aria-label="Switch role">
                    <small className="muted">Switch role (demo)</small>
                    {Object.keys(ROLES).map((r) => (
                      <button key={r} className={r === role ? 'on' : ''} onClick={() => switchRole(r)}>{r === role ? '✓ ' : ''}{r}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
