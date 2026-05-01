import { defineConfig } from 'astro/config';
import storyblok from '@storyblok/astro';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import compress from '@playform/compress';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://yourdomain.com',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    storyblok({
      accessToken: import.meta.env.STORYBLOK_TOKEN,
      components: {
        event: 'storyblok/Event',
        article: 'storyblok/Article',
        page: 'storyblok/Page',
        site_settings: 'storyblok/SiteSettings',
      },
      apiOptions: {
        region: 'us',
      },
    }),
    sitemap(),
    mdx(),
    partytown(),
    compress(),
    react(),
  ],
});
