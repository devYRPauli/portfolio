import type { APIRoute } from 'astro';
import { renderOgCard } from '../../../lib/og-image';
import { totals } from '../../../data/contributions';

/**
 * OG cards for the standalone pages. Posts and case studies generate their own
 * from collection data; these have no collection behind them, so the copy lives
 * here rather than falling back to the site-wide default card.
 */
const pages = {
  about: {
    kicker: 'About',
    title: 'Yash Raj Pandey',
    meta: 'AI Agents Architect at UF IFAS',
  },
  work: {
    kicker: 'Work',
    title: 'Systems, tools, and independent evaluations',
    meta: 'Production platforms | developer tools | model evaluation',
  },
  writing: {
    kicker: 'Writing',
    title: 'Reproductions, post-mortems, and debugging stories',
    meta: 'Every claim carries the measurement behind it',
  },
  contributions: {
    kicker: 'Open Source',
    // Derived, so the card cannot drift when the weekly sync moves the count.
    title: `Merged pull requests across ${totals.projects} projects`,
    meta: 'llama.cpp | Apple MLX | TabFM | RAGFlow | mem0 | litellm',
  },
};

export function getStaticPaths() {
  return Object.entries(pages).map(([slug, card]) => ({ params: { slug }, props: { card } }));
}

interface Props {
  card: (typeof pages)[keyof typeof pages];
}

export const GET: APIRoute<Props> = async ({ props }) => {
  const png = await renderOgCard(props.card);
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
