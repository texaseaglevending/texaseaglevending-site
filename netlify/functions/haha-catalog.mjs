// Read-only: product catalogue (cost and default price) and each machine's shelf layout from the haha Open Platform.
const BASE = "https://thor-openapi.hahavending.com";
const MARKETS = ["B101219", "B111755", "B101231", "B111750"];

async function getToken() {
  const res = await fetch(BASE + "/open/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ appkey: process.env.HAHA_APPKEY, appsecret: process.env.HAHA_APPSECRET }),
  });
  const j = await res.json();
  if (!j || j.code !== 0 || !j.data || !j.data.token) throw new Error("haha token request failed (code " + (j && j.code) + ")");
  return j.data.token;
}

async function getAll(path, token) {
  const out = [];
  let cursor = null;
  for (let i = 0; i < 50; i++) {
    const url = new URL(BASE + path);
    url.searchParams.set("page_size", "100");
    if (cursor) url.searchParams.set("cursor", cursor); else url.searchParams.set("page", "1");
    const res = await fetch(url, { headers: { Authorization: "Bearer " + token } });
    const j = await res.json();
    if (!j || j.code !== 0) throw new Error("haha request failed for " + path + " (code " + (j && j.code) + ")");
    out.push(...(j.data.list || []));
    cursor = j.data.next_cursor;
    if (!cursor) break;
  }
  return out;
}

export default async () => {
  try {
    const token = await getToken();
    const items = await getAll("/open/api/v1/products", token);
    const products = items.map((p) => ({ id: p.productId, barcode: p.productCode || null, name: p.productName, alias: p.alias || null, cost: p.cost ?? null, price: p.price ?? null }));
    const planograms = {};
    for (const m of MARKETS) {
      const res = await fetch(BASE + "/open/api/v1/markets/" + m + "/planograms", { headers: { Authorization: "Bearer " + token } });
      const j = await res.json();
      planograms[m] = j && j.code === 0 ? (j.data.racks || []).map((r) => ({ rack: r.name, cells: (r.cells || []).map((c) => ({ row: c.rowIndex, col: c.columnIndex, id: c.productId, name: c.productName, stock: c.productsInventory, cap: c.productsCapacity })) })) : { error: j && j.code };
    }
    return Response.json({ ok: true, pulledAt: new Date().toISOString(), productCount: products.length, products, planograms }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return Response.json({ ok: false, error: String(e.message || e) }, { status: 502 });
  }
};

export const config = { path: "/api/haha-catalog" };
