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
    title: 'AI systems engineer at UF IFAS in Gainesville, Florida',
    meta: 'I lead the AI agents work there and took over Blue Omics in 2025',
  },
  work: {
    kicker: 'Work',
    title: 'Things I build and things I evaluate',
    meta: 'From a genomics platform at UF to a tool-calling matrix for local models',
  },
  writing: {
    kicker: 'Writing',
    title: 'Reproductions of new model research, and two competitions I lost',
    meta: 'When a claim turns out wrong, I correct the post and mark the change',
  },
  contributions: {
    kicker: 'Open source',
    // Derived, so the card cannot drift when the weekly sync moves the count.
    title: `${totals.merged} merged pull requests across ${totals.projects} projects`,
    meta: 'llama.cpp, Apple MLX, Google TabFM, RAGFlow, LiteLLM and others',
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
