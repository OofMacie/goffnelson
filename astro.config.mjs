import { defineConfig } from 'astro/config';
import { storyblok } from '@storyblok/astro';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import compress from '@playform/compress';
import react from '@astrojs/react';
import mkcert from 'vite-plugin-mkcert';
import 'dotenv/config';

export default defineConfig({
  site: 'https://goffnelsonlibrary.org',
  vite: {
    plugins: [tailwindcss(), mkcert()],
    server: {
      https: true,
    },
  },
  integrations: [
    storyblok({
      accessToken: process.env.STORYBLOK_TOKEN,
      bridge: true,
      components: {
        event: 'storyblok/Event',
        article: 'storyblok/Article',
        page: 'storyblok/Page',
        site_settings: 'storyblok/SiteSettings',
        teaser: 'storyblok/Teaser',
        grid: 'storyblok/Grid',
        feature: 'storyblok/Feature',
      },
      apiOptions: {
        region: 'eu',
      },
    }),
    sitemap(),
    mdx(),
    partytown(),
    compress(),
    react(),
  ],
});
