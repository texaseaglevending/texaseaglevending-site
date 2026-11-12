// Who is signed in (GET), or sign out (POST /api/auth/logout).
import { adminFrom, clearSession } from "../lib/session.mjs";

export default async (req) => {
  if (new URL(req.url).pathname.endsWith("/logout")) return new Response(null, { status: 302, headers: { Location: "/admin/", "Set-Cookie": clearSession(), "Cache-Control": "no-store" } });
  const email = adminFrom(req);
  return Response.json({ signedIn: !!email, email: email || null }, { headers: { "Cache-Control": "no-store" } });
};

export const config = { path: ["/api/auth/session", "/api/auth/logout"] };
