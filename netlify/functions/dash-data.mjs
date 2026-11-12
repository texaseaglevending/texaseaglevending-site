// Read-only dashboard data feed. Test site only until the Google sign-in gate (step 2) is in place.
// GET /api/dash-data?part=status|snapshot|sales&day=YYYY-MM-DD
import { storeFor } from "../lib/refresh.mjs";

export default async (req, context) => {
  if (context.deploy && context.deploy.context === "production") return Response.json({ ok: false, error: "not available yet" }, { status: 404 });
  const q = new URL(req.url).searchParams;
  const store = storeFor(context);
  const part = q.get("part") || "status";
  let data = null;
  if (part === "status") data = await store.get("status", { type: "json" });
  else if (part === "snapshot") data = await store.get("snapshot", { type: "json" });
  else if (part === "sales") data = await store.get("sales/" + (q.get("day") || ""), { type: "json" });
  else if (part === "days") data = (await store.list({ prefix: "sales/" })).blobs.map((b) => b.key.slice(6)).sort();
  else return Response.json({ ok: false, error: "unknown part" }, { status: 400 });
  return Response.json({ ok: true, part, data }, { headers: { "Cache-Control": "no-store" } });
};

export const config = { path: "/api/dash-data" };
