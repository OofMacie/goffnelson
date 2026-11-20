import type { APIRoute } from "astro";
import {
  asJson, getBookingConfig, ipFingerprint, isCleanText, isValidLocalDate,
  isValidLocalTime, readBoundedJson, supabaseRest, validRoom, verifyTurnstile,
} from "../../../lib/room-security.server";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  // Require a real same-origin browser POST (prevents cross-site form abuse/CSRF).
  const origin = request.headers.get("origin");
  if (!origin || origin !== url.origin) return asJson({ message: "Request origin was not accepted." }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return asJson({ message: "Send a JSON request." }, 415);
  }

  const config = getBookingConfig();
  if (!config) return asJson({ message: "Room requests are not accepting submissions yet. Please contact the library." }, 503);

  const body = await readBoundedJson(request);
  if (!body) return asJson({ message: "The request was invalid or too large." }, 400);

  const { room, date, startTime, endTime, name, email, phone = "", purpose, collectsMoney, turnstileToken } = body;
  if (typeof room !== "string" || !validRoom(room)
      || !isValidLocalDate(date)
      || !isValidLocalTime(startTime) || !isValidLocalTime(endTime)
      || endTime <= startTime
      || !isCleanText(name, 2, 100)
      || !isCleanText(email, 5, 200)
      || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
      || (phone !== "" && !isCleanText(phone, 3, 40))
      || !isCleanText(purpose, 5, 600)
      || typeof collectsMoney !== "boolean"
      || typeof turnstileToken !== "string") {
    return asJson({ message: "Please check the date, times, and contact information." }, 400);
  }

  const dateStart = new Date(date + "T12:00:00Z").getTime();
  if (dateStart < Date.now() - 86400000 || dateStart > Date.now() + 370 * 86400000) {
    return asJson({ message: "Choose a date within the next 12 months." }, 400);
  }
  const startMinutes = Number(startTime.slice(0,2)) * 60 + Number(startTime.slice(3));
  const endMinutes = Number(endTime.slice(0,2)) * 60 + Number(endTime.slice(3));
  if (endMinutes - startMinutes < 30 || endMinutes - startMinutes > 720) {
    return asJson({ message: "Room requests must be between 30 minutes and 12 hours." }, 400);
  }

  const fingerprint = await ipFingerprint(config.BOOKING_IP_HASH_SECRET, request);
  if (!fingerprint) return asJson({ message: "Request could not be authenticated. Please call the library." }, 403);

  if (!await verifyTurnstile(config.TURNSTILE_SECRET_KEY, turnstileToken, url.hostname)) {
    return asJson({ message: "Spam verification failed or expired. Please try again." }, 403);
  }

  // Never accept a client-supplied status, amount, approval or staff privilege.
  const record = {
    room_slug: room,
    local_date: date,
    local_start: startTime,
    local_end: endTime,
    requester_name: name.trim(),
    requester_email: email.trim(),
    requester_phone: typeof phone === "string" ? phone.trim() : "",
    event_purpose: purpose.trim(),
    collects_money: collectsMoney,
    status: "pending",
    request_fingerprint: fingerprint,
  };

  try {
    const response = await supabaseRest(config, "library_room_requests?select=id,starts_at,ends_at", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Prefer": "return=representation" },
      body: JSON.stringify(record),
    });
    if (!response.ok) {
      const code = (response.payload as {code?: string} | null)?.code;
      if (code === "23P01") return asJson({ message: "That time is already unavailable. Please choose another time." }, 409);
      if (code === "P0001") return asJson({ message: "Too many booking requests. Please call the library." }, 429, { "Retry-After": "3600" });
      // Generic response: never send SQL errors, table names, or sensitive details to a visitor.
      return asJson({ message: "The request could not be completed. Please call the library." }, 503);
    }
    const entry = Array.isArray(response.payload) ? response.payload[0] : null;
    if (!entry?.id || !entry?.starts_at || !entry?.ends_at) {
      return asJson({ message: "The library could not verify your request. Please contact staff." }, 503);
    }
    return asJson({
      message: "Request received and pending library approval.",
      reference: entry.id,
      starts_at: entry.starts_at,
      ends_at: entry.ends_at,
      status: "pending",
    }, 201);
  } catch {
    return asJson({ message: "The booking service is temporarily unavailable. Please contact the library." }, 503);
  }
};
