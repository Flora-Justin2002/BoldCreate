import React, { useMemo, useState } from 'react';
import { ColumnDirective, ColumnsDirective, GridComponent, Inject, Page, Sort, Filter, Toolbar, Search, ExcelExport, PdfExport } from '@syncfusion/ej2-react-grids';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { DialogComponent } from '@syncfusion/ej2-react-popups';
import { Badge, Empty, PageHeader } from '../components/Ui.jsx';
import { useStore } from '../store.jsx';
import { DELIVERY_STATUSES } from '../seed.js';
import { fmtDate, fmtDateTime, money } from '../utils.js';
import { CURRENT_CUSTOMER_ID } from '../seed.js';

export function Timeline({ order }) {
  const idx = DELIVERY_STATUSES.indexOf(order.delivery);
  const cancelled = order.status === 'Cancelled';
  const base = new Date(order.date).getTime();
  const steps = [
    { label: 'Order placed', desc: `Confirmed · ${order.paymentMethod}`, at: base },
    { label: 'Payment', desc: order.payment === 'Paid' ? `Paid${order.txn ? ` · ${order.txn}` : ''}` : order.payment, at: base + 60000 },
    ...DELIVERY_STATUSES.map((s, i) => ({
      label: s === 'Pending' ? 'Awaiting packing' : s, done: !cancelled && i <= idx,
      desc: ['Order received by warehouse', 'Items packed and labelled', `Handed to courier (${order.driver})`, 'Driver is on the way', 'Delivered to customer'][i],
      at: base + (i + 1) * 3600000 * 6,
    })),
  ];
  return (
    <ol className="timeline">
      {steps.map((s, i) => {
        const done = s.done ?? !cancelled;
        const current = !cancelled && s.label !== 'Order placed' && s.label !== 'Payment' && DELIVERY_STATUSES[idx] && (s.label === DELIVERY_STATUSES[idx] || (idx === 0 && s.label === 'Awaiting packing'));
        return (
          <li key={i} className={`${done ? 'done' : ''} ${current ? 'current' : ''}`}>
            <span className="dot">{done ? '✓' : ''}</span>
            <div><b>{s.label}</b><small>{s.desc}</small>{done && <em>{fmtDateTime(new Date(s.at).toISOString())}</em>}</div>
          </li>
        );
      })}
      {cancelled && <li className="done cancelled"><span className="dot">✕</span><div><b>Order cancelled</b><small>Payment {order.payment.toLowerCase()}</small></div></li>}
    </ol>
  );
}

export default function Orders({ mine }) {
  const { orders, customers, role, cancelOrder, updateDelivery } = useStore();
  const [sel, setSel] = useState(null);
  const grid = React.useRef(null);
  const canManage = role === 'Admin' || role === 'Store Manager';

  const data = useMemo(() => {
    let list = orders;
    if (mine) list = list.filter((o) => o.customerId === CURRENT_CUSTOMER_ID);
    if (role === 'Delivery Executive') list = list.filter((o) => o.driver === 'Marcus Lee' && o.status !== 'Cancelled');
    return list.map((o) => ({
      ...o, customer: customers.find((c) => c.id === o.customerId)?.name || o.contact?.name || 'Guest',
      orderDate: new Date(o.date), itemCount: o.items.reduce((n, i) => n + i.qty, 0),
    })).sort((a, b) => b.orderDate - a.orderDate);
  }, [orders, customers, mine, role]);

  const order = sel && data.find((o) => o.id === sel);
  const toolbar = ['Search', 'ExcelExport', 'PdfExport'];
  const clickToolbar = (args) => {
    if (args.item.id.endsWith('excelexport')) grid.current.excelExport({ fileName: 'synckart-orders.xlsx' });
    if (args.item.id.endsWith('pdfexport')) grid.current.pdfExport({ fileName: 'synckart-orders.pdf', pageOrientation: 'Landscape' });
  };

  if (mine && data.length === 0) return <Empty icon="🧾" title="No orders yet" />;

  return (
    <>
      <PageHeader title={mine ? 'My Orders' : role === 'Delivery Executive' ? 'My Assigned Orders' : 'Order Management'} subtitle={`${data.length} orders`} />
      <div className="panel flush">
        <GridComponent ref={grid} dataSource={data} allowPaging allowSorting allowFiltering filterSettings={{ type: 'Excel' }} toolbar={toolbar} toolbarClick={clickToolbar}
          allowExcelExport allowPdfExport pageSettings={{ pageSize: 10 }} enableHover rowHeight={52}
          rowSelected={(a) => setSel(a.data.id)}>
          <ColumnsDirective>
            <ColumnDirective field="id" headerText="Order ID" width="120" template={(o) => <b className="txt-blue">{o.id}</b>} />
            <ColumnDirective field="customer" headerText="Customer" width="170" />
            <ColumnDirective field="orderDate" headerText="Order date" width="130" type="date" format="yMMMd" />
            <ColumnDirective field="itemCount" headerText="Items" width="80" textAlign="Right" headerTextAlign="Right" />
            <ColumnDirective field="total" headerText="Total" width="110" format="C2" textAlign="Right" headerTextAlign="Right" />
            <ColumnDirective field="status" headerText="Status" width="120" template={(o) => <Badge>{o.status}</Badge>} />
            <ColumnDirective field="payment" headerText="Payment" width="120" template={(o) => <Badge>{o.payment}</Badge>} />
            <ColumnDirective field="delivery" headerText="Delivery" width="160" template={(o) => <Badge>{o.delivery}</Badge>} />
          </ColumnsDirective>
          <Inject services={[Page, Sort, Filter, Toolbar, Search, ExcelExport, PdfExport]} />
        </GridComponent>
      </div>

      <DialogComponent visible={!!order} header={order ? `Order ${order.id}` : ''} isModal showCloseIcon width="720px" cssClass="sk-dialog" close={() => setSel(null)} overlayClick={() => setSel(null)}
        footerTemplate={() => order && (
          <>
            {canManage && order.status !== 'Cancelled' && order.delivery !== 'Delivered' && <ButtonComponent cssClass="e-outline e-danger" onClick={() => cancelOrder(order.id)}>Cancel order</ButtonComponent>}
            {(canManage || role === 'Delivery Executive') && order.status !== 'Cancelled' && DELIVERY_STATUSES.indexOf(order.delivery) < 4 && (
              <ButtonComponent cssClass="e-primary" onClick={() => updateDelivery(order.id, DELIVERY_STATUSES[DELIVERY_STATUSES.indexOf(order.delivery) + 1])}>
                Mark as {DELIVERY_STATUSES[DELIVERY_STATUSES.indexOf(order.delivery) + 1]}
              </ButtonComponent>
            )}
            <ButtonComponent onClick={() => setSel(null)}>Close</ButtonComponent>
          </>
        )}>
        {order && (
          <div className="order-detail">
            <div>
              <h4>Tracking</h4>
              <Timeline order={order} />
            </div>
            <div>
              <h4>Summary</h4>
              <dl className="dl">
                <dt>Customer</dt><dd>{order.customer}</dd>
                <dt>Placed</dt><dd>{fmtDate(order.date)}</dd>
                <dt>Ship to</dt><dd>{order.address}</dd>
                <dt>Delivery slot</dt><dd>{fmtDateTime(order.slotStart)}</dd>
                <dt>Driver</dt><dd>{order.driver}</dd>
                <dt>Payment</dt><dd>{order.paymentMethod} · <Badge>{order.payment}</Badge></dd>
              </dl>
              <h4>Items</h4>
              <ul className="line-items">
                {order.items.map((i) => <li key={i.productId}><span>{i.name} × {i.qty}</span><b>{money(i.price * i.qty)}</b></li>)}
                <li className="muted"><span>Shipping</span><span>{order.shipping ? money(order.shipping) : 'Free'}</span></li>
                <li className="muted"><span>Tax</span><span>{money(order.tax)}</span></li>
                <li className="total"><span>Total</span><b>{money(order.total)}</b></li>
              </ul>
            </div>
          </div>
        )}
      </DialogComponent>
    </>
  );
}
