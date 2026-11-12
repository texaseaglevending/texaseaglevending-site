// Shared read helpers for the haha Open Platform. Keys come from Netlify environment variables and are never returned or logged.
export const BASE = "https://thor-openapi.hahavending.com";
export const MACHINES = [
  { id: "B101219", name: "RR Snacks", location: "Round Rock", kind: "snacks" },
  { id: "B111755", name: "RR OTC", location: "Round Rock", kind: "otc" },
  { id: "B101231", name: "SA Snacks", location: "San Antonio", kind: "snacks" },
  { id: "B111750", name: "SA OTC", location: "San Antonio", kind: "otc" },
];

export async function getToken() {
  const res = await fetch(BASE + "/open/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ appkey: process.env.HAHA_APPKEY, appsecret: process.env.HAHA_APPSECRET }),
  });
  const j = await res.json();
  if (!j || j.code !== 0 || !j.data || !j.data.token) throw new Error("haha token request failed (code " + (j && j.code) + ")");
  return j.data.token;
}

export async function getAll(path, token, params = {}, maxPages = 100) {
  const out = [];
  let cursor = null;
  for (let i = 0; i < maxPages; i++) {
    const url = new URL(BASE + path);
    url.searchParams.set("page_size", "100");
    for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, v);
    if (cursor) url.searchParams.set("cursor", cursor); else url.searchParams.set("page", "1");
    const res = await fetch(url, { headers: { Authorization: "Bearer " + token } });
    const j = await res.json();
    if (!j || j.code !== 0) throw new Error("haha request failed for " + path + " (code " + (j && j.code) + ")");
    out.push(...(j.data.list || []));
    cursor = j.data.next_cursor;
    if (!cursor) break;
  }
  return out;
}

export async function getOne(path, token) {
  const res = await fetch(BASE + path, { headers: { Authorization: "Bearer " + token } });
  const j = await res.json();
  if (!j || j.code !== 0) throw new Error("haha request failed for " + path + " (code " + (j && j.code) + ")");
  return j.data;
}
