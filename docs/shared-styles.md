# Shared library styles

Every Astro page using `Layout.astro` automatically loads `src/styles/global.css`, including `tokens.css`, `base.css` and `shared.css`. No extra import is required.

## Example

```astro
---
import Layout from "../layouts/Layout.astro";
---
<Layout title="Library Services">
  <section class="container page-section">
    <h1 class="page-title">Library Services</h1>
    <p class="page-copy">Explore our resources.</p>
    <div class="content-grid">
      <article class="content-card">
        <h2 class="section-title">Library cards</h2>
        <a class="button button--primary" href="/Events/">Explore events</a>
      </article>
    </div>
  </section>
</Layout>
```

## CSS classes
- container: shared width and gutters
- page-section: vertical spacing
- page-title / section-title / page-copy: typography
- content-card / content-grid: reusable card and responsive grid
- surface-spruce / surface-lake / surface-maple / surface-birch / surface-mist: paired background and text colors
- content-link: underlined inline link
- button button--primary / button button--accent: existing button styles

## CSS variables
Use `var(--spruce)`, `var(--lake)`, `var(--maple)`, `var(--birch)` or semantic variables such as `var(--text-body)`, `var(--page-bg)`, `var(--space-5)`, `var(--radius-md)`. See tokens.css for all values. Raw colors are not automatically accessible in every combination; check contrast when combining them. Shared classes are opt-in to avoid changing existing page-specific designs.
