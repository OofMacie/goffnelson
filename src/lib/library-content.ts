/**
 * The source of truth for published content.
 * TinaCMS edits the JSON files; Astro/React renders them at build time.
 * Presentation components do not own editable content.
 */
import eventData from "../../content/events/events.json";
import settingsData from "../../content/settings/settings.json";

export const libraryEvents = eventData.entries;
export const eventHeading = eventData.title;
export const librarySettings = settingsData;


export function formatOpeningTime(value: string): string {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  return `${hours % 12 || 12}${minutes ? `:${String(minutes).padStart(2, "0")}` : ""} ${hours < 12 ? "AM" : "PM"}`;
}

/** Stable anchor for an event on the program listing page. */
export const eventId = (title: string) =>
  `event-${title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
