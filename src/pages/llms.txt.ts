import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site }) => {
  const posts = (await getCollection('writing', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
  const work = (await getCollection('work')).sort((a, b) => a.data.order - b.data.order);
  const abs = (path: string) => new URL(path, site).href;

  const lines = [
    '# Yash Raj Pandey',
    '',
    "> AI Agents Architect at the University of Florida's Institute of Food and Agricultural",
    '> Sciences. I build AI infrastructure and production software systems: self-hosted,',
    '> local-first AI that runs entirely on-premise. Writing covers local-first AI, RAG,',
    '> LLM evals, and systems engineering.',
    '',
    '## Writing',
    '',
    ...posts.map((p) => `- [${p.data.title}](${abs(`/writing/${p.id}/`)}): ${p.data.description}`),
    '',
    '## Selected Work',
    '',
    ...work.map((w) => `- [${w.data.title}](${abs(`/work/${w.id}/`)}): ${w.data.summary}`),
    '',
    '## Links',
    '',
    '- GitHub: https://github.com/devYRPauli',
    '- LinkedIn: https://www.linkedin.com/in/yashrajpandeyy',
    '- Email: yashpn62@gmail.com',
    `- Resume: ${abs('/Resume_YashRaj.pdf')}`,
    `- RSS: ${abs('/rss.xml')}`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
