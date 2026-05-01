import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    endDate: z.string().optional(),
    time: z.string().optional(),
    location: z.string().optional(),
    category: z.enum(['book-club', 'childrens', 'teen', 'adult', 'community', 'other']),
    description: z.string(),
  }),
});

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    publishDate: z.string(),
    author: z.string().default('Goff Nelson Library Staff'),
    description: z.string(),
  }),
});

export const collections = { events, articles };
