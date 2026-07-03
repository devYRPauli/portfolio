import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { renderOgCard } from '../../../lib/og-image';

export async function getStaticPaths() {
  const posts = await getCollection('writing', ({ data }) => !data.draft);
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

interface Props {
  post: CollectionEntry<'writing'>;
}

export const GET: APIRoute<Props> = async ({ props }) => {
  const { post } = props;
  const date = post.data.pubDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const png = await renderOgCard({ kicker: 'Writing', title: post.data.title, meta: date });
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
