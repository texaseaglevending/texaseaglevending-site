// Pulls haha data and saves dashboard snapshots in Netlify Blobs. Read-only toward haha.
import { getStore } from "@netlify/blobs";
import { getToken, getAll, getOne, MACHINES } from "./haha.mjs";
import { taxType, needsCheck } from "./tax.mjs";

export const TZ = "America/Chicago";
export const storeFor = (context) => getStore({ name: "dashboard-" + ((context && context.deploy && context.deploy.context) || "dev"), consistency: "strong" });

export const localDate = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const addDays = (ymd, n) => { const d = new Date(ymd + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

const slimSale = (s) => ({
  id: s.saleId, m: s.marketId, at: s.saleDtm || s.createdDtm, status: s.status, refund: !!s.isRefund,
  gross: s.grossTotal ?? s.saleGrossTotal ?? null, net: s.total ?? s.saleTotal ?? null,
  paid: (s.saleTenders || []).reduce((a, t) => a + Number(t.amount || 0), 0),
  items: (s.saleItems || []).map((it) => ({ p: it.productId, n: it.productName, q: it.quantity, price: it.price, paid: it.itemFinalPrice, refund: !!it.isRefund })),
});

// Sales for each local date in [start, end], saved one blob per day: sales/YYYY-MM-DD
export async function pullSales(store, token, start, end) {
  const list = await getAll("/open/api/v1/sales", token, { start_time: start, end_time: end, sort: "pay_time_asc" }, 200);
  const byDay = {};
  for (let d = start; d <= end; d = addDays(d, 1)) byDay[d] = [];
  for (const s of list) {
    const t = s.saleDtm || s.createdDtm;
    const day = t ? localDate(new Date(t)) : null;
    if (day && byDay[day]) byDay[day].push(slimSale(s));
  }
  const slim = {};
  for (const [day, sales] of Object.entries(byDay)) {
    slim[day] = sales;
    await store.setJSON("sales/" + day, { day, pulledAt: new Date().toISOString(), sales });
  }
  await updateAgg(store, slim);
  return { days: Object.keys(byDay).length, sales: list.length };
}

// Money actually kept from one sale: what was paid, minus any refunded items.
export function saleNet(s) {
  if (s.refund) return 0;
  const refunded = (s.items || []).filter((i) => i.refund).reduce((a, i) => a + Number(i.paid || 0), 0);
  return Math.max(0, Number(s.paid || 0) - refunded);
}

// Per-day totals by machine and by product, kept in one blob ("agg") so the dashboard loads fast.
// Each refresh or backfill rewrites only the days it pulled.
export async function updateAgg(store, salesByDay) {
  const agg = (await store.get("agg", { type: "json" })) || { days: {} };
  agg.lastPrice ||= {};
  for (const [day, sales] of Object.entries(salesByDay)) {
    const d = { m: {}, p: {} };
    for (const s of sales) {
      const net = saleNet(s);
      if (!(net > 0)) continue;
      const m = (d.m[s.m] ||= { o: 0, r: 0, u: 0 });
      m.o += 1; m.r += net;
      const paidItems = (s.items || []).filter((i) => !i.refund);
      const listed = paidItems.reduce((a, i) => a + Number(i.paid || 0), 0) || 1;
      for (const it of paidItems) {
        const q = Number(it.q || 0);
        const lp = (agg.lastPrice[it.p] ||= {});
        if (!lp[s.m] || lp[s.m].at < s.at) lp[s.m] = { price: Number(it.price), at: s.at };
        m.u += q;
        const p = ((d.p[it.p] ||= {})[s.m] ||= { u: 0, r: 0, f: 0 });
        const share = Number(it.paid || 0) / listed;
        p.u += q;
        p.r += net * share;
        p.f = (p.f || 0) + 0.05 * share; // this item's part of haha's $0.05 per-order fee
      }
    }
    for (const m of Object.values(d.m)) m.r = Math.round(m.r * 100) / 100;
    for (const byM of Object.values(d.p)) for (const v of Object.values(byM)) { v.r = Math.round(v.r * 100) / 100; v.f = Math.round(v.f * 1000) / 1000; }
    agg.days[day] = d;
  }
  agg.updatedAt = new Date().toISOString();
  await store.setJSON("agg", agg);
}

export async function refresh(context, { salesDays = 2, catchUp = true } = {}) {
  const store = storeFor(context);
  const started = new Date().toISOString();
  if (catchUp) {
    // Re-pull every day since the last good refresh (plus one overlap day), up to 62 days, so history never has gaps.
    const last = await store.get("status", { type: "json" }).catch(() => null);
    const lastDay = last && last.ok && last.lastSalesDay;
    if (lastDay) {
      const gap = Math.round((Date.parse(localDate() + "T12:00:00Z") - Date.parse(lastDay + "T12:00:00Z")) / 864e5) + 1;
      salesDays = Math.min(62, Math.max(salesDays, gap));
    } else salesDays = Math.max(salesDays, 7);
  }
  try {
    const token = await getToken();
    const [catalog, inventory] = await Promise.all([getAll("/open/api/v1/products", token), getAll("/open/api/v1/inventory/products", token)]);
    const products = {};
    for (const p of catalog) products[p.productId] = { name: p.productName, alias: p.alias || null, barcode: p.productCode || null, cost: p.cost ?? null, price: p.price ?? null };
    const stock = {};
    for (const p of inventory) {
      if (!products[p.productId]) products[p.productId] = { name: p.productName, alias: p.alias || null, barcode: p.productCode || null, cost: null, price: null };
      for (const m of p.markets || []) (stock[m.marketId] ||= {})[p.productId] = m.stock;
    }
    const capacity = {};
    for (const m of MACHINES) {
      const pg = await getOne("/open/api/v1/markets/" + m.id + "/planograms", token).catch(() => null);
      capacity[m.id] = {};
      for (const r of (pg && pg.racks) || []) for (const c of r.cells || []) if (c.productId) capacity[m.id][c.productId] = (capacity[m.id][c.productId] || 0) + (c.productsCapacity || 0);
    }
    const today = localDate();
    const sales = await pullSales(store, token, addDays(today, 1 - salesDays), today);
    for (const [id, p] of Object.entries(products)) { p.tax = taxType(p.name); if (needsCheck(p.name)) p.taxCheck = true; }
    const snapshot = { pulledAt: new Date().toISOString(), machines: MACHINES, products, stock, capacity };
    await store.setJSON("snapshot", snapshot);
    const status = { ok: true, startedAt: started, finishedAt: new Date().toISOString(), productCount: Object.keys(products).length, salesPulled: sales, lastSalesDay: today };
    await store.setJSON("status", status);
    return status;
  } catch (e) {
    const status = { ok: false, startedAt: started, finishedAt: new Date().toISOString(), error: String(e.message || e) };
    await store.setJSON("status", status).catch(() => {});
    return status;
  }
}
