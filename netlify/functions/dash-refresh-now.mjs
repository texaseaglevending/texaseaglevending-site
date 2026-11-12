// Run a refresh by hand, or backfill sales history one month at a time. Read-only toward haha.
// On the live site it only runs for the signed-in admin; on the test site it is behind Netlify's login. GET /api/dash-refresh-now            -> full refresh (last 2 days of sales)
//                            GET /api/dash-refresh-now?month=2026-10 -> sales for that month only
import { refresh, storeFor, pullSales } from "../lib/refresh.mjs";
import { getToken } from "../lib/haha.mjs";
import { adminFrom } from "../lib/session.mjs";

export default async (req, context) => {
  if (context.deploy && context.deploy.context === "production" && !adminFrom(req)) return Response.json({ ok: false, error: "sign in required" }, { status: 401 });
  const month = new URL(req.url).searchParams.get("month");
  if (month) {
    if (!/^\d{4}-\d{2}$/.test(month)) return Response.json({ ok: false, error: "month must be YYYY-MM" }, { status: 400 });
    const [y, m] = month.split("-").map(Number);
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const r = await pullSales(storeFor(context), await getToken(), month + "-01", month + "-" + String(last).padStart(2, "0"));
    return Response.json({ ok: true, month, ...r });
  }
  // Skip if data was refreshed in the last 2 minutes (repeat taps, several open tabs).
  const last = await storeFor(context).get("status", { type: "json" }).catch(() => null);
  if (last && last.ok && Date.now() - Date.parse(last.finishedAt) < 120000) return Response.json({ ...last, skipped: true });
  return Response.json(await refresh(context, { salesDays: 2 }));
};

export const config = { path: "/api/dash-refresh-now" };
