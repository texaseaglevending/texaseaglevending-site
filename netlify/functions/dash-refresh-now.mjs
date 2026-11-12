// Test site only: run a refresh by hand, or backfill sales history one month at a time.
// Refuses on the live site. GET /api/dash-refresh-now            -> full refresh (last 2 days of sales)
//                            GET /api/dash-refresh-now?month=2026-10 -> sales for that month only
import { refresh, storeFor, pullSales } from "../lib/refresh.mjs";
import { getToken } from "../lib/haha.mjs";

export default async (req, context) => {
  if (context.deploy && context.deploy.context === "production") return Response.json({ ok: false, error: "not available on the live site" }, { status: 404 });
  const month = new URL(req.url).searchParams.get("month");
  if (month) {
    if (!/^\d{4}-\d{2}$/.test(month)) return Response.json({ ok: false, error: "month must be YYYY-MM" }, { status: 400 });
    const [y, m] = month.split("-").map(Number);
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const r = await pullSales(storeFor(context), await getToken(), month + "-01", month + "-" + String(last).padStart(2, "0"));
    return Response.json({ ok: true, month, ...r });
  }
  return Response.json(await refresh(context, { salesDays: 2 }));
};

export const config = { path: "/api/dash-refresh-now" };
