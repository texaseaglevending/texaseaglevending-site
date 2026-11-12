// Saves a copy of each website form submission for the admin dashboard.
// Public endpoint: only known fields are kept, sizes are capped, and each sender is rate limited.
// Nothing in a submission is ever acted on; the dashboard shows it as plain text.
import { formsStore } from "../lib/forms.mjs";
import { createHash, randomBytes } from "node:crypto";

const CATEGORIES = ["New Machine Request", "Card Payment Issue", "Refund Request", "Product Suggestion"];
const FIELDS = ["name", "business", "email", "phone", "contact_by", "ok_to_text", "message", "location", "location_type", "people_on_site", "machine", "issue", "amount_charged", "purchase_date", "purchase_time", "product_category", "product", "on_our_list"];
const ALLOWED_ORIGINS = ["https://texaseaglevending.com", "https://www.texaseaglevending.com"];

export default async (req, context) => {
  const ok = () => Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  if (req.method !== "POST") return Response.json({ ok: false }, { status: 405 });
  const origin = req.headers.get("origin") || "";
  const live = context.deploy && context.deploy.context === "production";
  if (live && !ALLOWED_ORIGINS.includes(origin)) return Response.json({ ok: false }, { status: 403 });
  const raw = await req.text();
  if (raw.length > 8000) return Response.json({ ok: false }, { status: 413 });
  let body; try { body = JSON.parse(raw); } catch { return Response.json({ ok: false }, { status: 400 }); }
  const category = String(body.category || "");
  if (!CATEGORIES.includes(category)) return Response.json({ ok: false }, { status: 400 });

  const store = formsStore(context);
  // Rate limit: 10 submissions per sender per hour (sender = hashed IP; the IP itself is not stored).
  const ip = req.headers.get("x-nf-client-connection-ip") || context.ip || "unknown";
  const who = createHash("sha256").update(ip + "|tev").digest("hex").slice(0, 16);
  const hour = new Date().toISOString().slice(0, 13);
  const rkey = "rate/" + hour + "/" + who;
  const count = Number((await store.get(rkey)) || 0);
  if (count >= 10) return ok();
  await store.set(rkey, String(count + 1));

  const fields = {};
  for (const k of FIELDS) if (body[k] != null && body[k] !== "") fields[k] = String(body[k]).slice(0, k === "message" ? 2000 : 200);
  const at = new Date().toISOString();
  const id = at.replace(/[:.]/g, "-") + "-" + randomBytes(3).toString("hex");
  await store.setJSON("sub/" + id, { id, at, category, subject: String(body.subject || "").slice(0, 200), fields });
  return ok();
};

export const config = { path: "/api/form-submit" };
