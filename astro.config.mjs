import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import partytown from "@astrojs/partytown";
import compress from "@playform/compress";
import react from "@astrojs/react";
import flowbiteReact from "flowbite-react/plugin/astro";
import vercel from "@astrojs/vercel";
import tina from "@tinacms/astro/integration";
import { tinaAdminDevRedirect } from "@tinacms/astro/vite";

// Static pages remain fast. Tina uses one server-rendered endpoint for live previews.
export default defineConfig({
  site: "https://goffnelsonlibrary.org",
  output: "static",
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss(), tinaAdminDevRedirect()],
    ssr: { noExternal: ["@tinacms/astro", "@tinacms/bridge"] },
  },
  integrations: [
    sitemap(),
    mdx(),
    partytown(),
    compress(),
    react(),
    flowbiteReact(),
    tina(),
  ],
});
