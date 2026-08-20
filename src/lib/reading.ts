/**
 * One definition of "how long is this", so list rows and article bylines agree.
 *
 * Counting raw `entry.body` overstates length, because Markdown syntax, table
 * pipes, code blocks, and link URLs all split on whitespace and count as words.
 * Measured across the current posts that inflates the total by 7.9%, and by
 * 18.1% on the most table-heavy one. This strips to prose before counting.
 */

const WORDS_PER_MINUTE = 220;

/** Reduce Markdown to the words a person actually reads. */
export function toProse(body: string | undefined): string {
  return (body ?? '')
    // Defensive: `entry.body` excludes frontmatter, but raw file reads do not.
    .replace(/^---\r?\n[\s\S]*?\r?\n---/, ' ')
    .replace(/```[\s\S]*?```/g, ' ') // fenced code
    .replace(/~~~[\s\S]*?~~~/g, ' ') // fenced code, tilde form
    .replace(/`[^`\n]*`/g, ' ') // inline code
    .replace(/^ {0,3}\|.*$/gm, ' ') // table rows
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images (before links)
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links: keep the text, drop the URL
    .replace(/^ {0,3}\[[^\]]+\]:.*$/gm, ' ') // link reference definitions
    .replace(/<[^>]+>/g, ' ') // inline HTML
    .replace(/^ {0,3}#{1,6}\s+/gm, ' ') // heading markers
    .replace(/^ {0,3}([-*_])\s*(\1\s*){2,}$/gm, ' ') // horizontal rules
    .replace(/^ {0,3}[-*+]\s+/gm, ' ') // bullet markers
    .replace(/^ {0,3}\d+\.\s+/gm, ' ') // ordered list markers
    .replace(/^ {0,3}>\s?/gm, ' ') // block quote markers
    .replace(/[*_~]/g, ' ') // emphasis marks
    .replace(/\s+/g, ' ')
    .trim();
}

export const wordCount = (body: string | undefined) =>
  toProse(body).split(' ').filter(Boolean).length;

export const readMinutes = (words: number) => Math.max(1, Math.round(words / WORDS_PER_MINUTE));

/** UTC by definition, so a pubDate never shifts a day across time zones. */
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/** The measured facts shown under a post title, in list and article alike. */
export function postMeta(date: Date, body: string | undefined): string[] {
  const words = wordCount(body);
  return [isoDate(date), `${words.toLocaleString('en-US')} words`, `${readMinutes(words)} min`];
}
