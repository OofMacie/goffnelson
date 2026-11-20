# Security hardening research: Astro 6 + Vercel + TinaCMS public library site

Research date: 2026-11-20. 142 numbered sources are listed in section 5. Claims marked ✔ were read from the source; † means the URL was only status-checked (see section 0).

## Status

**Done in this repository**

- CMS-editable links, images and phone numbers are checked at render time (`src/lib/safe-url.ts`), so a `javascript:` or `data:` value typed into Tina cannot reach the page (F9).
- The JSON-LD block escapes `<` so editor text cannot close the script element (F10).
- `window.open` calls in the nav use `noopener,noreferrer` (F11).
- `vercel.json` sets `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Cross-Origin-Opener-Policy` and `Permissions-Policy`. HSTS is deliberately not set there: Vercel already sends `max-age=63072000; includeSubDomains; preload`, and a shorter value would weaken it.
- The nav no longer uses React inline `style=""` attributes, which removes the main blocker for a strict CSP (F3).

**Needs a decision or access you control (not changed here)**

- Point `goffnelsonlibrary.org` at Vercel; it currently serves from a different host without HSTS (F21).
- Upgrade Astro, `@astrojs/vercel` and the audit-flagged packages, then re-run `npm audit` (F14, P0). This is a major-version jump, so build and test it on a branch.
- GitHub settings: branch protection, secret scanning, Dependabot, 2FA (P0).
- Content-Security-Policy for public pages and the Tina admin: trial as Report-Only on a preview deployment first (sections 3.2 and 3.3).
- `security.txt` needs a real security contact address (section 3.4).

The rest of this document is the original research report, unedited.

---

## 0. Method and legend

- **HTTP check.** Every URL in section 5 returned HTTP 200 on 2026-11-20. CISA blocks `curl`, so I checked those pages with the fetch tool instead.
- **✔ vs †.** A ✔ after a source means I read the text that backs the claim. A † means I only confirmed the URL exists. Claims attributed to † sources come from the standard behaviour of that header or spec.
- **Local inspection.** I read the installed packages (Astro 6.4.8, `@astrojs/vercel` 10.0.8, tinacms 3.15.2, `@tinacms/astro` 0.8.0) and the built Tina admin bundle in `public/admin`. I also ran `npm audit --omit=dev`, which is read-only.
- **Live domain.** I made one `curl -I` request to `goffnelsonlibrary.org`.

## 1. Key findings about this repo

These are checked against the code, not taken from docs.

| # | Finding | Evidence |
|---|---|---|
| F1 | Astro 6 has **stable** CSP (`security.csp`, introduced in 6.0.0). By default it emits a `<meta http-equiv="content-security-policy">` with `script-src`/`style-src` hashes. `frame-ancestors`, `report-uri` and `sandbox` are ignored in a meta tag. `@astrojs/vercel`'s `staticHeaders: true` option (added in adapter 10.0.0) writes the CSP as a real header instead. | `node_modules/astro/dist/types/public/config.d.ts:660-700`; Astro Vercel docs [2]; `render/page.js:61,91` sets the header when the destination is header/adapter. `render/head.js:33` emits the meta. |
| F2 | Astro's `security.csp.directives` only accepts: base-uri, child-src, connect-src, default-src, fenced-frame-src, font-src, form-action, frame-ancestors, frame-src, img-src, manifest-src, media-src, object-src, referrer, report-to, report-uri, require-trusted-types-for, sandbox, trusted-types, upgrade-insecure-requests, worker-src. `style-src-attr` is **not** allowed. | `astro/dist/core/csp/config.d.ts` (ALLOWED_DIRECTIVES) |
| F3 | The built home page has 11 inline `style="…"` attributes (React inline styles in `Nav.tsx`), 3 inline `<script>`, 3 inline `<script type=module>` and 1 `<style>`. Hashes cover inline `<script>` and `<style>` elements but not `style=""` attributes. Under a strict CSP those attributes would be blocked unless refactored to classes. | `dist/client/index.html` (grep), `src/components/Nav.tsx` |
| F4 | The Tina admin is **same-origin** (`/admin/index.html`) and iframes the site. `PUBLIC_TINA_ADMIN_ORIGIN` is optional; if unset, the bridge falls back to `window.location.origin`. So `frame-ancestors 'self'` is enough, and no third-party admin origin is needed. | `@tinacms/astro/src/internal/admin-origin.ts:1-18`; `is-edit-mode.ts` |
| F5 | In edit mode the Tina middleware injects an **unhashed inline module script**: `import{init,refreshForms}from"/admin/bridge.js";init();document.addEventListener("astro:page-load",refreshForms);`. A strict `script-src` blocks it on `/tina-island/*` unless that hash is added. With `PUBLIC_TINA_ADMIN_ORIGIN` unset, its SHA-256 is `sha256-q/xE4XZI6nH/oIEXpKilile7aX5tka5E8p4pVsxcfRs=` (computed locally). | `@tinacms/astro/src/middleware.ts:96-107` |
| F6 | Edit mode detection depends on `?tina-edit=1`, or on `Sec-Fetch-Dest: iframe` plus a same-origin `Referer` under `/admin/`, or on the cookie `__tina_edit=1; Path=/; SameSite=Strict; Max-Age=3600`. A global `Referrer-Policy: no-referrer` would break the Referer path, so use `strict-origin-when-cross-origin`. The cookie has no `Secure` or `HttpOnly` flag; it is a preview flag, not a session. | `is-edit-mode.ts` |
| F7 | `/tina-island/[name]` only serves **POST** with the Tina preview content-type, and rejects `Sec-Fetch-Site: cross-site`. Anything else gets 405 or 404, so a WAF rule can safely deny every non-POST request. Responses are `Cache-Control: no-store`. | `@tinacms/astro/src/island-route.ts:74-88`; `src/pages/tina-island/[name].ts` |
| F8 | The built Tina admin contacts: `content.tinajs.io`, `identity.tinajs.io`, `identity-v2.tinajs.io`, `assets.tinajs.io`, `app.tina.io`, `us.i.posthog.com` (telemetry), `fonts.googleapis.com` and **`cdn.jsdelivr.net` (Monaco editor, pinned `monaco-editor@0.55.1`, loaded without SRI)**. No `eval(` or `new Function(` strings were found, so `unsafe-eval` is probably not needed. The admin has one inline `<script>` (the `handleLoadError` snippet), SHA-256 `sha256-v47lSjgy8bf0s1E6D9jx3JZw8bvkO/g+H0JyZDa1kFQ=`. | `public/admin/index.html`, `public/admin/assets/*.js` (grep) |
| F9 | Several CMS-editable URLs are **not sanitised**. These are `event.link` (`src/pages/Events.astro:30`, `src/components/cms/EventCarousel.astro:46`), `facebook` (`Footer.tsx:41`), nav `pill.href` (`Nav.tsx:309`) and `book.cover` (`BookCarousel.astro:19`). `@tinacms/astro/sanitize` exports `sanitizeHref` and `sanitizeImageSrc`; they block `javascript:`, `data:`, `vbscript:` and `//host`. `sanitizeHref` allows only http, https, mailto and relative paths, so it would reject `tel:`. | `node_modules/@tinacms/astro/src/sanitize.ts:1-60` |
| F10 | The JSON-LD block is built with `set:html={JSON.stringify(schema)}` from CMS fields (phone, address, hours). `JSON.stringify` does not escape `<`, so an editor-supplied `</script>` would break out. Astro warns that `set:html` is not escaped. | `src/layouts/Layout.astro:149`; Astro docs [3]; `Icon.astro:9` and `Icon.tsx:4` also use raw HTML (static SVG map; I did not confirm the `name` allowlist). |
| F11 | Every `<a target="_blank">` I found already has `rel="noopener noreferrer"`. But `window.open(url,"_blank")` at `Nav.tsx:182,300,332` has no `noopener`, and the admin bundle also calls `window.open(…,"_blank")`. | grep |
| F12 | There is no `vercel.json`, `.npmrc`, `.github/dependabot.yml`, `CODEOWNERS`, `SECURITY.md` or `public/.well-known/` file. `netlify.toml` is a legacy file: it holds a Storyblok `frame-ancestors` header and a `/proxy/catalog/*` rewrite to `cefls.ent.sirsi.net`. Nothing in `src` references `/proxy/catalog`. | file listing, grep |
| F13 | The workflow `cms-quality.yml` has `permissions: contents: read` (good). It uses unpinned `actions/checkout@v4` and `actions/setup-node@v4`, and runs `npm ci --no-audit`. Lockfile v3 is present. Packages with install scripts: `esbuild`, `@tinacms/cli/esbuild`, `sharp`, `better-sqlite3`, `core-js`, `fsevents`. | `.github/workflows/cms-quality.yml:17-24`; `package-lock.json` (`hasInstallScript`) |
| F14 | `npm audit --omit=dev` reports 19 vulnerabilities: 1 critical (`astro`: XSS via spread attribute names and `transition:*` directives), 14 high, 2 moderate, 2 low. High items include `@astrojs/vercel`, `@vercel/routing-utils`, `path-to-regexp`, `sharp`, `svgo`, `zod`, `postcss`, `nanoid` and `deepmerge-ts` (via `@playform/compress` and `flowbite-react`). The Astro docs show `@astrojs/vercel` v11.0.22 as current; the repo has 10.0.8. | `npm audit` output, 2026-11-20; Astro docs [2] |
| F15 | **ISR advisory does not apply today.** GHSA-x27w-589x-frm2 (`/_isr?x_astro_path=…` path override) affects `@astrojs/vercel` ≥10.0.3, fixed in 11.0.3, but only when `isr: true`. This repo does not enable ISR. Upgrade anyway. | advisory text [26]; `astro.config.mjs` |
| F16 | Installed tinacms 3.15.2 is newer than the fix versions for GHSA-x34j (needs ≥3.14.0, critical, admin preview iframe loading an attacker-controlled origin from the URL fragment) and for GHSA-g5qx / GHSA-2vcc (≥3.9.3). Installed `@tinacms/mdx` 2.4.2 meets the GHSA-6vw5 fix. So the known Tina advisories are patched, but keep tinacms current. | `gh api …/security-advisories/*`; installed versions |
| F17 | `tina/config.ts` takes the branch from `VERCEL_GIT_COMMIT_REF`. GHSA-pwhx-cvv3-qj5c (CVE-2026-108259) is code injection through an unescaped Git branch name in generated client source, patched in `@tinacms/cli` ≥3.0.0. Installed is 4.0.5, so it is patched. Still avoid odd branch names. | `tina/config.ts:3-7`; [34] |
| F18 | The generated Tina client embeds the token: `tina/__generated__/client.ts:3` has `token: …`. That directory is gitignored (`.gitignore:12`). Don't import this client from any `client:*` React island, or the token would ship to browsers. | file + `.gitignore` |
| F19 | The public pages preconnect to `fonts.googleapis.com` and `fonts.gstatic.com` (`Layout.astro:144-145`), so each visitor's IP is exposed to Google. | `Layout.astro`; `dist/client/index.html` |
| F20 | Partytown is installed, but I found no `type="text/partytown"` scripts in `src`. The build still ships `/~partytown/*` (including `partytown-sw.js`) plus an inline Partytown snippet in every page. | `dist/client/~partytown`; `dist/client/index.html` |
| F21 | Observed **2026-11-20**: `https://goffnelsonlibrary.org/` is served by `openresty` / AWS ALB (`server: openresty`, `AWSALB` cookies, `x-service: pixie-default`), **not Vercel**. It sends no HSTS, CSP or `X-Content-Type-Options`. `/admin/index.html` returns 307 to `http://goffnelsonlibrary.org/`. This may be a pre-cutover state. | `curl -I` |
| F22 | Open Library covers by ISBN are rate-limited to 100 requests per IP per 5 minutes, and over-limit requests get 403. The response has `access-control-allow-origin: *`. Images send the page origin as `Referer`. | [135]; `curl -I` |

## 2. Prioritised recommendations

| Priority | Recommendation | Exact config / value | Sources |
|---|---|---|---|
| **P0** | Upgrade Astro, the Vercel adapter and the audit-flagged transitive packages, then re-audit. | `npm i astro@latest @astrojs/vercel@latest @astrojs/react@latest @astrojs/mdx@latest tinacms@latest @tinacms/cli@latest @tinacms/astro@latest`, then `npm audit --omit=dev --audit-level=high`. Latest Astro advisories include 6.4.7 auth bypass (fixed 6.4.8) and `define:vars` `</script>` bypass (fixed 6.1.6). | [26][27][28][29][30][118][119] |
| **P0** | Sanitise every CMS-controlled URL. | `import { sanitizeHref, sanitizeImageSrc } from "@tinacms/astro/sanitize"`. Use `href={sanitizeHref(event.link)}` in `Events.astro:30` and `EventCarousel.astro:46`, and apply it to `facebook`, nav links and `pill.href`. Use `sanitizeImageSrc(book.cover)`. Handle `tel:` separately: allow only `/^[+0-9()\-.\s]+$/` on `phoneLink`. Also add `ui.validate` in `tina/config.ts` so editors can't save `javascript:` URLs. | [33][37][43][44][54] |
| **P0** | Escape `<` in the JSON-LD `set:html`. | `set:html={JSON.stringify(schema).replace(/</g,"\\u003c")}`. Confirm `iconSvg(name)` only returns entries from a fixed map and returns `""` otherwise. | [3][29][43][44] |
| **P0** | Add a `vercel.json` with security headers (see §3.1). Currently only legacy `netlify.toml` headers exist. | See §3.1. | [9][10][42][55] |
| **P0** | Confirm the production domain actually points at Vercel. Today it serves from a non-Vercel host with no HSTS and an http redirect on `/admin`. | After cutover, check `curl -sI https://goffnelsonlibrary.org/ \| grep -i strict`. Vercel's default custom-domain HSTS is `max-age=63072000`. | [11][93] |
| **P0** | Secrets: store `TINA_TOKEN` (or the legacy `CONTENT_READONLY`) as a **Secret**, and `PUBLIC_TINA_CLIENT_ID` as **Config**. Use only a Content (read-only) token, never the Search token. Rotate if ever shared. Add a post-build leak check. | Vercel env type = Secret for the token, scoped to Production and Preview only. After build: `! grep -rIl "$TINA_TOKEN" dist/client` in CI. | [13][22][23][47][55] |
| **P0** | Enable GitHub protections on `main`: 2FA, ruleset or branch protection (PR required, `validate` check required, no force-push), secret scanning with push protection, Dependabot alerts and updates. | Settings → Rules → Rulesets; Security → enable all four. Confirm whether the TinaCloud GitHub app needs a bypass, or use Tina's editorial workflow (PR per edit). | [99][103][104][106][107][108][111][139] |
| **P1** | Public-page CSP via Astro's `security.csp`, delivered as a header with `staticHeaders: true` (see §3.2). Trial it on a preview deployment before production. | See §3.2. | [1][2][41][55][57][87][88] |
| **P1** | Admin CSP only on `/admin/*`, starting as `Content-Security-Policy-Report-Only`. | See §3.3. | [10][41][74][76] |
| **P1** | `frame-ancestors 'self'` plus `X-Frame-Options: SAMEORIGIN`. Tina's live preview is same-origin, so no third-party origin is needed. If you ever set `PUBLIC_TINA_ADMIN_ORIGIN` to another origin, add it to `frame-ancestors` and drop X-Frame-Options (`ALLOW-FROM` is obsolete). | `frame-ancestors 'self'`; `X-Frame-Options: SAMEORIGIN` | [51][56][69][85] |
| **P1** | Run `npm ci`, pin Actions to full commit SHAs, add Dependabot, run audit in CI. | `uses: actions/checkout@<40-char-sha> # v4.x.y`. Create `.github/dependabot.yml` with `package-ecosystem: npm` and `github-actions`, `schedule.interval: weekly`, `cooldown.default-days: 7`. Change the CI step to `npm ci` then `npm audit --omit=dev --audit-level=high`. | [48][52][109][110][117][118] |
| **P1** | Add a `.npmrc` as a supply-chain gate. Install scripts are an attack vector (CISA Shai-Hulud advisory). | `min-release-age=7`, `audit-level=high`, `engine-strict=true`. Evaluate `ignore-scripts=true` plus an explicit rebuild or `allowScripts` allowlist for esbuild, sharp and better-sqlite3; test that the build still works. | [46][99][119][122][123] |
| **P1** | WAF rule for `/tina-island/*`: deny every non-POST request (the route only accepts POST), and rate-limit POSTs. Hobby plans get 3 custom rules and 1 rate-limit rule per project. | Rule 1: path starts with `/tina-island/` AND method ≠ POST → Deny. Rule 2 (rate limit): same path, key IP, ~60 requests / 60 s, action Deny or 429. Prefer Deny to Challenge (see §4). | [14][15][16][17][21] |
| **P1** | Don't port `netlify.toml`'s `/proxy/catalog/*` rewrite. The code links straight to `cefls.ent.sirsi.net`, so the proxy is dead and would be an open gateway. If you ever need it, hard-code the destination and add no user-controlled host. | Omit from `vercel.json`. | [9][20][140][54] |
| **P1** | Add `rel`/features to `window.open`. | `window.open(url, "_blank", "noopener,noreferrer")` at `Nav.tsx:182,300,332`. | [71][72][80] |
| **P2** | Self-host fonts (Astro Fonts API) and drop the Google preconnects. This removes `fonts.googleapis.com` and `fonts.gstatic.com` from the CSP and stops sending visitor IPs to Google. | Use the Astro `fonts` config, then `font-src 'self'`. | [6][59][132][133] |
| **P2** | Cover images: prefer resolving ISBN to a local image at build time. Otherwise add per-image `referrerpolicy="no-referrer"`, `loading="lazy"`, and `?default=false` so a missing cover returns 404 and can fall back. | `<img src="https://covers.openlibrary.org/b/isbn/<digits>-L.jpg?default=false" referrerpolicy="no-referrer" alt="…">`. Pre-fetching also avoids the 100-requests-per-5-minutes ISBN limit. SRI does not apply to images. | [70][77][78][90][135][138] |
| **P2** | Remove Partytown if unused (no `type="text/partytown"` scripts). It removes a service worker and an inline snippet from every page. If kept, serve `/~partytown/` same-origin and allow `worker-src 'self'`. | Delete `partytown()` from `astro.config.mjs`. | [4][8][61] |
| **P2** | HSTS: staged roll-out, then preload only once all subdomains are HTTPS. | `max-age=300; includeSubDomains` → `max-age=604800; includeSubDomains` → `max-age=2592000; includeSubDomains` → `max-age=63072000; includeSubDomains; preload`. | [50][62][82][93] |
| **P2** | `Permissions-Policy`: deny features the site never uses. | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=()` | [65][79] |
| **P2** | COOP/CORP/COEP: set COOP only; skip COEP and a global CORP. | `Cross-Origin-Opener-Policy: same-origin-allow-popups` (keeps `window.open` and Tina login popups working). Optionally `Cross-Origin-Resource-Policy: same-site` on `/admin/*`. COEP not needed (no cross-origin isolation requirement; it would break cover images). | [66][67][68][81][91] |
| **P2** | Publish `security.txt` at `/.well-known/security.txt` and enable GitHub private vulnerability reporting. | See §3.4. | [83][86][94][116] |
| **P2** | DNS/TLS: add a CAA record permitting Let's Encrypt, and enable DNSSEC at the registrar and DNS host. | `@ CAA 0 issue "letsencrypt.org"`. If you use wildcard certs, also `0 issuewild "letsencrypt.org"`. | [12][84][97][98][136][137] |
| **P2** | Backups and availability: Git history is the content store. Keep a mirror of the repo, and know how to Instant Rollback in Vercel. | `git clone --mirror` weekly to an offline location; Vercel Instant Rollback (Hobby can only roll back to the previous deployment). | [18][100][115][139] |
| **P2** | Staff access: use passkeys or phishing-resistant MFA on GitHub and Vercel; least-privilege roles. TinaCloud has only two project roles: Editor (edit content) and Admin (also manages config and collaborators). Make most staff Editors. | GitHub: Read/Triage for non-developers; org-level 2FA required. TinaCloud: Editor by default. | [24][102][111][112][114][141] |
| **P2** | Add a `CODEOWNERS` file for sensitive paths, and make rulesets require code-owner review. | `.github/CODEOWNERS`: `/vercel.json @owner`, `/.github/ @owner`, `/tina/ @owner`, `/astro.config.mjs @owner`. | [105][104] |
| **P3** | Run Mozilla Observatory and CSP Evaluator once headers are live. | https://developer.mozilla.org/en-US/observatory and csp-evaluator.withgoogle.com. | [75][92] |
| **P3** | Don't set `X-XSS-Protection`, even though Vercel's `vercel.json` docs example includes it; it is a legacy header and rely on CSP instead. | omit | [9][41] |

## 3. Concrete config

### 3.1 `vercel.json` (create)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=300; includeSubDomains" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=()" },
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin-allow-popups" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" }
      ]
    },
    {
      "source": "/admin/(.*)",
      "headers": [
        { "key": "Content-Security-Policy-Report-Only", "value": "<admin CSP from §3.3>" }
      ]
    }
  ]
}
```

- **Syntax.** Header rules use `source` plus a `headers` array of `{key, value}` pairs. `has` and `missing` are optional conditions. [9] ✔
- **HSTS ramp.** The `max-age=300` start is the first stage of the ramp in the table above. Vercel's default for custom domains is only `max-age=63072000`, with no `includeSubDomains` or `preload`. [11] ✔
- **Conflicting rules.** I did not verify how Vercel resolves two rules that set the same header key. The admin rule above sets only CSP, so it doesn't collide with the global rule.

### 3.2 `astro.config.mjs` (public pages)

```js
adapter: vercel({ staticHeaders: true }),   // CSP as header, not <meta> (frame-ancestors only works as a header)
security: {
  csp: {
    algorithm: "SHA-256",
    directives: [
      "default-src 'self'",
      "img-src 'self' data: https://covers.openlibrary.org",
      "font-src 'self'",                    // after self-hosting fonts; otherwise add https://fonts.gstatic.com
      "connect-src 'self'",
      "frame-src 'none'",
      "frame-ancestors 'self'",             // Tina live preview is same-origin (F4)
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "worker-src 'self'",                  // only if Partytown is kept
      "upgrade-insecure-requests"
    ],
    scriptDirective: {
      // Tina's edit-mode bridge, injected after Astro renders (F5). Re-compute if Tina or PUBLIC_TINA_ADMIN_ORIGIN changes.
      hashes: ["sha256-q/xE4XZI6nH/oIEXpKilile7aX5tka5E8p4pVsxcfRs="]
    }
  }
}
```

- **Hashes vs nonces.** Astro uses hashes of its own bundled and inline scripts and styles. Per its docs, `unsafe-inline` is ignored when a hash is present, and external scripts and styles need explicit hashes or resources. [1] ✔ Nonces need per-request rendering, which this static site does not have.
- **Inline style attributes.** The 11 `style=""` attributes in the built HTML (F3) would be blocked, and Astro can't emit `style-src-attr` (F2). Replace React inline styles with Tailwind classes.
- **CSP limitations.** Astro's CSP does not support `<ClientRouter />` or Shiki. [1] ✔
- **Check after build.** `npm run build && curl -sI <preview-url>/ | grep -i content-security`. I read Astro's header-vs-meta logic in `render/page.js`/`head.js` but did not run a deployment.
- **Report-only.** I found no report-only mode in Astro's `security.csp`. To trial the policy, put the same policy in `Content-Security-Policy-Report-Only` in `vercel.json` on a preview deployment first. [74][87]

### 3.3 Admin CSP (starting point, not browser-tested)

Derived from a static scan of the admin bundle (F8):

```
default-src 'self';
script-src 'self' 'sha256-v47lSjgy8bf0s1E6D9jx3JZw8bvkO/g+H0JyZDa1kFQ=' https://cdn.jsdelivr.net;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net;
font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net;
img-src 'self' data: blob: https://assets.tinajs.io;
connect-src 'self' https://content.tinajs.io https://identity.tinajs.io https://identity-v2.tinajs.io https://assets.tinajs.io https://app.tina.io https://us.i.posthog.com https://cdn.jsdelivr.net;
frame-src 'self';
worker-src 'self' blob:;
object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'
```

- **Order of work.** Deploy it as Report-Only, edit in the admin for a session, and then tighten.
- **Possible gaps.** Media from GitHub raw or other origins and `unsafe-inline` for styles may be needed; I could not test them.
- **Hash drift.** The inline-script hash changes whenever `tinacms build` changes its template.
- **Third-party risk.** The Monaco loader is pulled from jsDelivr with no SRI, and telemetry goes to PostHog. Treat both as accepted risks unless you can block them without breaking features.

### 3.4 `public/.well-known/security.txt`

```
Contact: mailto:<security-contact@goffnelsonlibrary.org>
Expires: 2027-11-20T00:00:00.000Z
Preferred-Languages: en
Canonical: https://goffnelsonlibrary.org/.well-known/security.txt
```

`Contact` and `Expires` are the required fields; `Expires` should be at most about a year ahead. [83] ✔ [94]

## 4. Accessibility and security interactions

- **CSP and rendering.** Blocked inline `style=""` attributes (F3) can silently remove focus rings, `sr-only` utilities or layout rules. Re-run an accessibility checker such as axe or Lighthouse after turning on CSP. Browser-extension screen readers and assistive tools are not governed by the page CSP (general browser behaviour, not verified here). WCAG basics are in [125].
- **Timeouts in the Tina admin.**
  - Time limits set by content fall under **WCAG 2.2.1 Timing Adjustable** (Level A): users must be able to turn off, adjust or extend them. [126] ✔
  - **WCAG 2.2.6 Timeouts** (Level AAA) says users must be told how long they can be inactive before they might lose data. [127] ✔
  - I found no documentation of TinaCloud session length or inactivity timeout (pages read: [23], [24], [25]). That is a gap. Document the session behaviour for staff, and do not shorten GitHub or Vercel session policies without a warning.
  - The only timeout I found in code is the `__tina_edit` preview cookie (`Max-Age=3600`, F6), which is a preview flag, not an auth session.
- **MFA and WCAG 3.3.8 Accessible Authentication (Minimum).** Authentication must not require a cognitive function test, such as remembering or transcribing a code, unless an alternative exists. [128] So prefer passkeys and password managers (copy and paste allowed) over retyping codes. [96][111][141]
- **New windows.** The catalog links open in new tabs. **WCAG 3.2.5 Change on Request** and techniques H83 and G201 recommend warning users when a link opens a new window. [129][130][131] `rel="noopener"` does not change that, so keep the visible "(opens in new tab)" text alongside the security fix.
- **Cover images.** CSP or a rate limit can make `covers.openlibrary.org` images fail to load. Keep meaningful `alt` text so the page still conveys the information (WCAG 1.1.1). [142]
- **WAF challenges.** A CAPTCHA-style challenge on public pages can conflict with 3.3.8. This is my inference, not a cited statement. Use Deny and rate limits instead of Challenge for the public site. [14][128]
- **`security.txt`.** It is metadata for researchers, not a user-facing page, so it has no direct WCAG requirement. Pair it with a human-readable accessibility and problem-report contact page.

## 5. Source list

Legend: ✔ = I read the relevant text; † = URL status-checked only.

1. Astro configuration reference (security.csp, directives, hashes) ✔ - https://docs.astro.build/en/reference/configuration-reference/#securitycsp - Stable CSP in 6.0.0, meta element, hashes, limitations.
2. Astro Vercel adapter guide ✔ - https://docs.astro.build/en/guides/integrations-guide/vercel/ - `staticHeaders` option; current adapter is v11.
3. Astro template directives reference ✔ - https://docs.astro.build/en/reference/directives-reference/ - `set:html` is not escaped (XSS warning).
4. Astro Partytown integration † - https://docs.astro.build/en/guides/integrations-guide/partytown/ - Integration behaviour.
5. Astro on-demand rendering † - https://docs.astro.build/en/guides/on-demand-rendering/ - On-demand routes and `prerender = false`.
6. Astro Fonts guide † - https://docs.astro.build/en/guides/fonts/ - Self-hosting fonts.
7. Astro images guide † - https://docs.astro.build/en/guides/images/ - Remote image handling.
8. Partytown configuration ✔ - https://partytown.qwik.dev/configuration - `lib` files must be same-origin.
9. Vercel `vercel.json` reference ✔ - https://vercel.com/docs/project-configuration/vercel-json - `headers` syntax; `has`/`missing`; rewrite security note.
10. Vercel CSP guide ✔ - https://vercel.com/docs/cdn-security/security-headers - Report-Only first; avoid `unsafe-inline`/`unsafe-eval`; nonces/hashes.
11. Vercel encryption and TLS ✔ - https://vercel.com/docs/cdn-security/encryption - Default HSTS values on `.vercel.app` vs custom domains.
12. Vercel domain troubleshooting (CAA) ✔ - https://vercel.com/docs/domains/troubleshooting - CAA record `0 issue "letsencrypt.org"`.
13. Vercel Secret / Config environment variables ✔ - https://vercel.com/docs/environment-variables/sensitive-environment-variables - Secrets are write-only; build-log redaction.
14. Vercel WAF rate limiting ✔ - https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting - Hobby limits: 1 rate-limit rule, IP/JA4 keys.
15. Vercel DDoS mitigation ✔ - https://vercel.com/docs/vercel-firewall/ddos-mitigation - Automatic on all plans.
16. Vercel Firewall overview † - https://vercel.com/docs/vercel-firewall - Firewall layers.
17. Vercel WAF custom rules † - https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules - Custom deny rules (Hobby total of 3).
18. Vercel Instant Rollback ✔ - https://vercel.com/docs/instant-rollback - Hobby rolls back to the previous deployment only.
19. Vercel Deployment Protection † - https://vercel.com/docs/deployment-protection - Protect preview deployments.
20. Vercel KB: securing redirects and rewrites † - https://vercel.com/kb/guide/enhancing-security-for-redirects-and-rewrites - Rewrites can become gateways.
21. Vercel bot management † - https://vercel.com/docs/bot-management - Bot controls.
22. TinaCloud on Vercel ✔ - https://tina.io/docs/tinacloud/deployment-options/vercel - Env vars and build-time token.
23. TinaCloud projects / Tokens tab ✔ - https://tina.io/docs/tinacloud/dashboard/projects/ - Content (read-only) vs Search tokens; keep secret.
24. TinaCloud users / roles ✔ - https://tina.io/docs/tinacloud/dashboard/users - Editor vs Admin permissions.
25. TinaCloud dashboard ✔ - https://tina.io/docs/tinacloud/dashboard - Projects and collaborators.
26. GHSA-x27w-589x-frm2 ✔ - https://github.com/withastro/astro/security/advisories/GHSA-x27w-589x-frm2 - `@astrojs/vercel` ISR path override (only with `isr: true`).
27. GHSA-vj59-8hwv-xxmv ✔ - https://github.com/withastro/astro/security/advisories/GHSA-vj59-8hwv-xxmv - Astro 6.4.7 auth bypass; fixed 6.4.8.
28. GHSA-mr6q-rp88-fx84 ✔ - https://github.com/withastro/astro/security/advisories/GHSA-mr6q-rp88-fx84 - `x-astro-path` override in `@astrojs/vercel` ≤10.0.0; fixed 10.0.2.
29. GHSA-j687-52p2-xcff ✔ - https://github.com/withastro/astro/security/advisories/GHSA-j687-52p2-xcff - `define:vars` `</script>` sanitisation bypass; fixed 6.1.6.
30. Astro security advisories index ✔ - https://github.com/withastro/astro/security/advisories - Full Astro advisory list.
31. GHSA-x34j-47hf-4xg7 ✔ - https://github.com/tinacms/tinacms/security/advisories/GHSA-x34j-47hf-4xg7 - Admin preview iframe origin from URL fragment; fixed tinacms ≥3.14.0.
32. GHSA-g5qx-h5f3-mp2f ✔ - https://github.com/tinacms/tinacms/security/advisories/GHSA-g5qx-h5f3-mp2f - postMessage origin not validated; fixed 3.9.3.
33. GHSA-2vcc-5v34-9jc8 ✔ - https://github.com/tinacms/tinacms/security/advisories/GHSA-2vcc-5v34-9jc8 - Rich-text link/image URLs not sanitised (stored XSS).
34. GHSA-pwhx-cvv3-qj5c ✔ - https://github.com/tinacms/tinacms/security/advisories/GHSA-pwhx-cvv3-qj5c - Git branch name injection in generated client; `@tinacms/cli` ≥3.0.0.
35. GHSA-g74q-6g2f-874x ✔ - https://github.com/tinacms/tinacms/security/advisories/GHSA-g74q-6g2f-874x - TinaCloud user could authorise against a self-hosted site (not directly this setup).
36. GHSA-6vw5-w22x-ghxv ✔ - https://github.com/tinacms/tinacms/security/advisories/GHSA-6vw5-w22x-ghxv - `@tinacms/mdx` code injection by editors; fixed 2.4.2.
37. GHSA-c42q-qvc3-j6vg ✔ - https://github.com/tinacms/tinacms/security/advisories/GHSA-c42q-qvc3-j6vg - Rich-text hrefs unvalidated in `@tinacms/web-components`.
38. Tina security advisories index ✔ - https://github.com/tinacms/tinacms/security/advisories - Full Tina advisory list.
39. OWASP Top 10:2025 A02 Security Misconfiguration † - https://owasp.org/Top10/2025/A02_2025-Security_Misconfiguration/ - Missing headers and defaults.
40. OWASP Top 10:2025 A03 Software Supply Chain Failures † - https://owasp.org/Top10/2025/A03_2025-Software_Supply_Chain_Failures/ - Dependency risk.
41. OWASP Content Security Policy Cheat Sheet ✔ - https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html - `frame-ancestors` ignored in meta; X-Frame-Options obsoleted.
42. OWASP HTTP Headers Cheat Sheet † - https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html - Header baseline.
43. OWASP XSS Prevention Cheat Sheet † - https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html - Output encoding.
44. OWASP DOM-based XSS Prevention † - https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html - `innerHTML` / `dangerouslySetInnerHTML` risks.
45. OWASP Third-Party JavaScript Management † - https://cheatsheetseries.owasp.org/cheatsheets/Third_Party_Javascript_Management_Cheat_Sheet.html - SRI and third-party scripts.
46. OWASP NPM Security Cheat Sheet † - https://cheatsheetseries.owasp.org/cheatsheets/NPM_Security_Cheat_Sheet.html - Lockfile, audit, install scripts.
47. OWASP Secrets Management Cheat Sheet † - https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html - Storage and rotation.
48. OWASP CI/CD Security Cheat Sheet † - https://cheatsheetseries.owasp.org/cheatsheets/CI_CD_Security_Cheat_Sheet.html - Pipeline hardening.
49. OWASP Denial of Service Cheat Sheet † - https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html - Rate limiting.
50. OWASP HSTS Cheat Sheet † - https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html - HSTS values.
51. OWASP Clickjacking Defense † - https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html - `frame-ancestors` vs X-Frame-Options.
52. OWASP Software Supply Chain Security † - https://cheatsheetseries.owasp.org/cheatsheets/Software_Supply_Chain_Security_Cheat_Sheet.html - Pinning and provenance.
53. OWASP TLS Cheat Sheet † - https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html - TLS baseline.
54. OWASP Unvalidated Redirects and Forwards † - https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html - URL validation.
55. MDN: Content Security Policy guide † - https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP - Directive overview.
56. MDN: CSP frame-ancestors † - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors - Embedding control.
57. MDN: CSP script-src † - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src - Hashes and nonces.
58. MDN: CSP style-src-attr † - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src-attr - Inline `style=""` attributes.
59. MDN: CSP img-src † - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/img-src - Allowed image sources.
60. MDN: CSP connect-src † - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/connect-src - fetch/XHR targets.
61. MDN: CSP worker-src † - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/worker-src - Partytown workers.
62. MDN: Strict-Transport-Security † - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security - HSTS syntax.
63. MDN: X-Content-Type-Options † - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Content-Type-Options - `nosniff`.
64. MDN: Referrer-Policy ✔ - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy - Browser default is `strict-origin-when-cross-origin`.
65. MDN: Permissions-Policy † - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy - Feature deny syntax.
66. MDN: Cross-Origin-Opener-Policy ✔ - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Opener-Policy - `same-origin-allow-popups` and other values.
67. MDN: Cross-Origin-Resource-Policy † - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Resource-Policy - CORP values.
68. MDN: Cross-Origin-Embedder-Policy † - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy - COEP behaviour.
69. MDN: X-Frame-Options † - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options - DENY/SAMEORIGIN; legacy.
70. MDN: Subresource Integrity † - https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity - SRI applies to script/link, not images.
71. MDN: rel=noopener † - https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/noopener - Tabnabbing.
72. MDN: Window.open † - https://developer.mozilla.org/en-US/docs/Web/API/Window/open - `noopener` window feature.
73. MDN: Window.postMessage † - https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage - Origin checks for the Tina bridge.
74. MDN: CSP Report-Only † - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy-Report-Only - Trial mode.
75. MDN HTTP Observatory scoring ✔ - https://developer.mozilla.org/en-US/observatory/docs/tests_and_scoring - Scoring and tests.
76. W3C Content Security Policy Level 3 † - https://www.w3.org/TR/CSP3/ - CSP spec.
77. W3C Subresource Integrity † - https://www.w3.org/TR/SRI/ - SRI spec.
78. W3C Referrer Policy † - https://www.w3.org/TR/referrer-policy/ - Referrer spec.
79. W3C Permissions Policy † - https://www.w3.org/TR/permissions-policy/ - Permissions spec.
80. WHATWG HTML: noopener link type † - https://html.spec.whatwg.org/multipage/links.html#link-type-noopener - Spec for noopener.
81. WHATWG Fetch: CORP header † - https://fetch.spec.whatwg.org/#cross-origin-resource-policy-header - CORP spec.
82. RFC 6797 HSTS † - https://www.rfc-editor.org/rfc/rfc6797 - HSTS standard.
83. RFC 9116 security.txt ✔ - https://www.rfc-editor.org/rfc/rfc9116 - `Contact` and `Expires` required.
84. RFC 8659 CAA † - https://www.rfc-editor.org/rfc/rfc8659 - CAA records.
85. RFC 7034 X-Frame-Options † - https://www.rfc-editor.org/rfc/rfc7034 - XFO standard.
86. RFC 8615 Well-Known URIs † - https://www.rfc-editor.org/rfc/rfc8615 - `/.well-known/` path.
87. web.dev: CSP † - https://web.dev/articles/csp - CSP guidance and Report-Only.
88. web.dev: Strict CSP † - https://web.dev/articles/strict-csp - Nonce/hash-based strict CSP.
89. web.dev: Security headers † - https://web.dev/articles/security-headers - Header overview.
90. web.dev: Referrer best practices † - https://web.dev/articles/referrer-best-practices - Referrer leakage.
91. web.dev: COOP/COEP † - https://web.dev/articles/coop-coep - Cross-origin isolation.
92. Google CSP Evaluator † - https://csp-evaluator.withgoogle.com/ - Policy checker.
93. HSTS preload ✔ - https://hstspreload.org/ - Staged `max-age` ramp and preload requirements.
94. securitytxt.org † - https://securitytxt.org/ - security.txt generator.
95. NIST SP 800-218 SSDF † - https://csrc.nist.gov/pubs/sp/800/218/final - Secure development framework.
96. NIST SP 800-63B † - https://pages.nist.gov/800-63-4/sp800-63b.html - Authentication guidance.
97. NIST SP 800-52r2 † - https://csrc.nist.gov/pubs/sp/800/52/r2/final - TLS guidance.
98. NIST SP 800-81-2 † - https://csrc.nist.gov/pubs/sp/800/81/2/final - Secure DNS.
99. CISA: npm supply-chain alert ✔ - https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem - Pin versions, MFA, branch protection, secret scanning, Dependabot.
100. CISA #StopRansomware Guide ✔ - https://www.cisa.gov/stopransomware/ransomware-guide - Backups and recovery.
101. CISA DDoS guide ✔ - https://www.cisa.gov/resources-tools/resources/understanding-and-responding-distributed-denial-service-attacks - DDoS types and response.
102. CISA phishing-resistant MFA fact sheet † - https://www.cisa.gov/sites/default/files/publications/fact-sheet-implementing-phishing-resistant-mfa-508c.pdf - MFA guidance (PDF fetched, not read).
103. GitHub: protected branches † - https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches - Branch protection.
104. GitHub: rulesets † - https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets - Rulesets.
105. GitHub: CODEOWNERS † - https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners - Code owners.
106. GitHub: secret scanning † - https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning - Secret detection.
107. GitHub: push protection † - https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection - Blocks secret pushes.
108. GitHub: Dependabot security updates † - https://docs.github.com/en/code-security/dependabot/dependabot-security-updates/about-dependabot-security-updates - Automatic fix PRs.
109. GitHub: Dependabot options reference ✔ - https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference - `cooldown` is version updates only.
110. GitHub: Actions secure use ✔ - https://docs.github.com/en/actions/reference/security/secure-use - Pin to full-length commit SHA.
111. GitHub: about 2FA † - https://docs.github.com/en/authentication/securing-your-account-with-two-factor-authentication-2fa/about-two-factor-authentication - 2FA.
112. GitHub: require 2FA in org † - https://docs.github.com/en/organizations/keeping-your-organization-secure/managing-two-factor-authentication-for-your-organization/requiring-two-factor-authentication-in-your-organization - Org-wide 2FA.
113. GitHub: GITHUB_TOKEN permissions † - https://docs.github.com/en/actions/security-for-github-actions/security-guides/automatic-token-authentication - Least-privilege workflow token.
114. GitHub: repository roles † - https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization - Role definitions.
115. GitHub: backing up a repository † - https://docs.github.com/en/repositories/archiving-a-github-repository/backing-up-a-repository - Backup methods.
116. GitHub: private vulnerability reporting † - https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/configuring-private-vulnerability-reporting-for-a-repository - Reporting channel.
117. npm: `npm ci` † - https://docs.npmjs.com/cli/v11/commands/npm-ci - Clean, lockfile-exact install.
118. npm: `npm audit` † - https://docs.npmjs.com/cli/v11/commands/npm-audit - Vulnerability scanning.
119. npm config ✔ - https://docs.npmjs.com/cli/v11/using-npm/config - `min-release-age`, `ignore-scripts`, `audit-level`, `allow-scripts`.
120. npm: package-lock.json † - https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json - Lockfile semantics.
121. npm: provenance statements † - https://docs.npmjs.com/generating-provenance-statements - Package provenance.
122. npm: verifying registry signatures † - https://docs.npmjs.com/verifying-registry-signatures - `npm audit signatures`.
123. npm: threats and mitigations † - https://docs.npmjs.com/threats-and-mitigations - Registry threat model.
124. StepSecurity harden-runner † - https://github.com/step-security/harden-runner - CI egress hardening.
125. WCAG 2.2 † - https://www.w3.org/TR/WCAG22/ - The standard.
126. WCAG 2.2.1 Timing Adjustable ✔ - https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html - Level A time-limit adjustment.
127. WCAG 2.2.6 Timeouts ✔ - https://www.w3.org/WAI/WCAG22/Understanding/timeouts.html - Level AAA inactivity warning.
128. WCAG 3.3.8 Accessible Authentication (Minimum) † - https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html - No cognitive-test authentication.
129. WCAG 3.2.5 Change on Request † - https://www.w3.org/WAI/WCAG22/Understanding/change-on-request.html - Warn before opening new windows.
130. WCAG technique H83 † - https://www.w3.org/WAI/WCAG22/Techniques/html/H83 - Identify links that open new windows.
131. WCAG technique G201 † - https://www.w3.org/WAI/WCAG22/Techniques/general/G201 - Give users advanced warning.
132. ALA privacy resources † - https://www.ala.org/advocacy/privacy - Library privacy framework.
133. ALA Privacy Toolkit † - https://www.ala.org/advocacy/privacy/toolkit - Practical privacy guidance.
134. ALA Library Bill of Rights, privacy interpretation † - https://www.ala.org/advocacy/intfreedom/librarybill/interpretations/privacy - Patron privacy principle.
135. Open Library Covers API ✔ - https://openlibrary.org/dev/docs/api/covers - ISBN access limited to 100 requests/IP/5 min; `default=false`.
136. Let's Encrypt CAA † - https://letsencrypt.org/docs/caa/ - CAA record syntax.
137. ICANN DNSSEC † - https://www.icann.org/resources/pages/dnssec-what-is-it-why-important-2019-03-05-en - DNSSEC overview.
138. MDN: `<img>` element (incl. referrerpolicy) † - https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img - Per-image referrer policy.
139. Tina editorial workflow † - https://tina.io/docs/drafts/editorial-workflow - PR-based editing for protected branches.
140. OWASP SSRF Prevention † - https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html - Proxy and rewrite risks.
141. GitHub: about passkeys † - https://docs.github.com/en/authentication/authenticating-with-a-passkey/about-passkeys - Passkey sign-in for staff.
142. WCAG 1.1.1 Non-text Content † - https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html - Alt text for cover images.

## 6. Not verified / gaps

1. **Admin CSP allowlist (§3.3)** comes from a static scan of the built bundle, not a browser session. Whether Monaco, PostHog or font loading actually fail when blocked is untested.
2. **Duplicate CSP headers.** I did not verify how Vercel merges two CSP headers (from `staticHeaders` and `vercel.json`) or two rules that set the same header key. Astro's header logic was read in code only; nothing was deployed.
3. **On-demand pages and `staticHeaders`.** The docs say it covers prerendered pages. Whether `/tina-island/*` also gets the Astro CSP header via the adapter needs a `curl -I` on a preview deploy.
4. **Tina and GitHub branch protection.** I found no Tina docs on how TinaCloud's GitHub app interacts with required-PR rulesets. The editorial-workflow doc [139] is the likely path but I only status-checked it.
5. **TinaCloud session timeout and 2FA.** None of the Tina pages I read ([23], [24], [25]) state a session length or 2FA policy, so the WCAG 2.2.1/2.2.6 mapping can't be completed.
6. **COOP and the Tina login popup.** I inferred `same-origin-allow-popups` is safe. GHSA-g5qx implies cross-window postMessage in Tina's auth flow, but I did not test login with a stricter COOP.
7. **npm `allowScripts`.** I saw it only as a pointer in the config doc, not its exact semantics, so test any `.npmrc` / `allowScripts` change with a clean `npm ci && npm run build`.
8. **`style-src-attr`.** I concluded Astro can't emit it from reading `ALLOWED_DIRECTIVES`; I did not run a CSP build to confirm what happens to the 11 inline style attributes.
9. **Domain checks.** `dig` was not installed, so the live domain's CAA, DNSSEC and nameservers are unchecked. The only live probe was one `curl -I` (F21), which may reflect a transitional DNS state.
10. **Scanner grades.** I did not run Mozilla Observatory or securityheaders.com.
11. **Sources marked †.** The statements I attribute to them are not text I read.
12. **Advisories.** They are from the GitHub Security Advisory API as of 2026-11-20. Re-run `npm audit` after upgrading, because new advisories keep appearing for Astro and Tina.