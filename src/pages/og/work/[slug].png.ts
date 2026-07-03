import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { renderOgCard } from '../../../lib/og-image';

export async function getStaticPaths() {
  const projects = await getCollection('work');
  return projects.map((project) => ({ params: { slug: project.id }, props: { project } }));
}

interface Props {
  project: CollectionEntry<'work'>;
}

export const GET: APIRoute<Props> = async ({ props }) => {
  const { project } = props;
  const { role, year } = project.data;
  const png = await renderOgCard({
    kicker: 'Work',
    title: project.data.title,
    meta: `${role} | ${year}`,
  });
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
