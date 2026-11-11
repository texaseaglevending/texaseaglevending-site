// Read-only: pulls per-product stock for every TEV machine from the haha Open Platform.
// Keys come from Netlify environment variables and are never returned or logged.
const BASE = "https://thor-openapi.hahavending.com";

async function getToken() {
  const res = await fetch(BASE + "/open/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ appkey: process.env.HAHA_APPKEY, appsecret: process.env.HAHA_APPSECRET }),
  });
  const j = await res.json();
  if (!j || j.code !== 0 || !j.data || !j.data.token) {
    throw new Error("haha token request failed (code " + (j && j.code) + ")");
  }
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
    if (!process.env.HAHA_APPKEY || !process.env.HAHA_APPSECRET) {
      return Response.json({ ok: false, error: "haha keys are not set in Netlify" }, { status: 500 });
    }
    const token = await getToken();
    const items = await getAll("/open/api/v1/inventory/products", token);
    const products = items.map((p) => ({
      id: p.productId,
      barcode: p.productCode || null,
      name: p.productName,
      total: p.totalStock,
      machines: (p.markets || []).map((m) => ({ id: m.marketId, name: m.marketName, stock: m.stock })),
    }));
    return Response.json(
      { ok: true, pulledAt: new Date().toISOString(), productCount: products.length, products },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return Response.json({ ok: false, error: String(e.message || e) }, { status: 502 });
  }
};

export const config = { path: "/api/haha-inventory" };
