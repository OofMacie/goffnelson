import type { APIRoute } from "astro";
import { asJson, getBookingConfig, supabaseRest, validMonth, validRoom } from "../../../lib/room-security.server";

export const prerender = false;

// Public response is an intentionally tiny projection: only time ranges, never patron details.
export const GET: APIRoute = async ({ request }) => {
  const u = new URL(request.url);
  const month = u.searchParams.get("month");
  const room = u.searchParams.get("room");
  if (!validRoom(room) || !validMonth(month)) {
    return asJson({ enabled: false, room: "simmons", busy: [], message: "Invalid calendar request." }, 400);
  }
  const config = getBookingConfig();
  if (!config) {
    return asJson({ enabled: false, room, busy: [], message: "Secure room availability is not connected." }, 503);
  }

  const year = Number(month.slice(0, 4));
  const monthNum = Number(month.slice(5, 7));
  // Expand query slightly to capture New York local days straddling UTC midnight.
  const from = new Date(Date.UTC(year, monthNum - 1, 1) - 86400000).toISOString();
  const until = new Date(Date.UTC(year, monthNum, 3)).toISOString();
  const params = new URLSearchParams({
    select: "starts_at,ends_at",
    room_slug: "eq." + room,
    status: "in.(pending,approved)",
    starts_at: "lt." + until,
    ends_at: "gt." + from,
    order: "starts_at.asc",
    limit: "500",
  });

  try {
    const result = await supabaseRest(config, "library_room_requests?" + params.toString());
    if (!result.ok || !Array.isArray(result.payload) || result.payload.length >= 500) {
      return asJson({ enabled: false, room, busy: [], message: "Live room availability could not be verified." }, 503);
    }
    const busy = result.payload.map((entry: unknown) => {
      const record = entry as Record<string, unknown>;
      return { starts_at: String(record.starts_at), ends_at: String(record.ends_at) };
    });
    return asJson({ enabled: true, room, busy });
  } catch {
    return asJson({ enabled: false, room, busy: [], message: "Live room availability is temporarily unavailable." }, 503);
  }
};
