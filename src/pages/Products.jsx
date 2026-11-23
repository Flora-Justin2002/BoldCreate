import React, { useMemo, useRef, useState } from 'react';
import {
  ColumnDirective, ColumnsDirective, GridComponent, Inject, Page, Sort, Filter, Toolbar, Search, Resize, ColumnMenu,
} from '@syncfusion/ej2-react-grids';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { DialogComponent } from '@syncfusion/ej2-react-popups';
import { UploaderComponent } from '@syncfusion/ej2-react-inputs';
import { Badge, PageHeader, ProductThumb, Stars } from '../components/Ui.jsx';
import { useStore } from '../store.jsx';
import { LOW_STOCK } from '../seed.js';
import { money } from '../utils.js';

const EMPTY = { name: '', category: '', brand: '', price: '', stock: '', discount: 0, rating: 4, status: 'Active', description: '', image: null, icon: '📦', color: '#2563eb' };
const MAX_IMG = 1.5 * 1024 * 1024;

export default function Products() {
  const { products, categories, saveProduct, deleteProduct, notify } = useStore();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [del, setDel] = useState(null);
  const grid = useRef(null);

  const open = (p) => { setForm(p ? { ...p } : { ...EMPTY, category: categories[0]?.name || '' }); setErrors({}); };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Name is required';
    if (!form.category) e.category = 'Choose a category';
    if (!form.brand.trim()) e.brand = 'Brand is required';
    if (!(Number(form.price) > 0)) e.price = 'Enter a price above 0';
    if (!(Number(form.stock) >= 0) || form.stock === '') e.stock = 'Enter stock quantity';
    setErrors(e);
    if (Object.keys(e).length) return;
    saveProduct({ ...form, name: form.name.trim(), brand: form.brand.trim() });
    setForm(null);
  };

  // Product image upload (client-side, validated, stored as data URL for the demo)
  const onFile = (args) => {
    const raw = args.filesData?.[0]?.rawFile;
    if (!raw) return;
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(raw.type)) return notify('Invalid file', 'Please choose a PNG, JPG, WEBP or GIF image.', 'Error');
    if (raw.size > MAX_IMG) return notify('File too large', 'Images must be under 1.5 MB.', 'Error');
    const r = new FileReader();
    r.onload = () => { setForm((f) => ({ ...f, image: r.result })); notify('Image uploaded', raw.name); };
    r.readAsDataURL(raw);
  };

  const data = useMemo(() => products.map((p) => ({ ...p })), [products]);
  const lowCount = products.filter((p) => p.stock <= LOW_STOCK && p.status !== 'Draft').length;

  const imageTpl = (p) => <ProductThumb product={p} />;
  const nameTpl = (p) => <div className="cell-stack"><b>{p.name}</b><small className="muted">{p.sku}</small></div>;
  const priceTpl = (p) => (p.discount ? <span><b>{money(p.price * (1 - p.discount / 100))}</b> <s className="muted">{money(p.price)}</s></span> : <b>{money(p.price)}</b>);
  const stockTpl = (p) => <span className={p.stock === 0 ? 'txt-red' : p.stock <= LOW_STOCK ? 'txt-amber' : ''}>{p.stock}{p.stock <= LOW_STOCK && p.status !== 'Draft' ? ' ⚠️' : ''}</span>;
  const ratingTpl = (p) => <Stars value={p.rating} />;
  const statusTpl = (p) => <Badge>{p.status}</Badge>;
  const actionTpl = (p) => (
    <div className="row-actions">
      <button className="link-btn" onClick={() => open(p)} aria-label={`Edit ${p.name}`}>✏️ Edit</button>
      <button className="link-btn danger" onClick={() => setDel(p)} aria-label={`Delete ${p.name}`}>🗑️ Delete</button>
    </div>
  );

  return (
    <>
      <PageHeader title="Product Management" subtitle={`${products.length} products · ${lowCount} need restocking`}
        actions={<ButtonComponent cssClass="e-primary" iconCss="e-icons e-plus" onClick={() => open(null)}>Add product</ButtonComponent>} />
      <div className="panel flush">
        <GridComponent ref={grid} dataSource={data} allowPaging allowSorting allowFiltering allowResizing showColumnMenu
          pageSettings={{ pageSize: 8, pageSizes: [8, 15, 30] }} filterSettings={{ type: 'Excel' }} toolbar={['Search']}
          searchSettings={{ fields: ['name', 'category', 'brand', 'sku', 'status'] }} enableHover rowHeight={60} width="100%">
          <ColumnsDirective>
            <ColumnDirective headerText="Image" width="80" template={imageTpl} allowSorting={false} allowFiltering={false} />
            <ColumnDirective field="name" headerText="Product" width="230" template={nameTpl} />
            <ColumnDirective field="category" headerText="Category" width="140" />
            <ColumnDirective field="brand" headerText="Brand" width="130" />
            <ColumnDirective field="price" headerText="Price" width="130" format="C2" textAlign="Right" headerTextAlign="Right" template={priceTpl} />
            <ColumnDirective field="stock" headerText="Stock" width="100" textAlign="Right" headerTextAlign="Right" template={stockTpl} />
            <ColumnDirective field="rating" headerText="Rating" width="150" template={ratingTpl} />
            <ColumnDirective field="status" headerText="Status" width="130" template={statusTpl} />
            <ColumnDirective headerText="Actions" width="170" template={actionTpl} allowSorting={false} allowFiltering={false} />
          </ColumnsDirective>
          <Inject services={[Page, Sort, Filter, Toolbar, Search, Resize, ColumnMenu]} />
        </GridComponent>
      </div>

      <DialogComponent visible={!!form} header={form?.id ? 'Edit product' : 'Add product'} isModal showCloseIcon width="620px" cssClass="sk-dialog"
        close={() => setForm(null)} overlayClick={() => setForm(null)} allowDragging={false}
        footerTemplate={() => (
          <>
            <ButtonComponent onClick={() => setForm(null)}>Cancel</ButtonComponent>
            <ButtonComponent cssClass="e-primary" onClick={submit}>{form?.id ? 'Save changes' : 'Create product'}</ButtonComponent>
          </>
        )}>
        {form && (
          <div className="form-grid">
            <Field label="Product name" error={errors.name} full><input value={form.name} onChange={set('name')} maxLength={120} /></Field>
            <Field label="Category" error={errors.category}>
              <select value={form.category} onChange={set('category')}>{categories.map((c) => <option key={c.id}>{c.name}</option>)}</select>
            </Field>
            <Field label="Brand" error={errors.brand}><input value={form.brand} onChange={set('brand')} maxLength={60} /></Field>
            <Field label="Price (USD)" error={errors.price}><input type="number" min="0" step="0.01" value={form.price} onChange={set('price')} /></Field>
            <Field label="Stock quantity" error={errors.stock}><input type="number" min="0" step="1" value={form.stock} onChange={set('stock')} /></Field>
            <Field label="Discount (%)"><input type="number" min="0" max="90" value={form.discount} onChange={set('discount')} /></Field>
            <Field label="Status">
              <select value={form.status === 'Draft' ? 'Draft' : 'Active'} onChange={set('status')}><option value="Active">Active (auto stock status)</option><option value="Draft">Draft (hidden)</option></select>
            </Field>
            <Field label="Description" full><textarea rows={3} value={form.description} onChange={set('description')} maxLength={600} /></Field>
            <div className="field full">
              <label>Product image</label>
              <div className="upload-row">
                <ProductThumb product={form} size={64} />
                <div className="grow">
                  <UploaderComponent autoUpload={false} multiple={false} allowedExtensions=".png,.jpg,.jpeg,.webp,.gif" selected={onFile} showFileList={false}
                    buttons={{ browse: 'Upload image' }} dropArea=".upload-row" />
                  <small className="muted">PNG, JPG, WEBP or GIF · up to 1.5 MB. Drag &amp; drop supported.</small>
                  {form.image && <button className="link-btn danger" type="button" onClick={() => setForm((f) => ({ ...f, image: null }))}>Remove image</button>}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogComponent>

      <DialogComponent visible={!!del} header="Delete product?" isModal width="400px" showCloseIcon close={() => setDel(null)} overlayClick={() => setDel(null)}
        footerTemplate={() => (
          <>
            <ButtonComponent onClick={() => setDel(null)}>Cancel</ButtonComponent>
            <ButtonComponent cssClass="e-danger" onClick={() => { deleteProduct(del.id); setDel(null); }}>Delete</ButtonComponent>
          </>
        )}>
        <p>“{del?.name}” will be permanently removed from the catalog.</p>
      </DialogComponent>
    </>
  );
}

export function Field({ label, error, full, children }) {
  return (
    <div className={`field ${full ? 'full' : ''}`}>
      <label>{label}</label>
      {children}
      {error && <small className="err">{error}</small>}
    </div>
  );
}
