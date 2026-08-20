/** One definition of "how long is this", so lists and article bylines agree. */
const WORDS_PER_MINUTE = 220;

export const wordCount = (body: string | undefined) =>
  (body ?? '').split(/\s+/).filter(Boolean).length;

export const readMinutes = (words: number) => Math.max(1, Math.round(words / WORDS_PER_MINUTE));

/** UTC by definition, so a pubDate never shifts a day across time zones. */
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/** The measured facts shown under a post title, in list and article alike. */
export const postMeta = (date: Date, body: string | undefined) => {
  const words = wordCount(body);
  return [isoDate(date), `${words.toLocaleString('en-US')} words`, `${readMinutes(words)} min`];
};
