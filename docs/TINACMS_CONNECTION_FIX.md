# Fix “Invalid Client ID” — Goff-Nelson TinaCMS

These are instructions for **the existing Astro website**, not a new Tina starter and not WordPress.

## What I fixed in GitHub
- Generated and committed **`tina/tina-lock.json`** using `tinacms dev`. TinaCloud needs this file to recognize the site's editing schema and index branches.
- Added a fallback for the generic `NEXT_PUBLIC_TINA_CLIENT_ID` environment-variable name. For **Astro**, please use `PUBLIC_TINA_CLIENT_ID`.
- Improved the site build script: if only one of the two Tina credentials is set, the build now gives an explicit error. With neither set, the *public site* still builds, but a connected TinaCloud login is **not** ready.

## Exactly what to click

### A. TinaCloud (the dashboard in your photo)

1. Open **[app.tina.io](https://app.tina.io)** and select the **goffnelson** project.
2. Stay on **Overview**. Under **Application IDs → Client ID**, click the **copy icon**. This is the **public** TinaCloud Client ID for this project (not your GitHub username or Tina account ID).
3. Click **Tokens** across the top. Create or copy a **read-only/content token** for this project. Store it somewhere private; **do not send it in chat, write it into GitHub, or put it in a screenshot**.
4. Click **Configuration** across the top. Confirm that TinaCloud is connected to **OofMacie/goffnelson** and that **main** is indexed/selected for the public website.
5. In the **Site URLs** area, retain **https://goffnelson.vercel.app** (exactly; no `/admin` suffix). For local Astro development use **http://localhost:4321** rather than **http://localhost:3000**, unless you specifically changed Astro to run on port 3000.

### B. Vercel (hosting dashboard)

1. Open **[Vercel Dashboard](https://vercel.com/dashboard)**.
2. Select the project that publishes **goffnelson.vercel.app**.
3. Select **Settings → Environment Variables**.
4. Add these **two different** variables, one at a time:

| Name (copy exactly) | Value | Environment |
| --- | --- | --- |
| `PUBLIC_TINA_CLIENT_ID` | Paste the Client ID copied from TinaCloud Overview | **Production** |
| `TINA_TOKEN` | Paste the private **read-only token** from TinaCloud Tokens | **Production** |

5. Optionally add the same variables to **Preview** for feature-branch testing.
6. **Save** each variable. No quotation marks, no `Bearer ` prefix, and no extra whitespace.
7. Go to **Deployments**, open the latest **main** deployment, and click **Redeploy**. Vercel only applies newly entered environment variables to **new builds**.

### C. Try Tina again

1. After Vercel reports the deployment **Ready**, open **https://goffnelson.vercel.app/admin/index.html**.
2. Sign in using your **TinaCloud** account (not WordPress).
3. You should see **Home page**, **Events and programs**, **Staff book picks**, and **Library information**.
4. Change one harmless word in the homepage intro, **Save**, and watch for the new content commit in GitHub **main**.
5. Confirm the update appears after Vercel finishes its deployment, then change the word back.

## What the errors mean

**“Invalid Client ID”** — the client ID embedded in the built Tina admin is missing, incorrect, or from a different project. Compare your Vercel **Production** `PUBLIC_TINA_CLIENT_ID` with TinaCloud **Overview → Client ID**. After fixing it, **redeploy**. Do not confuse the Client ID with the **read-only token**.

**“Invalid Site URL”** — TinaCloud requires the exact website origin that appears in the browser. Add it in **TinaCloud → Configuration → Site URLs**, including `https://` and the correct Vercel domain.

**“Branch not indexed”** — this project originally lacked **`tina/tina-lock.json`**. The repair commits that file. If TinaCloud hasn't indexed **main** yet, confirm the repair was merged, check **Configuration**, then allow TinaCloud to process the new commit. Tina's troubleshooting docs explain reindexing.

**Vercel build fails** — check that BOTH credentials are set in the same deployment environment (Production or Preview), and inspect the Vercel deployment Build Logs.

**Public site works but Tina login doesn't** — the original public site can still build using local content files even without credentials. That does **not** mean TinaCloud has been connected; finish Part B and redeploy.

## Security and maintainability

- Never hardcode `TINA_TOKEN`; use server-side environment variables.
- Library staff manage **content**, while developers keep complete access to **Astro, React, CSS and the GitHub repository**.
- The content is versioned in GitHub; normal code quality and accessibility checks still apply.
- A working editor does not automatically establish WCAG 2.2 Level AAA conformance.

## Official documentation
- [TinaCloud troubleshooting and branch indexing](https://tina.io/docs/tinacloud/troubleshooting)
- [Tina config and build-time environment variables](https://tina.io/docs/reference/config)
- [Official Astro starter (uses PUBLIC_TINA_CLIENT_ID)](https://github.com/tinacms/tina-astro-starter)
- [Vercel environment variables and redeploying](https://vercel.com/docs/environment-variables/managing-environment-variables)
- [TinaCloud project configuration](https://tina.io/docs/tinacloud/dashboard/projects)
