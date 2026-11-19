import { isLive, deny } from "../lib/session.mjs";
import { getToken, getAll, getOne } from "../lib/haha.mjs";
// Read-only: lists TEV's haha product applications (pending, approved, rejected) with each rejected one's full detail,
// so rejection reasons can be reviewed. Test previews only. Keys stay in Netlify environment variables.
export default async (req, context) => {
  if (isLive(context)) return deny(404, "not available on the live site");
  try {
    const token = await getToken();
    const list = await getAll("/open/api/v1/product-applies", token, {}, 20);
    const out = [];
    for (const a of list) {
      const row = { ...a };
      if (a.status === 2 || a.status === 0) {
        try { row.detail = await getOne("/open/api/v1/product-applies/" + encodeURIComponent(a.applyNo), token); }
        catch (e) { row.detailError = String(e.message || e); }
      }
      out.push(row);
    }
    return Response.json({ ok: true, pulledAt: new Date().toISOString(), count: out.length, applies: out }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return Response.json({ ok: false, error: String(e.message || e) }, { status: 502 });
  }
};

export const config = { path: "/api/haha-applies" };
