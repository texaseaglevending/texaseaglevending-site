// Pulls haha data and saves dashboard snapshots in Netlify Blobs. Read-only toward haha.
import { getStore } from "@netlify/blobs";
import { getToken, getAll, getOne, MACHINES } from "./haha.mjs";

export const TZ = "America/Chicago";
export const storeFor = (context) => getStore({ name: "dashboard-" + ((context && context.deploy && context.deploy.context) || "dev"), consistency: "strong" });

export const localDate = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const addDays = (ymd, n) => { const d = new Date(ymd + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

const slimSale = (s) => ({
  id: s.saleId, m: s.marketId, at: s.saleDtm || s.createdDtm, status: s.status, refund: !!s.isRefund,
  gross: s.grossTotal ?? s.saleGrossTotal ?? null, net: s.total ?? s.saleTotal ?? null,
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
  for (const [day, sales] of Object.entries(byDay)) await store.setJSON("sales/" + day, { day, pulledAt: new Date().toISOString(), sales });
  return { days: Object.keys(byDay).length, sales: list.length };
}

export async function refresh(context, { salesDays = 2 } = {}) {
  const store = storeFor(context);
  const started = new Date().toISOString();
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
    const snapshot = { pulledAt: new Date().toISOString(), machines: MACHINES, products, stock, capacity };
    await store.setJSON("snapshot", snapshot);
    const status = { ok: true, startedAt: started, finishedAt: new Date().toISOString(), productCount: Object.keys(products).length, salesPulled: sales };
    await store.setJSON("status", status);
    return status;
  } catch (e) {
    const status = { ok: false, startedAt: started, finishedAt: new Date().toISOString(), error: String(e.message || e) };
    await store.setJSON("status", status).catch(() => {});
    return status;
  }
}
