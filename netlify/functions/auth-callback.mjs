// Finishes Google sign-in. Only ADMIN_EMAIL gets a session; everyone else is turned away.
import { cookies, makeSession } from "../lib/session.mjs";

const page = (msg, status = 403) => new Response(`<!doctype html><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;padding:32px"><h1>Texas Eagle Vending Admin</h1><p>${msg}</p><p><a href="/admin/">Back</a></p>`, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Set-Cookie": "tev_oauth_state=; Path=/api/auth; Max-Age=0" } });

export default async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code"), state = url.searchParams.get("state");
  if (!code || !state || state !== cookies(req).tev_oauth_state) return page("Sign-in expired. Please try again.", 400);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: url.origin + "/api/auth/callback", grant_type: "authorization_code" }),
  });
  const t = await res.json().catch(() => ({}));
  if (!t.id_token) return page("Google sign-in failed. Please try again.", 400);
  // The ID token came straight from Google's token endpoint over HTTPS, so its claims can be read directly.
  let c = {};
  try { c = JSON.parse(Buffer.from(t.id_token.split(".")[1], "base64url").toString()); } catch {}
  const okIssuer = c.iss === "https://accounts.google.com" || c.iss === "accounts.google.com";
  if (!okIssuer || c.aud !== process.env.GOOGLE_CLIENT_ID || !c.email_verified || !(c.exp * 1000 > Date.now())) return page("Google sign-in could not be verified.", 400);
  if (String(c.email).toLowerCase() !== String(process.env.ADMIN_EMAIL || "").toLowerCase()) return page("This Google account does not have access.");
  return new Response(null, { status: 302, headers: new Headers([["Location", "/admin/"], ["Cache-Control", "no-store"], ["Set-Cookie", makeSession(c.email)], ["Set-Cookie", "tev_oauth_state=; Path=/api/auth; Max-Age=0"]]) });
};

export const config = { path: "/api/auth/callback" };
