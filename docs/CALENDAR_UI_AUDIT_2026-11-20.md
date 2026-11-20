# Goff–Nelson calendar visual and interaction audit
Date: 2026-11-20
Scope: `/Events/` and `/Rooms/` on `feat/adirondack-calendar-room-requests`.
Source: two user-provided 2048 px preview screenshots from the current Vercel design, GitHub implementation, and read-only browser tab text.

## User's aesthetic direction
- Existing library brand is the base, especially the original forest green, maple gold, handmade old-Adirondack print details.
- The front of the **actual building** is the calendar itself: sloped roof and chimney above, date windows inside, foundation and doorway beneath.
- Focus is on dates/programs and easy booking; decorative art must not become a competing hero.
- Event popup is a centered compact card carousel; click a card for full information.

## Identified problems and changes
| Priority | Issue observed | Change |
|---|---|---|
| P1 | “Your monthly program guide” is a disproportionately large white region separating roof/sign from date-grid windows | Replaced with an approx. 75px integrated almanac rail, preserving a gold and lake-blue graphic stripe |
| P1 | Separate Simmons Room information section was **outside** the facade, appearing disconnected from the illustrated building | Moved room details into calendar body's lower interior, above connected entrance/foundation |
| P1 | No easy alternative to scan events without a seven-column month grid | Added **Calendar / List** toggle showing all events for the selected month |
| P2 | “Today” used the visitor's local timezone while library schedule is Tupper Lake/NY | Changed today's key to explicit America/New_York calendar date; formatToParts prevents locale-dependent ISO formatting |
| P2 | Clicking event carousel card to details could lose keyboard focus after card is replaced | Added focus handoff to Back button and restores to card when returning |
| P2 | Room mode repeated “Check with staff” on every date while booking isn't live | Changed calendar cell text to “Try demo” and reinforced explicit fictional sample availability in the status text |
| P2 | Repeated event title keys on one day can collide | Added stable per-day slot index suffix to React keys |
| P3 | Previous oversized introductory hero delayed access to the actual calendar | Reduced hero vertical padding/heading size without replacing existing brand |
| P3 | CSS accreted repeated theme overrides | New refinements isolated in a separate imported stylesheet, but broader consolidation should precede production |

## Content correction needed before launch
The read-only browser preview shows a “Knitting” event stored with date **`tomorrow`** (relative text, not an ISO date). Do NOT reinterpret that date automatically: the authored reference date is uncertain and stale after midnight. To place it on an actual month day, library staff should enter a specific `YYYY-MM-DD` value in TinaCMS. The event remains discoverable under undated programs until corrected.

## Deployment and access
Build validation is performed using Astro/Vercel deployment logs. A build marked READY is evidence of compilation and output routes, not proof of visual browser-level accessibility compliance. The preview uses Vercel deployment protection, so the user's own screenshots and browser tab text informed the visual audit.

## Research supporting decisions
- Nielsen Norman Group: [Visual hierarchy](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/), [Proximity](https://www.nngroup.com/articles/gestalt-proximity/), [Common regions](https://www.nngroup.com/articles/common-region/) — the original detached white heading should not visually separate architectural components.
- W3C: [WCAG 2.2](https://www.w3.org/TR/WCAG22/) — keyboard focus, legible contrast, meaningful target sizes and reflow at narrow widths.
- W3C: [Decorative images](https://www.w3.org/WAI/tutorials/images/decorative/) — building roof is decorative SVG with empty alt; date information remains accessible HTML text.
- USWDS: [Accessible calendar/date picker](https://designsystem.digital.gov/components/date-picker/accessibility-tests/) — visible focus and usable keyboard interaction are critical for date controls.
- Original Goff–Nelson exterior and history: [Tupper Lake Tourism](https://www.tupperlake.com/attractions/tupper-lake-public-library), [Official library history](https://tupperlakepubliclibrary.org/history-of-the-library/).

## Remaining before production
1. Real browser test with keyboard, screen reader and mobile widths at 320/375/768/1280px.
2. Verify contrast and interactive target sizes; fix any actual violations.
3. Confirm linked library events in TinaCMS use precise calendar dates.
4. De-duplicate existing old CSS overrides in a controlled refactor.
5. Integrate a **separate** library-owned, security-reviewed Supabase backend; verify staff approvals, race-condition protections, logging, rate limits and backups before public bookings.
6. Validate architectural illustration accuracy with library staff and photographs.

This is a design branch. No production deployment or real bookings were changed as part of this pass.
