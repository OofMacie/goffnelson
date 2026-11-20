# Goff-Nelson Memorial Library — Astro + TinaCMS

A new, independently developed library website built with **Astro 6**, **React**, **Tailwind CSS**, and hosted on **Vercel**. TinaCMS is a **headless editor** for library staff; it does **not** replace or lock away the source code.

> **Status:** TinaCMS integration is under review on `feat/tinacms-library-editor`. Do not assume the editor is live or the site meets WCAG 2.2 AAA yet. Test the preview and check GitHub Actions before merging to `main`.

## Which parts are editable?

| Content | Tina editor | Developer source |
| --- | --- | --- |
| Homepage headline, intro, hero photo and alt text | **Home page** (contextual preview) | `src/components/cms/HomeBody.astro` |
| Events and programs (add, remove, reorder) | **Events and programs** (form editor) | `src/components/Events.tsx` and `src/pages/Events.astro` |
| Book recommendations and covers | **Staff book picks** (form editor) | `src/components/BookCarousel.tsx` |
| Hours, address, phone, Facebook, about text | **Library information** (form editor) | `src/components/Footer.tsx`, `src/layouts/Layout.astro` |

The actual content is stored as JSON under `content/`, versioned with Git. Editors cannot directly change your Astro, React, or CSS source through the content forms. **Developers can continue changing the entire website directly in GitHub or VS Code** without using TinaCMS.

## 1. Connect TinaCloud to GitHub (site administrator)

1. Visit [TinaCloud](https://app.tina.io) and sign in.
2. Create a project and authorize the **`OofMacie/goffnelson`** repository. If GitHub asks which repositories to allow, grant access to this repository.
3. For testing, choose **`feat/tinacms-library-editor`** as the Git branch. Keep the production `main` branch unchanged until the review is finished.
4. From the TinaCloud project settings, obtain the **Client ID** and **Read-only token**.
5. Keep the token secret. Never put it in GitHub source files, a screenshot, public chat, or a pull request.

## 2. Configure Vercel for the CMS preview

1. Open your Goff-Nelson site in the [Vercel dashboard](https://vercel.com/dashboard).
2. Go to **Project Settings → Environment Variables**.
3. Add **`PUBLIC_TINA_CLIENT_ID`** with your TinaCloud Client ID.
4. Add **`TINA_TOKEN`** with the TinaCloud read-only token (this is a **server-side secret**).
5. For the first test, enable the variables only for **Preview** and redeploy the Tina branch.
6. Open the branch preview URL followed by **`/admin/index.html`**. Sign in using TinaCloud.
7. Test one small content edit, check the GitHub commit, and confirm the Vercel preview updates.

**After a successful, reviewed merge:** update TinaCloud's production branch to `main`, include the environment variables in Vercel **Production**, and redeploy. Only then tell staff to use the production editor.

> The Tina interface may be unavailable until TinaCloud's GitHub authorization and Vercel environment variables are complete. This repository does **not** contain any credentials.

## 3. Local setup for the developer

Use Node.js **22.22+** and npm. From your project folder:

```bash
git switch feat/tinacms-library-editor
npm ci
cp .env.example .env
# Edit .env with your TinaCloud values for cloud-connected previews.
npm run dev
```

Open the website at `http://localhost:4321` and the local editor at **`http://localhost:4321/admin/index.html`**.

Useful developer commands:

```bash
npm run content:check  # Validate content JSON, required fields and URLs
npm run check          # Generate Tina types, run Astro/TypeScript checks
npm run build:local    # Build locally without checking TinaCloud
npm run build          # TinaCloud-aware production build; requires configuration
npm run format:check   # Check formatting
```

To change the design, edit `src/components/`, `src/pages/`, `src/layouts/`, and CSS as usual. To add or rename editor fields, edit `tina/config.ts` and adjust the corresponding TypeScript types/components. Avoid duplicating editable data inside components: import it from `src/lib/library-content.ts`.

## 4. Editing guide for library staff

1. Open your library's CMS admin URL (`https://YOUR-DOMAIN/admin/index.html`) and sign in.
2. Choose **Home page**, **Events and programs**, **Staff book picks**, or **Library information**.
3. Edit text and add items using the provided fields. To change an image, upload or select one and write an accurate description in the image-alt-text field.
4. Save your change, then check the published website or preview after Vercel completes its deployment.
5. If a mistake goes live, contact the developer; the published content is tracked in GitHub and a previous version can be restored.

**Accessibility checks before every publish:** Write meaningful link text, avoid all-caps paragraphs, include proper image descriptions, double-check times/dates, and make sure event links have real destinations. Don't paste important text solely into an image.

**Editor expectations:** The **homepage** supports Tina's contextual visual preview; **events, books, and settings** use simpler structured forms, not drag-and-drop site designing.

## 5. Project layout

```text
content/                 # Git-versioned data, edited by Tina
  home/home.json
  events/events.json
  books/books.json
  settings/settings.json
tina/config.ts           # Tina collection definitions and form fields
src/lib/library-content.ts  # Single source of truth for published content
src/lib/tina-data.ts     # Tina data queries
src/lib/tina-islands.ts  # Astro contextual-edit integration
src/components/          # Developer-maintained React/Astro UI
src/pages/               # Routes and pages
public/css/              # Site design system and CSS
docs/TINACMS_SETUP.md    # More detailed connection/developer notes
docs/ACCESSIBILITY_AAA_AUDIT.md # WCAG 2.2 AAA gap list and test plan
```

## 6. Quality gates before merging

- The pull request must pass `npm ci`, `npm run content:check`, `npm run check` and `npm run build:local`.
- Confirm the Vercel preview loads, staff can authenticate, and an edit goes from Tina → GitHub → Vercel.
- Verify links, responsive layout, and keyboard accessibility. There are existing placeholder navigation links that still require real destinations.
- Validate **WCAG 2.2 Level AAA** success criteria manually. Passing an automated tool does **not** demonstrate AAA conformance; consult the audit in `docs/ACCESSIBILITY_AAA_AUDIT.md`.
- Confirm the library's real-world opening hours and event details before launch.

## Official documentation

- [TinaCMS + Astro](https://tina.io/docs/frameworks/astro)
- [TinaCMS visual/contextual editing in Astro](https://tina.io/docs/contextual-editing/astro)
- [Tina schema collections](https://tina.io/docs/reference/collections)
- [TinaCMS source repository](https://github.com/tinacms/tinacms)
- [Astro deployment on Vercel](https://docs.astro.build/en/guides/deploy/vercel/)
- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
