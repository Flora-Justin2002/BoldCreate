import React, { useState } from 'react';
import { ColumnDirective, ColumnsDirective, GridComponent, Inject, Page, Sort } from '@syncfusion/ej2-react-grids';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { DialogComponent } from '@syncfusion/ej2-react-popups';
import { PageHeader } from '../components/Ui.jsx';
import { Field } from './Products.jsx';
import { useStore } from '../store.jsx';

const ICONS = ['🔌', '👗', '🏠', '📚', '🏋️', '🧴', '🎮', '🧸', '🚗', '🐾', '🌱', '🎨', '🍎', '💍'];
const EMPTY = { name: '', icon: '🗂️', color: '#2563eb', description: '' };

export default function Categories() {
  const { categories, products, saveCategory, deleteCategory } = useStore();
  const [view, setView] = useState('cards');
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [del, setDel] = useState(null);

  const rows = categories.map((c) => ({ ...c, count: products.filter((p) => p.category === c.name).length }));
  const open = (c) => { setForm(c ? { ...c } : { ...EMPTY }); setErrors({}); };
  const submit = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Name is required';
    else if (categories.some((c) => c.id !== form.id && c.name.toLowerCase() === form.name.trim().toLowerCase())) e.name = 'Category already exists';
    if (form.description.trim().length < 5) e.description = 'Add a short description';
    setErrors(e);
    if (Object.keys(e).length) return;
    saveCategory({ ...form, name: form.name.trim(), description: form.description.trim() });
    setForm(null);
  };

  const iconTpl = (c) => <span className="cat-ico" style={{ '--c': c.color }}>{c.icon}</span>;
  const actTpl = (c) => (
    <div className="row-actions">
      <button className="link-btn" onClick={() => open(categories.find((x) => x.id === c.id))}>✏️ Edit</button>
      <button className="link-btn danger" onClick={() => setDel(c)}>🗑️ Delete</button>
    </div>
  );

  return (
    <>
      <PageHeader title="Category Management" subtitle={`${categories.length} categories`}
        actions={
          <>
            <div className="seg" role="tablist" aria-label="View">
              <button role="tab" aria-selected={view === 'cards'} className={view === 'cards' ? 'on' : ''} onClick={() => setView('cards')}>▦ Cards</button>
              <button role="tab" aria-selected={view === 'grid'} className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')}>☰ Grid</button>
            </div>
            <ButtonComponent cssClass="e-primary" iconCss="e-icons e-plus" onClick={() => open(null)}>Add category</ButtonComponent>
          </>
        } />

      {view === 'cards' ? (
        <div className="cards-grid">
          {rows.map((c) => (
            <div className="e-card cat-card" key={c.id} style={{ '--c': c.color }}>
              <div className="e-card-header">
                <span className="cat-ico big">{c.icon}</span>
                <div className="e-card-header-caption">
                  <div className="e-card-header-title">{c.name}</div>
                  <div className="e-card-sub-title">{c.count} products</div>
                </div>
              </div>
              <div className="e-card-content muted">{c.description}</div>
              <div className="e-card-actions">
                <button className="e-card-btn" onClick={() => open(categories.find((x) => x.id === c.id))}>Edit</button>
                <button className="e-card-btn danger" onClick={() => setDel(c)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="panel flush">
          <GridComponent dataSource={rows} allowSorting allowPaging pageSettings={{ pageSize: 8 }} rowHeight={56} enableHover>
            <ColumnsDirective>
              <ColumnDirective headerText="Icon" width="80" template={iconTpl} allowSorting={false} />
              <ColumnDirective field="name" headerText="Name" width="170" />
              <ColumnDirective field="description" headerText="Description" width="380" />
              <ColumnDirective field="count" headerText="Products" width="110" textAlign="Right" headerTextAlign="Right" />
              <ColumnDirective headerText="Actions" width="170" template={actTpl} allowSorting={false} />
            </ColumnsDirective>
            <Inject services={[Page, Sort]} />
          </GridComponent>
        </div>
      )}

      <DialogComponent visible={!!form} header={form?.id ? 'Edit category' : 'Add category'} isModal showCloseIcon width="480px" close={() => setForm(null)} overlayClick={() => setForm(null)}
        footerTemplate={() => (
          <>
            <ButtonComponent onClick={() => setForm(null)}>Cancel</ButtonComponent>
            <ButtonComponent cssClass="e-primary" onClick={submit}>Save</ButtonComponent>
          </>
        )}>
        {form && (
          <div className="form-grid one">
            <Field label="Name" error={errors.name}><input value={form.name} maxLength={40} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Icon">
              <div className="icon-picker">
                {ICONS.map((i) => <button type="button" key={i} className={form.icon === i ? 'on' : ''} onClick={() => setForm({ ...form, icon: i })} aria-label={`Icon ${i}`}>{i}</button>)}
              </div>
            </Field>
            <Field label="Accent colour"><input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></Field>
            <Field label="Description" error={errors.description}><textarea rows={3} maxLength={200} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          </div>
        )}
      </DialogComponent>

      <DialogComponent visible={!!del} header="Delete category?" isModal width="400px" showCloseIcon close={() => setDel(null)} overlayClick={() => setDel(null)}
        footerTemplate={() => (
          <>
            <ButtonComponent onClick={() => setDel(null)}>Cancel</ButtonComponent>
            <ButtonComponent cssClass="e-danger" onClick={() => { deleteCategory(del.id); setDel(null); }}>Delete</ButtonComponent>
          </>
        )}>
        <p>Delete “{del?.name}”? Categories that still contain products cannot be deleted.</p>
      </DialogComponent>
    </>
  );
}
