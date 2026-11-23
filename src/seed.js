import { INITIAL_PRODUCTS } from './data.js';

// Deterministic PRNG so the demo data is stable and internally consistent
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20250611);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const DAY = 86400000;
export const round2 = (n) => Math.round(n * 100) / 100;

export const DELIVERY_STATUSES = ['Pending', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
export const DRIVERS = [
  { id: 1, name: 'Marcus Lee', color: '#2563eb' },
  { id: 2, name: 'Priya Nair', color: '#10b981' },
  { id: 3, name: 'Tom Alvarez', color: '#f59e0b' },
];
export const CURRENT_CUSTOMER_ID = 1; // "Jane Doe" – the signed-in storefront customer
export const CURRENT_DRIVER = 'Marcus Lee';
export const LOW_STOCK = 10;

/* ---------------- Categories ---------------- */
export const SEED_CATEGORIES = [
  { id: 1, name: 'Electronics', icon: '🔌', color: '#2563eb', description: 'Phones, laptops, audio and smart devices from leading brands.' },
  { id: 2, name: 'Fashion', icon: '👗', color: '#8b5cf6', description: 'Clothing, footwear and accessories for every season.' },
  { id: 3, name: 'Home & Kitchen', icon: '🏠', color: '#10b981', description: 'Appliances, cookware, decor and everyday home essentials.' },
  { id: 4, name: 'Books', icon: '📚', color: '#f59e0b', description: 'Bestselling fiction, non-fiction, technology and cookbooks.' },
  { id: 5, name: 'Sports & Fitness', icon: '🏋️', color: '#ef4444', description: 'Training gear, activewear and outdoor equipment.' },
  { id: 6, name: 'Beauty & Care', icon: '🧴', color: '#ec4899', description: 'Skincare, grooming and personal wellness products.' },
];

/* ---------------- Products ---------------- */
const BRANDS = ['Aero Audio', 'Nova Mobile', 'PulseFit', 'UltraTech', 'Beat Audio', 'SnapPro', 'Urban Thread', 'AirStride', 'Everyday Basics', 'Metro Goods',
  'Aviator Co.', 'Nordic Knit', 'BrewMaster', 'CrispAir', 'CloudSoft', "Chef's Choice", 'Lumen', 'Terra Home', 'Harbor Press', 'Northwind Books',
  'TechPress', 'Orbit Publishing', 'Harbor Press', 'Northwind Books', 'IronCore', 'TrailBlaze', 'FlexFit', 'Pure Botanics', 'DermaLux', 'Groomed'];
const EXTRA = [
  [25, 'IronCore Adjustable Dumbbell Set', 'Sports & Fitness', 149, 4.6, 540, '🏋️', '#ef4444', 'Space-saving adjustable dumbbells from 2.5 to 24 kg with a quick-dial weight selector and non-slip grips.', { Range: '2.5–24 kg', Increments: '2.5 kg', Material: 'Steel + rubber', Warranty: '3 years' }],
  [26, 'TrailBlaze 40L Hiking Backpack', 'Sports & Fitness', 89.9, 4.5, 412, '🎒', '#f97316', 'Ventilated back panel, rain cover and 12 smart pockets make this pack ideal for multi-day trails.', { Capacity: '40 L', Weight: '1.1 kg', Material: 'Ripstop nylon', 'Rain Cover': 'Included' }],
  [27, 'FlexFit Non-Slip Yoga Mat', 'Sports & Fitness', 32.5, 4.4, 1290, '🧘', '#14b8a6', 'Eco-friendly 6 mm cushioned mat with a grippy textured surface and alignment markers.', { Thickness: '6 mm', Size: '183 × 61 cm', Material: 'TPE', Weight: '0.9 kg' }],
  [28, 'Pure Botanics Vitamin C Serum', 'Beauty & Care', 28, 4.3, 2210, '🧴', '#ec4899', 'Brightening 15% vitamin C serum with hyaluronic acid for glowing, even-toned skin.', { Volume: '30 ml', 'Skin Type': 'All', Vegan: 'Yes', 'Cruelty Free': 'Yes' }],
  [29, 'DermaLux Daily SPF 50 Sunscreen', 'Beauty & Care', 19.99, 4.6, 3380, '☀️', '#fbbf24', 'Lightweight, non-greasy broad-spectrum sunscreen with a zero white-cast finish.', { SPF: '50 PA++++', Volume: '50 ml', Finish: 'Matte', 'Water Resistant': '80 min' }],
  [30, 'Groomed Precision Beard Trimmer', 'Beauty & Care', 44.5, 4.2, 760, '🪒', '#475569', 'Cordless trimmer with 20 length settings, self-sharpening blades and 90-minute runtime.', { Settings: '20 lengths', Runtime: '90 min', Charging: 'USB-C', Waterproof: 'IPX7' }],
];
const STOCK_OVERRIDE = { 5: 4, 9: 0, 12: 7, 18: 3, 22: 9, 28: 0 };
const DISCOUNTS = [0, 0, 5, 10, 15, 20];

export const SEED_PRODUCTS = [
  ...INITIAL_PRODUCTS,
  ...EXTRA.map(([id, name, category, price, rating, reviews, icon, color, description, specs]) => ({
    id, name, category, price, rating, reviews, icon, color, description, specs, featured: id % 2 === 1, stock: 25,
  })),
].map((p) => {
  const stock = STOCK_OVERRIDE[p.id] ?? int(14, 140);
  return {
    ...p,
    brand: BRANDS[p.id - 1],
    sku: `SK-${String(p.id).padStart(4, '0')}`,
    stock,
    discount: DISCOUNTS[(p.id * 7) % DISCOUNTS.length],
    status: p.id === 24 || p.id === 30 ? 'Draft' : stock === 0 ? 'Out of Stock' : 'Active',
    image: null,
  };
});

/* ---------------- Customers ---------------- */
const CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Seattle', 'Austin', 'Boston', 'Denver'];
const STREETS = ['Maple Ave', 'Oak Street', 'Sunset Blvd', 'Lakeview Dr', 'Pine Road', 'Cedar Lane', 'Highland Ave', 'Riverside Dr'];
const NAMES = ['Jane Doe', 'Michael Chen', 'Sofia Rodriguez', 'Liam Johnson', 'Aisha Khan', 'Noah Williams', 'Emma Davis', 'Oliver Brown',
  'Isabella Garcia', 'Ethan Martinez', 'Mia Anderson', 'Lucas Thomas', 'Amelia Wilson', 'Mason Taylor', 'Harper Moore', 'Logan Jackson',
  'Evelyn White', 'James Harris', 'Priya Sharma', 'Daniel Kim', 'Chloe Nguyen', 'Henry Clark', 'Zoe Lewis', 'Samuel Walker'];

export const SEED_CUSTOMERS = NAMES.map((name, i) => {
  const [f, l] = name.toLowerCase().split(' ');
  return {
    id: i + 1,
    name,
    email: `${f}.${l}@example.com`,
    phone: `+1 (${int(201, 989)}) ${int(200, 999)}-${String(int(0, 9999)).padStart(4, '0')}`,
    city: CITIES[i % CITIES.length],
    address: `${int(10, 998)} ${STREETS[(i * 3) % STREETS.length]}`,
    zip: String(int(10000, 98999)),
    joined: new Date(Date.now() - int(60, 700) * DAY).toISOString(),
    status: i % 9 === 4 ? 'Inactive' : i % 5 === 0 ? 'VIP' : 'Active',
  };
});

/* ---------------- Orders ---------------- */
const PAYMENTS = ['Credit Card', 'Credit Card', 'PayPal', 'UPI', 'Cash on Delivery'];
const NOW = Date.now();

function buildOrders() {
  const raw = [];
  for (let i = 0; i < 150; i++) {
    // more recent orders & a Q4 bump so trends look realistic
    const recent = i < 22;
    let age = recent ? rnd() * 9 : 10 + Math.pow(rnd(), 0.8) * 320;
    const date = new Date(NOW - age * DAY - int(0, 80000000) % DAY);
    const m = date.getMonth();
    if (!recent && [9, 10, 11].includes(m) === false && rnd() < 0.25) age += 0; // keep distribution
    const customer = SEED_CUSTOMERS[int(0, SEED_CUSTOMERS.length - 1)];
    const lineCount = int(1, 4);
    const used = new Set();
    const items = [];
    while (items.length < lineCount) {
      const p = pick(SEED_PRODUCTS.filter((x) => x.status !== 'Draft'));
      if (used.has(p.id)) continue;
      used.add(p.id);
      items.push({ productId: p.id, name: p.name, category: p.category, brand: p.brand, qty: p.price > 400 ? 1 : int(1, 3), price: round2(p.price * (1 - p.discount / 100)) });
    }
    raw.push({ date, age, customer, items });
  }
  raw.sort((a, b) => a.date - b.date);

  return raw.map((r, idx) => {
    const subtotal = round2(r.items.reduce((s, it) => s + it.qty * it.price, 0));
    const shipping = subtotal >= 100 ? 0 : 7.99;
    const tax = round2(subtotal * 0.08);
    const total = round2(subtotal + shipping + tax);
    const roll = rnd();
    let delivery;
    let status = 'Processing';
    if (r.age > 9) delivery = 'Delivered';
    else delivery = pick(['Pending', 'Pending', 'Packed', 'Packed', 'Shipped', 'Out for Delivery', 'Out for Delivery', 'Delivered']);
    if (r.age > 12 && roll < 0.05) { status = 'Cancelled'; }
    else if (delivery === 'Delivered') status = 'Completed';
    else if (delivery === 'Shipped' || delivery === 'Out for Delivery') status = 'Shipped';
    const method = pick(PAYMENTS);
    let payment = method === 'Cash on Delivery' && delivery !== 'Delivered' ? 'Pending' : 'Paid';
    if (status === 'Cancelled') payment = roll < 0.02 ? 'Failed' : 'Refunded';
    const driver = DRIVERS[idx % DRIVERS.length].name;
    const slotStart = new Date(r.date.getTime() + (delivery === 'Delivered' ? 3 : int(1, 3)) * DAY);
    slotStart.setHours(pick([9, 11, 13, 15, 17]), 0, 0, 0);
    return {
      id: `SK-${10001 + idx}`,
      customerId: r.customer.id,
      date: r.date.toISOString(),
      items: r.items,
      subtotal, shipping, tax, total,
      status, payment, paymentMethod: method, delivery: status === 'Cancelled' ? 'Pending' : delivery,
      driver,
      address: `${r.customer.address}, ${r.customer.city} ${r.customer.zip}`,
      city: r.customer.city,
      slotStart: slotStart.toISOString(),
      slotEnd: new Date(slotStart.getTime() + 2 * 3600000).toISOString(),
      deliveryOption: pick(['Standard', 'Standard', 'Express']),
    };
  });
}
export const SEED_ORDERS = buildOrders();

/* Delivery slots (Scheduler events) for open + recent orders */
export const SEED_SLOTS = SEED_ORDERS.filter(
  (o) => o.status !== 'Cancelled' && (o.delivery !== 'Delivered' || NOW - new Date(o.slotStart) < 6 * DAY) && Math.abs(new Date(o.slotStart) - NOW) < 14 * DAY
).map((o, i) => ({
  Id: i + 1,
  Subject: `${o.id} · ${SEED_CUSTOMERS.find((c) => c.id === o.customerId).name}`,
  StartTime: o.slotStart,
  EndTime: o.slotEnd,
  Location: o.address,
  Description: `${o.items.length} item(s) · ${o.deliveryOption} delivery`,
  DriverId: DRIVERS.find((d) => d.name === o.driver).id,
  OrderId: o.id,
}));

/* ---------------- Notifications ---------------- */
const ago = (min) => new Date(NOW - min * 60000).toISOString();
export const SEED_NOTIFICATIONS = [
  { id: 1, type: 'order', title: 'New order received', text: `${SEED_ORDERS[SEED_ORDERS.length - 1].id} was placed`, time: ago(6), read: false, link: '/orders' },
  { id: 2, type: 'inventory', title: 'Inventory alert', text: 'Terra Ceramic Dinner Set (16-pc) – only 3 left', time: ago(42), read: false, link: '/products' },
  { id: 3, type: 'inventory', title: 'Out of stock', text: 'Everyday Cotton T-Shirt (3-pack) is out of stock', time: ago(130), read: false, link: '/products' },
  { id: 4, type: 'delivery', title: 'Delivery completed', text: 'Marcus Lee delivered 4 parcels today', time: ago(300), read: true, link: '/orders' },
  { id: 5, type: 'payment', title: 'Payment received', text: 'Payment of $1,189.00 captured via SyncPay', time: ago(900), read: true, link: '/orders' },
];

export const REVIEW_POOL = [
  [5, 'Absolutely worth it', 'Exceeded my expectations. Build quality is excellent and it arrived two days early.'],
  [4, 'Great value', 'Does exactly what it says. Packaging was nice and setup took minutes.'],
  [5, 'Would buy again', 'I have been using this daily for a month and it is still perfect.'],
  [3, 'Good, not perfect', 'Solid product overall, but I wish the instructions were clearer.'],
  [4, 'Very happy', 'Looks great and feels premium. Customer support was helpful with my question.'],
];
