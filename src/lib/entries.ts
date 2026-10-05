import { getCollection, type CollectionEntry } from 'astro:content';
import { postLength } from './reading';

export interface Entry {
  href: string;
  title: string;
  /** One plain line under the title, e.g. "Developer tool, 2026". */
  kind?: string;
  summary: string;
  verdict?: { tried: string; result: string };
  /** Dated rows only. */
  date?: Date;
  links?: { label: string; href: string }[];
  supersededBy?: { href: string; title: string };
  transitionName?: string;
}

type Work = CollectionEntry<'work'>;
type Post = CollectionEntry<'writing'>;

/** Superseded work goes last in its group; the rest follow `order`. */
export const byOrder = (a: Work, b: Work) =>
  Number(!!a.data.supersededBy) - Number(!!b.data.supersededBy) || a.data.order - b.data.order;

/**
 * Work id -> the post that writes it up, from the post's `project` field. A
 * project with a writeup has no page of its own: the post is its one page.
 */
export type Writeups = Map<string, Post>;

export async function getWriteups(): Promise<Writeups> {
  const writeups: Writeups = new Map();
  for (const post of await getCollection('writing', ({ data }) => !data.draft)) {
    const id = post.data.project?.id;
    if (!id) continue;
    const other = writeups.get(id);
    if (other) throw new Error(`Posts ${other.id} and ${post.id} both set project: ${id}`);
    writeups.set(id, post);
  }
  return writeups;
}

export const workHref = (id: string, writeups: Writeups) => {
  const post = writeups.get(id);
  return post ? `/writing/${post.id}/` : `/work/${id}/`;
};

export function workEntry(p: Work, all: Work[], writeups: Writeups, withLinks = false): Entry {
  const successor = p.data.supersededBy && all.find((w) => w.id === p.data.supersededBy?.id);
  const post = writeups.get(p.id);
  return {
    href: workHref(p.id, writeups),
    title: p.data.title,
    kind: `${p.data.kind}, ${p.data.year}`,
    summary: p.data.summary,
    verdict: p.data.verdict,
    links: withLinks ? p.data.links : undefined,
    supersededBy: successor ? { href: workHref(successor.id, writeups), title: successor.data.title } : undefined,
    transitionName: post ? `post-${post.id}` : `work-${p.id}`,
  };
}

export const postEntry = (p: Post, withLength = false): Entry => ({
  href: `/writing/${p.id}/`,
  title: p.data.title,
  kind: withLength ? postLength(p.body) : undefined,
  summary: p.data.description,
  verdict: p.data.verdict,
  date: p.data.pubDate,
  transitionName: `post-${p.id}`,
});
