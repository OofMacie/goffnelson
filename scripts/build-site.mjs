/**
 * Keep the public site deployable before TinaCloud credentials are configured.
 * When both are present use the connected TinaCloud build; otherwise generate
 * the local content client and build Astro without any cloud authentication.
 */
import { spawnSync } from "node:child_process";

const connected = Boolean(process.env.PUBLIC_TINA_CLIENT_ID?.trim() && process.env.TINA_TOKEN?.trim());
const target = connected ? "build:cloud" : "build:local";

if (!connected) {
  console.warn(
    "TinaCloud not yet configured: building the public site with local Git-backed content. " +
    "Add PUBLIC_TINA_CLIENT_ID and TINA_TOKEN to the hosting environment to enable the connected editor.",
  );
}

const result = spawnSync(
  process.platform === "win32" ? "npm.cmd" : "npm",
  ["run", target],
  { stdio: "inherit", env: process.env },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
