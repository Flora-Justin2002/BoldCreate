import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDirective, ColumnsDirective, GridComponent, Inject, Page, Sort, Filter, Toolbar, Search } from '@syncfusion/ej2-react-grids';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { DialogComponent } from '@syncfusion/ej2-react-popups';
import { Badge, PageHeader } from '../components/Ui.jsx';
import { Field } from './Products.jsx';
import { useStore } from '../store.jsx';
import { fmtDate, money } from '../utils.js';

const EMPTY = { name: '', email: '', phone: '', city: '', address: '', zip: '', status: 'Active' };

export function Avatar({ name, size = 38 }) {
  const initials = name.split(' ').map((s) => s[0]).join('').slice(0, 2);
  const hue = [...name].reduce((h, c) => h + c.charCodeAt(0), 0) % 2 ? '#2563eb' : '#10b981';
  return <span className="avatar-sm" style={{ width: size, height: size, background: hue, fontSize: size * 0.38 }}>{initials}</span>;
}

export default function Customers() {
  const { customers, customerStats, saveCustomer, deleteCustomer } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [del, setDel] = useState(null);

  const data = useMemo(() => customers.map((c) => ({ ...c, orders: customerStats[c.id]?.orders || 0, spent: Math.round((customerStats[c.id]?.spent || 0) * 100) / 100 })), [customers, customerStats]);
  const open = (c) => { setForm(c ? { ...c } : { ...EMPTY }); setErrors({}); };
  const submit = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!/^[0-9+()\-\s]{7,20}$/.test(form.phone)) e.phone = 'Enter a valid phone';
    if (!form.city.trim()) e.city = 'Required';
    setErrors(e);
    if (Object.keys(e).length) return;
    saveCustomer(form);
    setForm(null);
  };

  const profileTpl = (c) => (
    <button className="profile-cell" onClick={() => navigate(`/customers/${c.id}`)}>
      <Avatar name={c.name} /><span className="cell-stack"><b>{c.name}</b><small className="muted">Since {fmtDate(c.joined, { month: 'short', year: 'numeric' })}</small></span>
    </button>
  );
  const actTpl = (c) => (
    <div className="row-actions">
      <button className="link-btn" onClick={() => navigate(`/customers/${c.id}`)}>👁 View</button>
      <button className="link-btn" onClick={() => open(customers.find((x) => x.id === c.id))}>✏️</button>
      <button className="link-btn danger" onClick={() => setDel(c)}>🗑️</button>
    </div>
  );

  return (
    <>
      <PageHeader title="Customer Management" subtitle={`${customers.length} customers`}
        actions={<ButtonComponent cssClass="e-primary" iconCss="e-icons e-plus" onClick={() => open(null)}>Add customer</ButtonComponent>} />
      <div className="panel flush">
        <GridComponent dataSource={data} allowPaging allowSorting allowFiltering filterSettings={{ type: 'Excel' }} toolbar={['Search']}
          pageSettings={{ pageSize: 10 }} enableHover rowHeight={60}>
          <ColumnsDirective>
            <ColumnDirective field="name" headerText="Customer" width="230" template={profileTpl} />
            <ColumnDirective field="email" headerText="Email" width="240" />
            <ColumnDirective field="phone" headerText="Phone" width="160" />
            <ColumnDirective field="orders" headerText="Orders" width="100" textAlign="Right" headerTextAlign="Right" />
            <ColumnDirective field="spent" headerText="Total spent" width="130" format="C2" textAlign="Right" headerTextAlign="Right" />
            <ColumnDirective field="status" headerText="Status" width="110" template={(c) => <Badge>{c.status}</Badge>} />
            <ColumnDirective headerText="Actions" width="160" template={actTpl} allowSorting={false} allowFiltering={false} />
          </ColumnsDirective>
          <Inject services={[Page, Sort, Filter, Toolbar, Search]} />
        </GridComponent>
      </div>

      <DialogComponent visible={!!form} header={form?.id ? 'Edit customer' : 'Add customer'} isModal showCloseIcon width="560px" close={() => setForm(null)} overlayClick={() => setForm(null)}
        footerTemplate={() => (
          <>
            <ButtonComponent onClick={() => setForm(null)}>Cancel</ButtonComponent>
            <ButtonComponent cssClass="e-primary" onClick={submit}>Save</ButtonComponent>
          </>
        )}>
        {form && (
          <div className="form-grid">
            <Field label="Full name" error={errors.name} full><input value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Email" error={errors.email}><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Phone" error={errors.phone}><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Address"><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
            <Field label="City" error={errors.city}><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Active</option><option>VIP</option><option>Inactive</option></select>
            </Field>
          </div>
        )}
      </DialogComponent>

      <DialogComponent visible={!!del} header="Remove customer?" isModal width="400px" showCloseIcon close={() => setDel(null)} overlayClick={() => setDel(null)}
        footerTemplate={() => (
          <>
            <ButtonComponent onClick={() => setDel(null)}>Cancel</ButtonComponent>
            <ButtonComponent cssClass="e-danger" onClick={() => { deleteCustomer(del.id); setDel(null); }}>Remove</ButtonComponent>
          </>
        )}>
        <p>Remove {del?.name}? Their past orders stay in the system.</p>
      </DialogComponent>
    </>
  );
}
