import { isLive, deny } from "../lib/session.mjs";
// Sets haha stock to counted numbers for products Brad has approved.
// POST only. Default is a dry run that shows the plan; nothing changes unless dryRun is false.
// Keys come from Netlify environment variables and are never returned or logged.
const BASE = "https://thor-openapi.hahavending.com";
const MARKETS = new Set(["B101219", "B111755", "B101231", "B111750"]);
const MAX_DELTA = 20;
const MAX_ITEMS = 60;

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

export default async (req, context) => {
  if (isLive(context)) return deny(404, "not available on the live site");
  try {
    if (req.method !== "POST") return Response.json({ ok: false, error: "POST only" }, { status: 405 });
    if (!process.env.HAHA_APPKEY || !process.env.HAHA_APPSECRET) return Response.json({ ok: false, error: "haha keys are not set in Netlify" }, { status: 500 });
    const body = await req.json();
    const marketId = String(body.marketId || "");
    const dryRun = body.dryRun !== false;
    const targets = Array.isArray(body.targets) ? body.targets : [];
    if (!MARKETS.has(marketId)) return Response.json({ ok: false, error: "unknown machine" }, { status: 400 });
    if (!targets.length || targets.length > MAX_ITEMS) return Response.json({ ok: false, error: "1 to " + MAX_ITEMS + " products per call" }, { status: 400 });

    const token = await getToken();
    const inv = await getAll("/open/api/v1/inventory/products", token);
    const byId = new Map(inv.map((p) => [p.productId, p]));
    const plan = [], items = [], problems = [];
    for (const t of targets) {
      const target = Number(t.target);
      const p = byId.get(t.productId);
      if (!p || !Number.isInteger(target) || target < 0) { problems.push({ productId: t.productId, error: "product not found or bad target" }); continue; }
      const m = (p.markets || []).find((x) => x.marketId === marketId);
      const racks = (m && m.racks) || [];
      const current = m ? m.stock : 0;
      let delta = target - current;
      if (delta === 0) { plan.push({ productId: p.productId, name: p.productName, current, target, change: 0 }); continue; }
      if (Math.abs(delta) > MAX_DELTA) { problems.push({ productId: p.productId, name: p.productName, error: "change of " + delta + " is over the " + MAX_DELTA + " limit" }); continue; }
      if (!racks.length) { problems.push({ productId: p.productId, name: p.productName, error: "no slot for this product on this machine" }); continue; }
      const lines = [];
      if (delta > 0) lines.push({ productId: p.productId, cabinetDoorNo: racks[0].name, adjustNum: delta });
      else {
        let left = -delta;
        for (const r of racks) { const take = Math.min(left, r.stock); if (take > 0) { lines.push({ productId: p.productId, cabinetDoorNo: r.name, adjustNum: -take }); left -= take; } if (!left) break; }
      }
      items.push(...lines);
      plan.push({ productId: p.productId, name: p.productName, current, target, change: delta });
    }
    if (dryRun || !items.length) return Response.json({ ok: true, dryRun: true, marketId, plan, problems }, { headers: { "Cache-Control": "no-store" } });

    const res = await fetch(BASE + "/open/api/v1/inventory/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ marketId, items }),
    });
    const j = await res.json();
    return Response.json({ ok: j && j.code === 0, dryRun: false, marketId, plan, problems, haha: { code: j && j.code, message: j && j.message, items: j && j.data && j.data.items } }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return Response.json({ ok: false, error: String(e.message || e) }, { status: 502 });
  }
};

export const config = { path: "/api/haha-adjust" };
