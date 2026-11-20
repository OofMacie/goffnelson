# Calendar as the Goff–Nelson Library façade

## Evidence and visual decisions (20 November 2026)

The calendar should **look like the real Goff–Nelson Memorial Library is holding the dates**.

### Primary architectural reference
- Tupper Lake Tourism — exterior photographs in summer and winter: https://www.tupperlake.com/attractions/tupper-lake-public-library
- Clear, recognizable silhouette: **tall squared stone chimney on the left**, **asymmetrical roof sloping to the right**, **dark timber mullions**, **tall glazed façade**, **plain horizontal “LIBRARY” signage**, **low stone base**.
- Avoid generic cabin clip art, invented symmetry or literal triangular A-frame shapes.
- The public history identifies the building at 41 Lake Street, opened in 1972: https://tupperlakepubliclibrary.org/history-of-the-library/
- New York Heritage has a 432-photo collection, including construction and exteriors: https://nyheritage.org/collections/library-photographs-goff-nelson-memorial-library-photograph-collection . Photograph reuse rights need to be checked per image before copying.

### Implementation
- `public/images/goff-nelson-calendar-roof.svg` is an original, **manually-authored SVG interpretation** of the building based on the photographs. It contains hand-defined paths and rectangular masonry marks. It does not copy, embed or trace a photographer's image.
- `src/components/AdirondackCalendar.tsx` wraps the **existing interactive calendar** with an architectural roof, a sign using original site colors, timber-framed date grid and entry/foundation below.
- `src/components/AdirondackCalendar.css` adds scoped responsive styles without changing the site's global design tokens.
- Calendar date blocks are real HTML buttons, not links embedded into SVG. Dialogs, event-card carousel, and booking walkthrough remain interactive.
- The architectural SVG is decorative (`aria-hidden`, empty image alternative), while month and date labels remain native accessible text. See WCAG 2.2 focus visible: https://www.w3.org/WAI/WCAG22/Understanding/focus-visible
- Original Goff–Nelson brand tokens preserved: spruce #1E3828, maple #C49A3C, birch #F6F2EC, Raquette Pond blue #3D7A8A.

### UX and responsive constraints
- No text may be placed on a distorted SVG roof; labels are in HTML below it.
- The roof expands to full facade width, and a separate CSS band houses real calendar controls. It cannot overlay the date grid or intercept clicks.
- On narrow screens the roof is shallower, stone edges narrow, and all seven calendar columns remain navigable.
- Front of building illustration is suggestive, **not a reconstruction to architectural scale**.
- Preserve the demo-only nature of room booking until a separately secured Supabase system is tested, approved and connected.
- Review exterior accuracy against library staff and high-resolution photo references before a production release.

### What to check in the preview
1. Roof slopes in the correct direction and chimney clearly sits on the left.
2. The “LIBRARY” nameplate is legible.
3. The date grid reads as windows within the façade.
4. The stone foundation/entry below feels like the building base but doesn't take attention from the dates.
5. Date popups stay centered/small and event carousel still functions.
6. Booking demo still labels sample slots as fictitious.
7. Mobile calendar is readable at 320 and 375 px viewport widths.
8. Vercel deployment must show **READY** for the exact commit before publishing a preview link.
