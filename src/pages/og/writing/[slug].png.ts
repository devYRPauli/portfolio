import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { renderOgCard } from '../../../lib/og-image';
import { isoDate } from '../../../lib/reading';

export async function getStaticPaths() {
  const posts = await getCollection('writing', ({ data }) => !data.draft);
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

interface Props {
  post: CollectionEntry<'writing'>;
}

export const GET: APIRoute<Props> = async ({ props }) => {
  const { post } = props;
  const date = isoDate(post.data.pubDate);
  const png = await renderOgCard({ kicker: 'Writing', title: post.data.title, meta: date });
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
