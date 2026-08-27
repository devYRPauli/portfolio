import type { APIRoute } from 'astro';
import { renderOgCard } from '../../lib/og-image';

export const GET: APIRoute = async () => {
  const png = await renderOgCard({
    kicker: 'Portfolio',
    title: 'I build AI systems and developer tools',
    meta: 'LLM infra | agents | evaluation',
  });
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
