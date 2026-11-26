import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ChartComponent, SeriesCollectionDirective, SeriesDirective, Inject, ColumnSeries, SplineAreaSeries, LineSeries, Category, Legend, Tooltip, DateTime,
  AccumulationChartComponent, AccumulationSeriesCollectionDirective, AccumulationSeriesDirective, AccumulationLegend, AccumulationTooltip, AccumulationDataLabel, PieSeries,
  SparklineComponent,
} from '@syncfusion/ej2-react-charts';
import { KpiCard, PageHeader, Badge, ProductThumb } from '../components/Ui.jsx';
import { useStore } from '../store.jsx';
import { fmtDate, money } from '../utils.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function useSalesData(orders) {
  return useMemo(() => {
    const valid = orders.filter((o) => o.status !== 'Cancelled');
    const byMonth = new Map();
    valid.forEach((o) => {
      const d = new Date(o.date);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      const m = byMonth.get(key) || { key, month: MONTHS[d.getMonth()], revenue: 0, orders: 0 };
      m.revenue += o.total; m.orders += 1;
      byMonth.set(key, m);
    });
    const monthly = [...byMonth.values()].sort((a, b) => a.key.localeCompare(b.key)).slice(-12).map((m) => ({ ...m, revenue: Math.round(m.revenue) }));
    const prods = new Map();
    const cats = new Map();
    valid.forEach((o) => o.items.forEach((it) => {
      const p = prods.get(it.productId) || { id: it.productId, name: it.name, units: 0, revenue: 0 };
      p.units += it.qty; p.revenue += it.qty * it.price; prods.set(it.productId, p);
      cats.set(it.category, (cats.get(it.category) || 0) + it.qty * it.price);
    }));
    return {
      valid, monthly,
      top: [...prods.values()].sort((a, b) => b.units - a.units).slice(0, 5),
      cats: [...cats.entries()].map(([category, sales]) => ({ category, sales: Math.round(sales) })).sort((a, b) => b.sales - a.sales),
    };
  }, [orders]);
}

export default function Dashboard() {
  const { orders, products, customers, customers: cs, chartTheme } = useStore();
  const { valid, monthly, top, cats } = useSalesData(orders);
  const revenue = valid.reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => o.status !== 'Cancelled' && o.delivery !== 'Delivered').length;
  const last = monthly[monthly.length - 1], prev = monthly[monthly.length - 2];
  const pct = (a, b) => (b ? `${(((a - b) / b) * 100).toFixed(1)}%` : '0%');
  const recent = [...orders].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const spark = (key) => monthly.map((m) => ({ x: m.month, y: m[key] }));

  const kpis = [
    { icon: '🧾', label: 'Total Orders', value: orders.length.toLocaleString(), delta: pct(last?.orders, prev?.orders), tone: 'blue', series: 'orders' },
    { icon: '💰', label: 'Revenue', value: money(revenue), delta: pct(last?.revenue, prev?.revenue), tone: 'green', series: 'revenue' },
    { icon: '📦', label: 'Products', value: products.length, delta: '4.2%', tone: 'blue' },
    { icon: '👥', label: 'Customers', value: cs.length, delta: '8.7%', tone: 'green' },
    { icon: '🚚', label: 'Pending Deliveries', value: pending, delta: '-2.1%', tone: 'amber' },
  ];
  const lowStock = products.filter((p) => p.stock <= 10 && p.status !== 'Draft');

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Store performance at a glance" />
      <div className="kpi-grid">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k}>
            {k.series && (
              <SparklineComponent height="46px" width="100%" lineWidth={2} type="Area" valueType="Category" fill={k.tone === 'green' ? '#10b981' : '#2563eb'} opacity={0.25} dataSource={spark(k.series)} xName="x" yName="y" border={{ color: k.tone === 'green' ? '#10b981' : '#2563eb', width: 2 }} theme={chartTheme}>
              </SparklineComponent>
            )}
          </KpiCard>
        ))}
      </div>

      <div className="grid-2">
        <section className="panel">
          <h3>Sales trend</h3>
          <ChartComponent height="300" theme={chartTheme} background="transparent" primaryXAxis={{ valueType: 'Category', majorGridLines: { width: 0 } }}
            primaryYAxis={{ labelFormat: '${value}', title: 'Revenue', majorTickLines: { width: 0 } }}
            axes={[{ name: 'orders', rowIndex: 0, opposedPosition: true, title: 'Orders', majorGridLines: { width: 0 } }]}
            tooltip={{ enable: true, shared: true }} legendSettings={{ visible: true }} chartArea={{ border: { width: 0 } }}>
            <Inject services={[ColumnSeries, SplineAreaSeries, LineSeries, Category, Legend, Tooltip]} />
            <SeriesCollectionDirective>
              <SeriesDirective dataSource={monthly} xName="month" yName="revenue" name="Revenue" type="Column" fill="#2563eb" cornerRadius={{ topLeft: 4, topRight: 4 }} />
              <SeriesDirective dataSource={monthly} xName="month" yName="orders" name="Orders" type="Line" yAxisName="orders" fill="#10b981" width={3} marker={{ visible: true, width: 8, height: 8 }} />
            </SeriesCollectionDirective>
          </ChartComponent>
        </section>
        <section className="panel">
          <h3>Sales by category</h3>
          <AccumulationChartComponent height="300" theme={chartTheme} background="transparent" legendSettings={{ visible: true, position: 'Bottom' }} tooltip={{ enable: true, format: '${point.x}: ${point.y}' }}>
            <Inject services={[PieSeries, AccumulationLegend, AccumulationTooltip, AccumulationDataLabel]} />
            <AccumulationSeriesCollectionDirective>
              <AccumulationSeriesDirective dataSource={cats} xName="category" yName="sales" innerRadius="62%" palettes={['#2563eb', '#10b981', '#60a5fa', '#34d399', '#1e3a8a', '#065f46']}
                dataLabel={{ visible: true, name: 'category', position: 'Outside', font: { fontWeight: '600' } }} />
            </AccumulationSeriesCollectionDirective>
          </AccumulationChartComponent>
        </section>
      </div>

      <div className="grid-2 wide-left">
        <section className="panel">
          <div className="section-head"><h3>Recent orders</h3><Link to="/orders">View all →</Link></div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id}>
                    <td><b>{o.id}</b></td>
                    <td>{customers.find((c) => c.id === o.customerId)?.name || o.contact?.name || '—'}</td>
                    <td>{fmtDate(o.date)}</td>
                    <td>{money(o.total)}</td>
                    <td><Badge>{o.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel">
          <h3>Top-selling products</h3>
          <ol className="top-list">
            {top.map((t, i) => {
              const p = products.find((x) => x.id === t.id);
              return (
                <li key={t.id}>
                  <span className="rank">{i + 1}</span>
                  {p && <ProductThumb product={p} size={38} />}
                  <span className="grow"><b>{t.name}</b><small>{t.units} units sold</small></span>
                  <b>{money(t.revenue)}</b>
                </li>
              );
            })}
          </ol>
          {lowStock.length > 0 && (
            <div className="alert warn" role="status">
              <b>⚠️ {lowStock.length} products low on stock</b>
              <Link to="/products">Review inventory →</Link>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
