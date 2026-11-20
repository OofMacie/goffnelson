# Accessibility audit — WCAG 2.2 Level AAA target

**Status: NOT certified.** This change begins remediation; it does **not** establish WCAG 2.2 AAA conformance for every route, state, external link, and future CMS-generated page. AAA requires meeting all applicable A, AA and AAA success criteria. Automated checkers alone cannot establish AAA.

## Implemented in this branch
- Skip link to `#main-content` on the home page and the events page.
- Visible keyboard focus treatment and a reduced-motion preference in the global layout.
- Book/event carousel arrow control targets increased to at least 44 × 44 CSS pixels.
- Clear labels for navigation search fields and expansion state on dropdown buttons.
- Events page rebuilt as semantic headings + articles; formerly unlabeled search field removed.
- Cards now link to an actual events page rather than `href="#"`.
- Key design tokens darkened for enhanced text contrast. Colors need browser-level verification against all backgrounds and states.
- CMS image descriptions are dedicated editable fields. Publishers must visually verify descriptions before use.
- Library opening hours shared by footer and JSON-LD metadata.

## Important remaining findings / not yet verified
- Navigation component still has multiple placeholder `#` links and one unimplemented Get a Card button. Replace with real destinations or remove interactive semantics before launch.
- The large navigation component uses many inline styles, a future refactor target. Keyboard focus management, menu dismissal, and mobile screen reader behavior need manual review.
- Full contrast audit for text over photos, hovered cards, disabled controls, responsive states and all tokens, including CMS-uploaded images, is outstanding.
- Check layout at 320 CSS px, 200% and 400% zoom, text spacing overrides, touch devices, high-contrast mode, and text resizability.
- Test visual editing dashboard separately: editor accessibility is owned partly by TinaCMS and cannot be assumed AAA.
- Validate alt text against actual images, including Open Library covers and decorative graphics.
- Test with NVDA + Firefox, VoiceOver + Safari, keyboard-only and voice control. Evaluate cognitive accessibility and plain-language copy.
- Verify all content authored by staff; CMS field validation cannot guarantee compliance.
- Run axe-core and Lighthouse as supporting automated checks, then conduct human WCAG criterion-by-criterion assessment.

## WCAG 2.2 AAA references
- Normative WCAG 2.2 specification: https://www.w3.org/TR/WCAG22/
- WCAG 2.2 Quick Reference: https://www.w3.org/WAI/WCAG22/quickref/
- Contrast enhanced 1.4.6, 7:1 normal text, 4.5:1 large text: https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced
- Visual presentation 1.4.8: https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation
- Target size enhanced 2.5.5 (44 × 44): https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced
- Focus appearance 2.4.13: https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance
- Focus not obscured enhanced 2.4.12: https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-enhanced
- Accessible content authoring: https://www.w3.org/WAI/tips/writing/

## Exit criteria before publishing
- All active routes and all interactive component states have passed a WCAG 2.2 AAA audit.
- No placeholder links; forms have visible labels and meaningful validation errors.
- All focus indicators, contrasts, touch targets, text spacing and screen reader interactions manually verified.
- Individual staff member successfully creates, edits, previews and saves content using keyboard and screen reader.
- Accessibility statement describes tested scope and date accurately rather than making unverified blanket claims.
