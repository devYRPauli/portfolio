import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const writing = defineCollection({
  loader: glob({ base: './src/content/writing', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const work = defineCollection({
  loader: glob({ base: './src/content/work', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    role: z.string(),
    kind: z.string(),
    year: z.string(),
    stack: z.array(z.string()),
    links: z.array(z.object({ label: z.string(), href: z.string() })).optional(),
    order: z.number(),
    featuredOrder: z.number().int().positive().optional(),
  }),
});

export const collections = { writing, work };
