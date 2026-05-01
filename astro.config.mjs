import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import compress from '@playform/compress';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

export default defineConfig({
  site: 'https://yourdomain.com',
  output: 'hybrid',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [sitemap(), mdx(), partytown(), compress(), react(), keystatic()],
});