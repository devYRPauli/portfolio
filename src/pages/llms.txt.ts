import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { totals } from '../data/contributions';

export const GET: APIRoute = async ({ site }) => {
  const posts = (await getCollection('writing', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
  const work = (await getCollection('work')).sort((a, b) => a.data.order - b.data.order);
  const abs = (path: string) => new URL(path, site).href;

  const lines = [
    '# Yash Raj Pandey',
    '',
    '> AI systems engineer and AI Agents Architect at the University of Florida IFAS.',
    '> I work on the layer where AI systems quietly go wrong, and I prove it. I build',
    '> LLM infrastructure, agent platforms, evaluation systems, and developer tools.',
    '> Writing covers independent model evaluation, AI systems,',
    '> open-source debugging, and what I learned while building the work listed here.',
    '',
    '## Writing',
    '',
    ...posts.map((p) => `- [${p.data.title}](${abs(`/writing/${p.id}/`)}): ${p.data.description}`),
    '',
    '## Selected Work',
    '',
    ...work.map((w) => `- [${w.data.title}](${abs(`/work/${w.id}/`)}): ${w.data.summary}`),
    '',
    '## Open Source',
    '',
    `- [Merged pull requests](${abs('/contributions/')}): ${totals.merged} pull requests merged across ${totals.projects} projects I do not own, including llama.cpp, Apple MLX, Google Research's TabFM, RAGFlow, mem0, and litellm.`,
    '',
    '## Links',
    '',
    `- About: ${abs('/about/')}`,
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
