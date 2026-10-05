import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { totals } from '../data/contributions';
import { byOrder, getWriteups, workHref } from '../lib/entries';

export const GET: APIRoute = async ({ site }) => {
  const posts = (await getCollection('writing', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
  const work = (await getCollection('work')).sort(byOrder);
  const writeups = await getWriteups();
  const abs = (path: string) => new URL(path, site).href;

  const lines = [
    '# Yash Raj Pandey',
    '',
    "> I'm an AI systems engineer at UF IFAS, where I build agent and retrieval systems that run on",
    '> university hardware. On my own machines I reproduce new model research, and I send fixes',
    '> upstream when I find a bug. My title at UF IFAS is AI Agents Architect.',
    '',
    '## Writing',
    '',
    ...posts.map((p) => `- [${p.data.title}](${abs(`/writing/${p.id}/`)}): ${p.data.description}`),
    '',
    '## Work',
    '',
    ...work.map((w) => `- [${w.data.title}](${abs(workHref(w.id, writeups))}): ${w.data.summary}`),
    '',
    '## Open source',
    '',
    `- [Merged pull requests](${abs('/contributions/')}): ${totals.merged} pull requests merged across ${totals.projects} projects I do not own, including llama.cpp, Apple MLX, Google Research's TabFM, RAGFlow, mem0 and LiteLLM.`,
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
