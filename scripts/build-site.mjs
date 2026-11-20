/**
 * Keep the public site deployable before TinaCloud credentials are configured.
 * When both are present use the connected TinaCloud build; otherwise generate
 * the local content client and build Astro without any cloud authentication.
 */
import { spawnSync } from "node:child_process";

const clientId = (
  process.env.PUBLIC_TINA_CLIENT_ID ||
  process.env.NEXT_PUBLIC_TINA_CLIENT_ID ||
  ""
).trim();
const token = (process.env.TINA_TOKEN || "").trim();

if (Boolean(clientId) !== Boolean(token)) {
  console.error(
    "TinaCloud configuration is incomplete. Set BOTH PUBLIC_TINA_CLIENT_ID " +
    "and TINA_TOKEN in Vercel Project Settings > Environment Variables, " +
    "then redeploy. Never commit the token to GitHub."
  );
  process.exit(1);
}

const connected = Boolean(clientId && token);
const target = connected ? "build:cloud" : "build:local";

if (!connected) {
  console.warn(
    "TinaCloud credentials absent: the public site will build, but the hosted /admin editor CANNOT log in until the Vercel Production credentials are configured and the site is redeployed. " +
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
