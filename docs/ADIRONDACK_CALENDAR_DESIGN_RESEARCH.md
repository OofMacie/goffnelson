# Goff–Nelson Library · Community Almanac design reference
_Last researched November 20, 2026 · Feature branch only; not a production launch._

## Our design brief

**Bold, expressive and colorful — not a literal 2000s imitation.** Keep the library's existing visual identity: original spruce green (#1E3828), maple gold (#C49A3C / #DEB94E), birch cream (#F6F2EC), Raquette Pond lake blue (#3D7A8A), berry red (#963030) and warm body typography. Retain the original navigation, logo, homepage hero, TinaCMS content and footer. This is a new calendar feature belonging to the same site, not a competing redesign.

The calendar should feel like a **community almanac**, with a colorful printed-poster attitude and subtle old Adirondack ephemera. Graphic personality comes from intentional typography, vivid blocks, lively category strips, attractive photography and tactile-looking labels, not from generic stock icons or AI-generated vectors.

## References (inspiration only — do not download or copy their copyrighted artwork)

1. **Dover Public Library branding, Behance** — strong modular logo and vibrant color blocks for different audiences; see https://www.behance.net/gallery/200338923/Dover-Public-Library . The visual takeaway is confidence in large typographic shapes and color-coded areas rather than a subdued generic SaaS aesthetic.
2. **Shenzhen Public Libraries, Behance** — vibrant illustrated, almost sticker-like wayfinding and bookmarks; see https://www.behance.net/gallery/161744839/Shenzhen-Public-Libraries . Use its *spirit* of playful learning and color rather than copying characters/art.
3. **Read Fest / New York Public Library event identity, Anna Davis, Behance** — strong primary colors and handcrafted illustration for children's literature; https://www.behance.net/gallery/99551595/Read-Fest-Event-Branding .
4. **Johnson City Public Library website, Juicebox Interactive** — maintains existing identity while adding custom illustrations, playful imagery and accessible event registration; https://juiceboxinteractive.com/project/johnson-city-public-library/ .
5. **PUBLIC LIBRARY, Behance** — oversized distinctive lettering inspired by book spines and two-color street posters; note this is a separate branding project named PUBLIC LIBRARY, not the identity of a municipal library. https://www.behance.net/gallery/69936933/PUBLIC-LIBRARY .

## Historically grounded, rights-verified artifact

**John Filmer, Placid Lake view, 1879** — a real wood engraving from _The American Cyclopædia_, vol. 1, p. 121. Original: https://commons.wikimedia.org/wiki/File:AmCyc_Adirondack_Mountains_-_view_from_Placid_Lake.jpg . Wikimedia Commons identifies the image as public domain in the United States; original is 1951 × 1189 px. This is the Lake Placid region, NOT a picture of the Tupper Lake library itself.

Usage: _only_ a small faded background print vignette in a header/margin, never a huge photo hero, large background texture or content-bearing icon. The Wikimedia source is currently externally linked from CSS; for a production release, fetch and commit a locally hosted derivative with source/PD attribution and an optimized file size. Do not falsely label the file as a hand-drawn SVG: it is a historic raster scan of hand-made art. Do not use copyrighted contemporary Behance imagery as a website asset.

Other research candidates (inspect and verify specific item rights before adding):
- S. R. Stoddard, _The Adirondacks: illustrated_, public-domain book at https://www.loc.gov/item/06024807/
- _Bits of Adirondack Life_, public-domain publication, https://www.loc.gov/item/01014033/
- Original Tupper Lake library archive photographs; get permission where needed.

## Interaction standards

- A clear **7-column calendar** with month navigation, readable dates, per-category colored labels and visible current date.
- Selecting a date opens a **small centered native HTML `<dialog>`**. It shows an event card carousel (one at a time). Choosing a card reveals its full description in the same dialog with a Back button.
- Room preview is explicitly **DEMO** and uses labelled sample time slots, with a disabled/unavailable sample. No sample booking collects or transmits personal information.
- Real bookings may only be enabled after isolated database, RLS, Turnstile server verification, staff controls, test transactions, concurrency tests, monitoring and review.
- Native HTML dialogs are preferred for built-in focus restoration, Escape key behavior and inert background: https://www.w3.org/WAI/WCAG22/Techniques/html/H102
- Provide visible focus states and text labels beyond color (WCAG): https://www.w3.org/TR/WCAG22/
- All touch targets should be comfortable for older patrons and children. Preserve reduced-motion preferences, high contrast, usable mobile layout.
- Maintain searchable /Events/ and /Rooms/ URLs linked from existing original navigation.

## Current source files

- `src/components/AdirondackCalendar.tsx` — calendar, category rules, modal carousel, room demo
- `src/components/AdirondackCalendar.css` — original design tokens + historic vignette + original, expressive brand colors
- `src/pages/Events.astro`, `src/pages/Rooms.astro`
- `src/components/Nav.tsx` — only added real routes for event/room menu items
- `src/pages/api/rooms/*`, `src/lib/room-security.server.ts`, `supabase/migrations/*` — API/security scaffold, NOT a completed/live backend

## Quality gates before production

- Confirm Vercel **READY** and the exact feature commit.
- Run `npm run check` and `npm run build:local` in CI; fix errors.
- Test desktop and mobile calendar, event carousel and complete room demo with keyboard.
- Test dialog focus/return with real browsers.
- Check every external illustration's license and download a local production copy.
- Verify TinaCMS content changes still appear in events.
- **Do not merge or enable patron submissions until separate Supabase infrastructure has been created and security-reviewed.**
