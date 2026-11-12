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
  else if (part === "days") data = (await store.list({ prefix: "sales/" })).blobs.map((b) => b.key.slice(6)).sort();
  else return Response.json({ ok: false, error: "unknown part" }, { status: 400 });
  return Response.json({ ok: true, part, data }, { headers: { "Cache-Control": "no-store" } });
};

export const config = { path: "/api/dash-data" };
