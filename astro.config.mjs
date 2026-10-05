import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import GithubSlugger from 'github-slugger';
import { readFileSync } from 'node:fs';

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

// A /work/ page whose project has a writeup is a redirect stub. Stubs are noindex,
// so they stay out of the sitemap. Runs after the build has written dist/.
const isRedirect = (page) =>
  readFileSync(new URL(`./dist${new URL(page).pathname}index.html`, import.meta.url), 'utf8').includes(
    'http-equiv="refresh"',
  );

export default defineConfig({
  site: 'https://yashrajpandey.com',
  integrations: [sitemap({ filter: (page) => !isRedirect(page) })],
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
    // Straight quotes in, straight quotes out: the rest of the site is ASCII.
    processor: satteri({ hastPlugins: [headingAnchors], features: { smartPunctuation: false } }),
  },
  fonts: [
    {
      // Cal Sans v2 (OFL), vendored from github.com/calcom/sans as a Latin subset
      // of the Google Fonts build, with the unused YTAS and SHRP axes pinned at
      // their defaults (9 KB less). One variable file covers display and text
      // through its opsz axis.
      provider: fontProviders.local(),
      name: 'Cal Sans',
      cssVariable: '--font-sans',
      // Astro only generates a metric-matched fallback when a generic family is named.
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          { src: ['./src/assets/fonts/cal-sans/CalSans-latin.woff2'], weight: '400 700', style: 'normal' },
          { src: ['./src/assets/fonts/cal-sans/CalSans-Italic-latin.woff2'], weight: '400 700', style: 'italic' },
        ],
      },
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
