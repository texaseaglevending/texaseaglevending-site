// Read-only dashboard data feed. Requires the admin Google sign-in.
// GET /api/dash-data?part=status|snapshot|sales&day=YYYY-MM-DD
import { storeFor } from "../lib/refresh.mjs";
import { adminFrom, deny } from "../lib/session.mjs";
import { getToken, getAll, getOne, MACHINES } from "../lib/haha.mjs";
import { formsStore } from "../lib/forms.mjs";

export default async (req, context) => {
  if (!adminFrom(req)) return deny(401, "sign in required");
  const q = new URL(req.url).searchParams;
  const store = storeFor(context);
  const part = q.get("part") || "status";
  let data = null;
  if (part === "status") data = await store.get("status", { type: "json" });
  else if (part === "snapshot") data = await store.get("snapshot", { type: "json" });
  else if (part === "sales") data = await store.get("sales/" + (q.get("day") || ""), { type: "json" });
  else if (part === "agg") data = await store.get("agg", { type: "json" });
  else if (part === "latest") {
    const n = Math.min(100, Number(q.get("n") || 25));
    const keys = (await store.list({ prefix: "sales/" })).blobs.map((b) => b.key).sort().reverse();
    data = [];
    for (const k of keys) {
      const day = await store.get(k, { type: "json" });
      const list = ((day && day.sales) || []).filter((s) => s.paid > 0).sort((a, b) => (a.at < b.at ? 1 : -1));
      data.push(...list);
      if (data.length >= n) break;
    }
    data = data.slice(0, n);
  }
  else if (part === "range") {
    // Sales between two dates (max 93 days), optionally for one machine and/or one product.
    const from = q.get("from"), to = q.get("to"), m = q.get("m"), p = q.get("p");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from || "") || !/^\d{4}-\d{2}-\d{2}$/.test(to || "") || from > to) return deny(400, "from and to must be YYYY-MM-DD");
    const span = (Date.parse(to) - Date.parse(from)) / 864e5;
    if (span > 93) return deny(400, "93 days at most");
    const days = [];
    for (let t = Date.parse(from + "T12:00:00Z"); t <= Date.parse(to + "T12:00:00Z"); t += 864e5) days.push(new Date(t).toISOString().slice(0, 10));
    const blobs = await Promise.all(days.map((d) => store.get("sales/" + d, { type: "json" })));
    data = [];
    for (const b of blobs) for (const s of (b && b.sales) || []) {
      if (!(s.paid > 0)) continue;
      if (m && s.m !== m) continue;
      if (p && !(s.items || []).some((i) => i.p === p)) continue;
      data.push(s);
    }
    data.sort((a, b) => (a.at < b.at ? 1 : -1));
  }
  else if (part === "online") {
    // Live, read-only check of each machine's connection to haha.
    const token = await getToken();
    data = await Promise.all(MACHINES.map(async (m) => {
      try { const d = await getOne("/open/api/v1/markets/" + m.id + "/online-status", token); return { id: m.id, online: !!d.isOnline }; }
      catch { return { id: m.id, online: null }; }
    }));
  }
  else if (part === "restocks") {
    // Live, read-only: restock / adjust / dispose records with product-level changes.
    const from = q.get("from"), to = q.get("to");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from || "") || !/^\d{4}-\d{2}-\d{2}$/.test(to || "")) return deny(400, "from and to must be YYYY-MM-DD");
    const token = await getToken();
    const recs = (await getAll("/open/api/v1/restock/records", token, { start_time: from, end_time: to }, 10)).slice(0, 60);
    data = await Promise.all(recs.map(async (r) => {
      let changes = null;
      if (r.restockOpLogId) {
        try { const d = await getOne("/open/api/v1/markets/" + r.marketId + "/restock/op-logs/" + r.restockOpLogId, token); changes = d.productChanges || []; } catch { changes = null; }
      }
      return { at: r.createdAt, m: r.marketId, type: r.operationType, label: r.operationTypeLabel, by: r.operatorUserName || null, logId: r.restockOpLogId || null, changes };
    }));
  }
  else if (part === "forms") {
    const fs = formsStore(context);
    const keys = (await fs.list({ prefix: "sub/" })).blobs.map((b) => b.key).sort().reverse().slice(0, Math.min(500, Number(q.get("n") || 200)));
    data = (await Promise.all(keys.map((k) => fs.get(k, { type: "json" })))).filter(Boolean);
  }
  else if (part === "days") data = (await store.list({ prefix: "sales/" })).blobs.map((b) => b.key.slice(6)).sort();
  else return Response.json({ ok: false, error: "unknown part" }, { status: 400 });
  return Response.json({ ok: true, part, data }, { headers: { "Cache-Control": "no-store" } });
};

export const config = { path: "/api/dash-data" };
