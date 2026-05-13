import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import compress from '@playform/compress';
import react from '@astrojs/react';
import flowbiteReact from "flowbite-react/plugin/astro";

export default defineConfig({
  site: 'https://goffnelsonlibrary.org',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap(),
    mdx(),
    partytown(),
    compress(),
    react(),
    flowbiteReact()
  ],
});