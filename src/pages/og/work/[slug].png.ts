import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { renderOgCard } from '../../../lib/og-image';
import { getWriteups } from '../../../lib/entries';

export async function getStaticPaths() {
  // A project with a writeup has no page of its own, so it shares the post's card.
  const writeups = await getWriteups();
  const projects = (await getCollection('work')).filter((p) => !writeups.has(p.id));
  return projects.map((project) => ({ params: { slug: project.id }, props: { project } }));
}

interface Props {
  project: CollectionEntry<'work'>;
}

export const GET: APIRoute<Props> = async ({ props }) => {
  const { project } = props;
  const { kind, year } = project.data;
  const png = await renderOgCard({
    kicker: 'Work',
    title: project.data.title,
    meta: `${kind}, ${year}`,
  });
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
