import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import GithubSlugger from 'github-slugger';

// Runs before Astro's heading-ids plugin, which keeps any id already set.
const headingAnchors = () => {
  const slugger = new GithubSlugger();
  return {
    name: 'heading-anchors',
    element: {
      filter: ['h2', 'h3', 'h4'],
      visit(node, ctx) {
        const existing = node.properties?.id;
        const id = typeof existing === 'string' ? existing : slugger.slug(ctx.textContent(node));
        ctx.setProperty(node, 'id', id);
        ctx.appendChild(node, {
          type: 'element',
          tagName: 'a',
          properties: { href: `#${id}`, className: ['heading-anchor'], ariaLabel: 'Link to this section' },
          children: [],
        });
      },
    },
  };
};

export default defineConfig({
  site: 'https://yashrajpandey.com',
  integrations: [sitemap()],
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  experimental: {
    clientPrerender: true,
  },
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
    processor: satteri({ hastPlugins: [headingAnchors] }),
  },
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Space Grotesk',
      cssVariable: '--font-sans',
      weights: ['300 700'],
      // Astro only generates a metric-matched fallback when a generic family is
      // named. Without these the serif and mono both fell back to sans-serif
      // metrics and the page shifted on swap.
      fallbacks: ['sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Instrument Serif',
      cssVariable: '--font-serif',
      weights: ['400'],
      styles: ['normal', 'italic'],
      fallbacks: ['serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'JetBrains Mono',
      cssVariable: '--font-mono',
      weights: ['400 700'],
      fallbacks: ['monospace'],
    },
  ],
});
