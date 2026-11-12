// Starts Google sign-in for the admin dashboard.
import { newState } from "../lib/session.mjs";

export default async (req) => {
  const origin = new URL(req.url).origin;
  if (!process.env.GOOGLE_CLIENT_ID) return new Response("Sign-in is not set up yet.", { status: 500 });
  const state = newState();
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID);
  u.searchParams.set("redirect_uri", origin + "/api/auth/callback");
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "openid email");
  u.searchParams.set("prompt", "select_account");
  u.searchParams.set("state", state);
  return new Response(null, { status: 302, headers: { Location: u.toString(), "Set-Cookie": `tev_oauth_state=${state}; Path=/api/auth; HttpOnly; Secure; SameSite=Lax; Max-Age=600`, "Cache-Control": "no-store" } });
};

export const config = { path: "/api/auth/login" };
