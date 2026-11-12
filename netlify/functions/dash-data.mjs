// Read-only dashboard data feed. Requires the admin Google sign-in.
// GET /api/dash-data?part=status|snapshot|sales&day=YYYY-MM-DD
import { storeFor } from "../lib/refresh.mjs";
import { adminFrom, deny } from "../lib/session.mjs";

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
  else if (part === "days") data = (await store.list({ prefix: "sales/" })).blobs.map((b) => b.key.slice(6)).sort();
  else return Response.json({ ok: false, error: "unknown part" }, { status: 400 });
  return Response.json({ ok: true, part, data }, { headers: { "Cache-Control": "no-store" } });
};

export const config = { path: "/api/dash-data" };
