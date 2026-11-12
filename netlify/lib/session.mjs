// Admin session: Google sign-in, limited to ADMIN_EMAIL. Cookie is HMAC-signed; nothing secret is sent to the browser.
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

export const COOKIE = "tev_admin";
const DAYS = 7;
const key = () => createHmac("sha256", process.env.GOOGLE_CLIENT_SECRET || "").update("tev-admin-session-v1").digest();
const sign = (s) => createHmac("sha256", key()).update(s).digest("base64url");

export function cookies(req) {
  const out = {};
  for (const part of (req.headers.get("cookie") || "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function makeSession(email) {
  const exp = Date.now() + DAYS * 864e5;
  const body = Buffer.from(JSON.stringify({ email, exp })).toString("base64url");
  return `${COOKIE}=${body}.${sign(body)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DAYS * 86400}`;
}

export const clearSession = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

// Returns the signed-in admin email, or null.
export function adminFrom(req) {
  if (!process.env.GOOGLE_CLIENT_SECRET || !process.env.ADMIN_EMAIL) return null;
  const v = cookies(req)[COOKIE];
  if (!v || !v.includes(".")) return null;
  const [body, sig] = v.split(".");
  const want = Buffer.from(sign(body)), got = Buffer.from(sig || "");
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    const { email, exp } = JSON.parse(Buffer.from(body, "base64url").toString());
    if (!exp || exp < Date.now()) return null;
    if (String(email).toLowerCase() !== String(process.env.ADMIN_EMAIL).toLowerCase()) return null;
    return email;
  } catch { return null; }
}

export const newState = () => randomBytes(24).toString("base64url");

// Test-site-only guard for tools that must never run on the live site.
export const isLive = (context) => !!(context && context.deploy && context.deploy.context === "production");
export const deny = (status, error) => Response.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } });
