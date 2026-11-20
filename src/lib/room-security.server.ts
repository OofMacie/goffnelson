/**
 * Server-only booking utilities. NEVER import this into a client:load React component.
 * Requires a dedicated library Supabase project, not a shared personal project.
 * New-format sb_secret API key is sent ONLY in the apikey header (not Bearer).
 */
const CONFIG_KEYS = ["SUPABASE_URL", "SUPABASE_SECRET_KEY", "TURNSTILE_SECRET_KEY", "BOOKING_IP_HASH_SECRET"] as const;

export function getBookingConfig() {
  const env = Object.fromEntries(CONFIG_KEYS.map(k => [k, process.env[k]?.trim() || ""])) as Record<(typeof CONFIG_KEYS)[number], string>;
  if (!CONFIG_KEYS.every(k => Boolean(env[k]))) return null;
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(env.SUPABASE_URL)) return null;
  if (!env.SUPABASE_SECRET_KEY.startsWith("sb_secret_")) return null;
  if (env.BOOKING_IP_HASH_SECRET.length < 32) return null;
  return env;
}

export function asJson(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status, headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      ...extra,
    },
  });
}

export function validRoom(room: string | null): room is "simmons" {
  return room === "simmons";
}

export function validMonth(month: string | null): month is string {
  if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return false;
  const year = Number(month.slice(0, 4));
  return year >= 2025 && year <= new Date().getUTCFullYear() + 2;
}

export async function supabaseRest(config: NonNullable<ReturnType<typeof getBookingConfig>>, path: string, options: RequestInit = {}) {
  const url = config.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/" + path;
  const res = await fetch(url, {
    ...options,
    headers: {
      apikey: config.SUPABASE_SECRET_KEY,
      "Accept": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(9000),
  });
  let payload: unknown = null;
  try { payload = await res.json(); } catch { /* non-JSON backend error */ }
  return { ok: res.ok, status: res.status, payload };
}

export async function readBoundedJson(request: Request, limit = 8192): Promise<Record<string, unknown> | null> {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > limit) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  let total = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) { await reader.cancel(); return null; }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let off = 0;
    for (const chunk of chunks) { bytes.set(chunk, off); off += chunk.byteLength; }
    const obj: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    return obj !== null && typeof obj === "object" && !Array.isArray(obj) ? obj as Record<string, unknown> : null;
  } catch { return null; }
}

export function isCleanText(value: unknown, min: number, max: number): value is string {
  return typeof value === "string"
    && value.trim().length >= min && value.trim().length <= max
    && !/[\u0000-\u001f\u007f]/.test(value);
}

export function isValidLocalDate(date: unknown): date is string {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(date + "T12:00:00Z");
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === date;
}
export function isValidLocalTime(time: unknown): time is string {
  return typeof time === "string" && /^([01]\d|2[0-3]):(00|30)$/.test(time);
}

export async function verifyTurnstile(secret: string, token: string, hostname: string): Promise<boolean> {
  if (!token || token.length > 2048) return false;
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token }),
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (!response.ok) return false;
    const result = await response.json() as { success?: boolean; hostname?: string; action?: string };
    return result.success === true && result.hostname === hostname && result.action === "room_request";
  } catch { return false; }
}

export async function ipFingerprint(secret: string, request: Request) {
  // Vercel overwrites X-Forwarded-For at the edge. Do not accept user-specified
  // IP headers when deploying to other hosts without a trusted reverse proxy.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  if (!ip || ip.length > 100) return null;
  const daily = new Date().toISOString().slice(0, 10);
  const bytes = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", bytes.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, bytes.encode("goff-nelson-booking|" + daily + "|" + ip));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}
