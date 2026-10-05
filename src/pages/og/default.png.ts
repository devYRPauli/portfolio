import type { APIRoute } from 'astro';
import { renderOgCard } from '../../lib/og-image';

export const GET: APIRoute = async () => {
  const png = await renderOgCard({
    kicker: 'Home',
    title: 'I build agent and retrieval systems, and I send fixes upstream',
    meta: 'AI systems engineer at UF IFAS',
  });
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
