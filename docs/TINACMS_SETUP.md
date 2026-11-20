# TinaCMS — Goff-Nelson Memorial Library

## For library staff
The public website is **Astro**. TinaCMS is a private content editor, not a replacement website.
After the administrator authorizes the repository in TinaCloud and the preview build is deployed, authorized staff can open `/admin/index.html` and sign in. The public never needs an account.

Four sections are editable:
- **Home page:** headline, introductory paragraph, photograph, accessible image description. This has click-to-edit live visual preview.
- **Events and programs:** add, remove, reorder or update programs in the list. Set an optional real URL to an event page.
- **Staff book picks:** add or reorder books, edit author, cover URL, ISBN.
- **Library information:** address, phone number, about text, hours, Facebook. Hours update the footer and structured search metadata together.

**Important:** The events, books and settings sections currently use Tina's straightforward structured form editor; only the home page is configured for live visual editing. Editors must save and allow Vercel to rebuild to see changes on the public site. Avoid claiming otherwise.

## Connect TinaCloud (one-time, project administrator)
1. Create a TinaCloud project at https://app.tina.io and authorize `OofMacie/goffnelson`.
2. Choose the `feat/tinacms-library-editor` branch for testing. The `main` branch remains unchanged until a reviewed merge.
3. Copy the TinaCloud **Client ID** and **Read-only token** into Vercel project **Settings → Environment Variables**:
   - `PUBLIC_TINA_CLIENT_ID` (public project identifier)
   - `TINA_TOKEN` (secret; never commit this or share it in a screenshot)
4. Include the variables in the **Preview** environment while testing. Only add to Production after merging and verifying.
5. Deploy the preview branch, then open `https://YOUR-PREVIEW-DOMAIN/admin/index.html`.
6. Test editing a heading, saving, and seeing the Git commit/build in the chosen branch.
7. Invite staff using individual accounts; limit permissions according to your TinaCloud plan.

Do not share a TinaCloud token inside a GitHub issue or public repository.

## Developer setup
The implementation follows the current official Tina/Astro integration:
- `@tinacms/astro`, `tina()`, `tinaAdminDevRedirect()`, and a Vercel SSR adapter.
- Static Astro pages are preserved; only `/tina-island/[name]` renders on demand for live preview.
- `tina/config.ts` is the schema; `content/**` holds Git-backed content.
- `src/lib/library-content.ts` is the shared published-data module. `src/lib/tina-data.ts` + `tina-islands.ts` support editable Astro preview.
- `src/components/cms/HomeBody.astro` contains visual field markers; existing React carousels stay developer-controlled.

Run:
```sh
npm install
npm run dev
# visit http://localhost:4321/admin/index.html
npm run check
npm run build:local
```
**Dependency lockfile:** The remote editing environment cannot run npm's resolver. `package.json` has been updated, but `package-lock.json` must be regenerated with `npm install` and committed before merging the PR or running `npm ci`. This is a release blocker, not optional cleanup.

For TinaCloud builds use `npm run build`, which expects environment credentials. For offline code review use `npm run build:local`.

## Editorial conventions
- Use descriptive, neutral image alt text. Leave it empty only when an image is truly decorative; inspect photos before publishing.
- No dummy `#` links. Optional event URLs may be left empty.
- Use short plain-language descriptions, meaningful headings and valid event details.
- Check that hours and date information is current before publishing.
- Keep presentation in components/CSS, content in `content/**`, and schema in `tina/config.ts`.
- Make larger code changes in feature branches and review a Vercel preview before merging.

## Original documentation
- https://tina.io/docs/frameworks/astro
- https://tina.io/docs/contextual-editing/astro
- https://tina.io/docs/reference/collections
- https://tina.io/docs/reference/media/repo-based
- https://github.com/tinacms/tina-astro-starter
- https://vercel.com/docs/frameworks/frontend/astro
