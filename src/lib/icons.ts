// Lucide icons (ISC, see src/assets/icons/LICENSE.txt), inlined so they inherit currentColor.
const files = import.meta.glob("../assets/icons/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export type IconName =
  | "archive" | "book-open" | "calendar-days" | "dumbbell" | "headphones"
  | "heart-handshake" | "id-card" | "landmark" | "map-pin" | "package"
  | "phone" | "search" | "users";

const sources = Object.fromEntries(
  Object.entries(files).map(([path, svg]) => [path.split("/").pop()!.replace(".svg", ""), svg]),
);

/** Decorative by default: icons always sit next to visible text or inside a labelled control. */
export function iconSvg(name: IconName): string {
  const svg = sources[name];
  if (!svg) throw new Error(`Unknown icon: ${name}`);
  return svg.replace("<svg", '<svg class="icon" aria-hidden="true" focusable="false"');
}
