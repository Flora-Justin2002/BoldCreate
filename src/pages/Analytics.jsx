import React, { useMemo, useRef, useState } from 'react';
import {
  ChartComponent, SeriesCollectionDirective, SeriesDirective, Inject, ColumnSeries, StackingColumnSeries, SplineAreaSeries, BarSeries, Category, Legend, Tooltip, DataLabel,
  Export as ChartExport,
} from '@syncfusion/ej2-react-charts';
import { PivotViewComponent, Inject as PInject, FieldList, GroupingBar, PivotChart, CalculatedField, PDFExport, ExcelExport as PivotExcelExport } from '@syncfusion/ej2-react-pivotview';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { PdfDocument, PdfStandardFont, PdfFontFamily, PdfFontStyle, PdfBrush, PdfGrid, PdfPageOrientation } from '@syncfusion/ej2-pdf-export';
import { PageHeader } from '../components/Ui.jsx';
import { useStore } from '../store.jsx';
import { useSalesData } from './Dashboard.jsx';
import { safeCell } from '../utils.js';
import { LOW_STOCK } from '../seed.js';

const TABS = ['Sales', 'Customers', 'Inventory', 'Revenue', 'Pivot'];

export default function Analytics() {
  const { orders, products, customers, customerStats, chartTheme, notify } = useStore();
  const [tab, setTab] = useState('Sales');
  const chart = useRef(null);
  const pivot = useRef(null);
  const { valid, monthly, cats } = useSalesData(orders);

  const pivotData = useMemo(() => valid.flatMap((o) => {
    const d = new Date(o.date);
    return o.items.map((it) => ({
      Category: it.category, Product: it.name, Brand: it.brand || 'Other', Month: d.toLocaleString('en-US', { month: 'short' }), Year: String(d.getFullYear()),
      Payment: o.paymentMethod, City: o.city || o.address.split(',').slice(-1)[0].trim().replace(/\s*\d+$/, ''), Units: it.qty, Revenue: Math.round(it.qty * it.price * 100) / 100,
    }));
  }), [valid]);

  const payments = useMemo(() => {
    const m = {};
    valid.forEach((o) => { m[o.paymentMethod] = (m[o.paymentMethod] || 0) + o.total; });
    return Object.entries(m).map(([method, revenue]) => ({ method, revenue: Math.round(revenue) }));
  }, [valid]);

  const segments = useMemo(() => {
    const seg = { New: 0, Returning: 0, Loyal: 0, VIP: 0 };
    customers.forEach((c) => {
      const n = customerStats[c.id]?.orders || 0;
      if (c.status === 'VIP') seg.VIP += 1; else if (n >= 8) seg.Loyal += 1; else if (n >= 3) seg.Returning += 1; else seg.New += 1;
    });
    return Object.entries(seg).map(([segment, count]) => ({ segment, count }));
  }, [customers, customerStats]);

  const topSpenders = useMemo(() => customers.map((c) => ({ name: c.name.split(' ')[0] + ' ' + (c.name.split(' ')[1]?.[0] || '') + '.', spent: Math.round(customerStats[c.id]?.spent || 0) })).sort((a, b) => b.spent - a.spent).slice(0, 8), [customers, customerStats]);

  const stock = useMemo(() => cats.map((c) => c.category).map((category) => {
    const ps = products.filter((p) => p.category === category && p.status !== 'Draft');
    return { category, inStock: ps.filter((p) => p.stock > LOW_STOCK).length, low: ps.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK).length, out: ps.filter((p) => p.stock === 0).length };
  }), [cats, products]);

  const tabData = {
    Sales: { name: 'sales-by-month', rows: monthly.map((m) => ({ Month: m.month, Orders: m.orders, Revenue: m.revenue })) },
    Customers: { name: 'customer-segments', rows: segments.map((s) => ({ Segment: s.segment, Customers: s.count })) },
    Inventory: { name: 'inventory', rows: products.map((p) => ({ SKU: p.sku, Product: p.name, Category: p.category, Stock: p.stock, Status: p.status })) },
    Revenue: { name: 'revenue-by-category', rows: cats.map((c) => ({ Category: c.category, Revenue: c.sales })) },
  };

  /* ---- exports ---- */
  const exportExcel = () => {
    if (tab === 'Pivot') return pivot.current?.excelExport();
    const { name, rows } = tabData[tab];
    const headers = Object.keys(rows[0] || {});
    // Chart module's Excel export covers the visual; for tabular data we export a safe CSV
    const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => `"${safeCell(r[h]).replace(/"/g, '""')}"`).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `synckart-${name}.csv` });
    a.click(); URL.revokeObjectURL(url);
    notify('Exported', `${name}.csv (opens in Excel)`);
  };
  const exportXlsxChart = () => chart.current?.exportModule?.export('XLSX', `synckart-${tab.toLowerCase()}`);
  const exportPdf = () => {
    if (tab === 'Pivot') return pivot.current?.pdfExport();
    const { name, rows } = tabData[tab];
    const doc = new PdfDocument();
    doc.pageSettings.orientation = PdfPageOrientation.Portrait;
    const page = doc.pages.add();
    page.graphics.drawString(`SyncKart – ${tab} report`, new PdfStandardFont(PdfFontFamily.Helvetica, 18, PdfFontStyle.Bold), new PdfBrush({ r: 37, g: 99, b: 235 }), { x: 0, y: 0, width: 500, height: 30 });
    page.graphics.drawString(`Generated ${new Date().toLocaleString()}`, new PdfStandardFont(PdfFontFamily.Helvetica, 9), new PdfBrush({ r: 100, g: 116, b: 139 }), { x: 0, y: 26, width: 500, height: 16 });
    const grid = new PdfGrid();
    const headers = Object.keys(rows[0] || {});
    grid.columns.add(headers.length);
    const hr = grid.headers.add(1);
    headers.forEach((h, i) => { hr.cells.getCell(i).value = h; });
    rows.forEach((r) => {
      const row = grid.rows.addRow();
      headers.forEach((h, i) => { row.cells.getCell(i).value = String(r[h]); });
    });
    grid.draw(page, { x: 0, y: 55 });
    doc.save(`synckart-${name}.pdf`);
    doc.destroy();
    notify('Exported', `${name}.pdf`);
  };

  const axis = { majorGridLines: { width: 0 } };
  const common = { theme: chartTheme, background: 'transparent', height: '380', tooltip: { enable: true }, legendSettings: { visible: true }, chartArea: { border: { width: 0 } } };
  const svc = [ColumnSeries, StackingColumnSeries, SplineAreaSeries, BarSeries, Category, Legend, Tooltip, DataLabel, ChartExport];

  return (
    <>
      <PageHeader title="Analytics" subtitle="Sales, customers, inventory and revenue insights"
        actions={
          <>
            <ButtonComponent iconCss="e-icons e-export-excel" onClick={exportExcel}>Export Excel</ButtonComponent>
            <ButtonComponent iconCss="e-icons e-export-pdf" cssClass="e-primary" onClick={exportPdf}>Export PDF</ButtonComponent>
          </>
        } />
      <div className="seg wide" role="tablist">
        {TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      {tab === 'Sales' && (
        <section className="panel">
          <div className="section-head"><h3>Monthly sales</h3><button className="link-btn" onClick={exportXlsxChart}>Chart → XLSX</button></div>
          <ChartComponent ref={chart} {...common} primaryXAxis={{ valueType: 'Category', ...axis }} primaryYAxis={{ labelFormat: '${value}' }}>
            <Inject services={svc} />
            <SeriesCollectionDirective>
              <SeriesDirective dataSource={monthly} xName="month" yName="revenue" name="Revenue" type="SplineArea" fill="#2563eb" opacity={0.35} border={{ width: 3, color: '#2563eb' }} />
              <SeriesDirective dataSource={monthly} xName="month" yName="orders" name="Orders" type="Column" fill="#10b981" />
            </SeriesCollectionDirective>
          </ChartComponent>
        </section>
      )}

      {tab === 'Customers' && (
        <div className="grid-2">
          <section className="panel"><h3>Customer segments</h3>
            <ChartComponent ref={chart} {...common} primaryXAxis={{ valueType: 'Category', ...axis }}>
              <Inject services={svc} />
              <SeriesCollectionDirective><SeriesDirective dataSource={segments} xName="segment" yName="count" name="Customers" type="Column" fill="#2563eb" marker={{ dataLabel: { visible: true, position: 'Top' } }} /></SeriesCollectionDirective>
            </ChartComponent>
          </section>
          <section className="panel"><h3>Top spenders</h3>
            <ChartComponent {...common} primaryXAxis={{ valueType: 'Category', ...axis }} primaryYAxis={{ labelFormat: '${value}' }}>
              <Inject services={svc} />
              <SeriesCollectionDirective><SeriesDirective dataSource={topSpenders} xName="name" yName="spent" name="Spend" type="Bar" fill="#10b981" /></SeriesCollectionDirective>
            </ChartComponent>
          </section>
        </div>
      )}

      {tab === 'Inventory' && (
        <section className="panel"><h3>Stock health by category</h3>
          <ChartComponent ref={chart} {...common} primaryXAxis={{ valueType: 'Category', ...axis }}>
            <Inject services={svc} />
            <SeriesCollectionDirective>
              <SeriesDirective dataSource={stock} xName="category" yName="inStock" name="Healthy" type="StackingColumn" fill="#10b981" />
              <SeriesDirective dataSource={stock} xName="category" yName="low" name="Low stock" type="StackingColumn" fill="#f59e0b" />
              <SeriesDirective dataSource={stock} xName="category" yName="out" name="Out of stock" type="StackingColumn" fill="#ef4444" />
            </SeriesCollectionDirective>
          </ChartComponent>
        </section>
      )}

      {tab === 'Revenue' && (
        <div className="grid-2">
          <section className="panel"><h3>Revenue by category</h3>
            <ChartComponent ref={chart} {...common} primaryXAxis={{ valueType: 'Category', ...axis }} primaryYAxis={{ labelFormat: '${value}' }}>
              <Inject services={svc} />
              <SeriesCollectionDirective><SeriesDirective dataSource={cats} xName="category" yName="sales" name="Revenue" type="Column" fill="#2563eb" /></SeriesCollectionDirective>
            </ChartComponent>
          </section>
          <section className="panel"><h3>Revenue by payment method</h3>
            <ChartComponent {...common} primaryXAxis={{ valueType: 'Category', ...axis }} primaryYAxis={{ labelFormat: '${value}' }}>
              <Inject services={svc} />
              <SeriesCollectionDirective><SeriesDirective dataSource={payments} xName="method" yName="revenue" name="Revenue" type="Bar" fill="#10b981" /></SeriesCollectionDirective>
            </ChartComponent>
          </section>
        </div>
      )}

      {tab === 'Pivot' && (
        <section className="panel">
          <h3>Sales pivot</h3>
          <p className="muted">Drag fields between rows, columns and values, or open the field list. Export respects the current layout.</p>
          <PivotViewComponent ref={pivot} height={520} showFieldList showGroupingBar allowExcelExport allowPdfExport
            dataSourceSettings={{
              dataSource: pivotData, expandAll: false, enableSorting: true,
              columns: [{ name: 'Year' }], rows: [{ name: 'Category' }, { name: 'Product' }],
              values: [{ name: 'Units', caption: 'Units sold' }, { name: 'Revenue', caption: 'Revenue ($)' }],
              formatSettings: [{ name: 'Revenue', format: 'C0' }], filters: [{ name: 'Payment' }],
            }} gridSettings={{ columnWidth: 140 }}>
            <PInject services={[FieldList, GroupingBar, PDFExport, PivotExcelExport]} />
          </PivotViewComponent>
        </section>
      )}
    </>
  );
}
