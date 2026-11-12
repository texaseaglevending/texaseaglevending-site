// Read-only: sales for one machine and date range from the haha Open Platform.
// GET /api/haha-sales?sticker=B101219&start=2026-11-12&end=2026-11-12
const BASE = "https://thor-openapi.hahavending.com";

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

export default async (req) => {
  try {
    const q = new URL(req.url).searchParams;
    const token = await getToken();
    const out = [];
    let cursor = null;
    for (let i = 0; i < 50; i++) {
      const url = new URL(BASE + "/open/api/v1/sales");
      url.searchParams.set("page_size", "100");
      for (const [k, v] of [["sticker_num", q.get("sticker")], ["start_time", q.get("start")], ["end_time", q.get("end")]]) if (v) url.searchParams.set(k, v);
      if (cursor) url.searchParams.set("cursor", cursor); else url.searchParams.set("page", "1");
      const res = await fetch(url, { headers: { Authorization: "Bearer " + token } });
      const j = await res.json();
      if (!j || j.code !== 0) throw new Error("haha sales request failed (code " + (j && j.code) + ")");
      out.push(...(j.data.list || []));
      cursor = j.data.next_cursor;
      if (!cursor) break;
    }
    if (q.get("raw")) return Response.json({ ok: true, raw: out.slice(0, 3) }, { headers: { "Cache-Control": "no-store" } });
    const sales = out.map((s) => ({
      saleId: s.saleId, marketId: s.marketId, created: s.createdDtm, paid: s.saleDtm, status: s.status, total: s.grossTotal ?? s.saleGrossTotal, isRefund: s.isRefund,
      items: (s.saleItems || []).map((it) => ({ productId: it.productId, name: it.productName, qty: it.quantity, price: it.price })),
    }));
    return Response.json({ ok: true, count: sales.length, sales }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return Response.json({ ok: false, error: String(e.message || e) }, { status: 502 });
  }
};

export const config = { path: "/api/haha-sales" };
