// Public, read-only menu feed for /menu.html. Reads the nightly product snapshot (no haha call, no keys).
// Returns only display names and categories of products carried at each location: no stock counts, costs or prices.
import { storeFor } from "../lib/refresh.mjs";
import { MENU_MAP, CATEGORIES, LOCATIONS, cleanName } from "../lib/menu-map.mjs";

export default async (req, context) => {
  if (req.method !== "GET") return new Response("Method not allowed", { status: 405 });
  try {
    const snap = await storeFor(context).get("snapshot", { type: "json" });
    if (!snap || !snap.products) return Response.json({ ok: false, error: "menu not ready" }, { status: 503 });
    const stock = snap.stock || {}, cap = snap.capacity || {};
    const out = {};
    for (const [key, loc] of Object.entries(LOCATIONS)) {
      const groups = {};
      for (const [id, p] of Object.entries(snap.products)) {
        const carried = loc.machines.some((m) => ((stock[m] || {})[id] || 0) > 0 || ((cap[m] || {})[id] || 0) > 0);
        if (!carried) continue;
        const [name, cat] = MENU_MAP[id] || [cleanName(p.name), "new"];
        if (!name) continue;
        (groups[cat] ||= new Set()).add(name);
      }
      out[key] = {
        name: loc.name,
        categories: CATEGORIES.filter(([id]) => groups[id] && groups[id].size)
          .map(([id, title]) => ({ id, title, items: [...groups[id]].sort((a, b) => a.localeCompare(b)) })),
      };
    }
    return Response.json(
      { ok: true, updated: snap.pulledAt || null, locations: out },
      { headers: { "Cache-Control": "public, max-age=900" } }
    );
  } catch (e) {
    return Response.json({ ok: false, error: "menu unavailable" }, { status: 500 });
  }
};

export const config = { path: "/api/menu" };
