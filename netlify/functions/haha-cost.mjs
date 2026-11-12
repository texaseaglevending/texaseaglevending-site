import { isLive, deny } from "../lib/session.mjs";
// Updates product cost in haha for products Brad has approved.
// POST only. Default is a dry run that shows current vs new cost; nothing changes unless dryRun is false.
const BASE = "https://thor-openapi.hahavending.com";
const MAX_ITEMS = 50, MAX_COST = 50;

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

export default async (req, context) => {
  if (isLive(context)) return deny(404, "not available on the live site");
  try {
    if (req.method !== "POST") return Response.json({ ok: false, error: "POST only" }, { status: 405 });
    const body = await req.json();
    const dryRun = body.dryRun !== false;
    const changes = Array.isArray(body.changes) ? body.changes : [];
    if (!changes.length || changes.length > MAX_ITEMS) return Response.json({ ok: false, error: "1 to " + MAX_ITEMS + " products per call" }, { status: 400 });
    const token = await getToken();
    const results = [];
    for (const c of changes) {
      const cost = Math.round(Number(c.cost) * 100) / 100;
      if (!c.productId || !(cost >= 0 && cost <= MAX_COST)) { results.push({ productId: c.productId, error: "bad product or cost" }); continue; }
      const d = await fetch(BASE + "/open/api/v1/products/" + encodeURIComponent(c.productId), { headers: { Authorization: "Bearer " + token } }).then((r) => r.json());
      if (!d || d.code !== 0) { results.push({ productId: c.productId, error: "product not found" }); continue; }
      const row = { productId: c.productId, name: d.data.productName, currentCost: d.data.cost ?? null, newCost: cost };
      if (!dryRun) {
        const u = await fetch(BASE + "/open/api/v1/products/" + encodeURIComponent(c.productId) + "/cost", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ cost }) }).then((r) => r.json());
        row.haha = { code: u && u.code, message: u && u.message, success: u && u.data && u.data.success };
      }
      results.push(row);
    }
    return Response.json({ ok: true, dryRun, results }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return Response.json({ ok: false, error: String(e.message || e) }, { status: 502 });
  }
};

export const config = { path: "/api/haha-cost" };
