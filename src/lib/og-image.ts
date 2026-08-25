import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import satori, { type SatoriOptions } from 'satori';
import { Resvg } from '@resvg/resvg-js';

interface OgCard {
  kicker: string;
  title: string;
  meta: string;
}

const PAPER = '#ffffff';
const INK = '#212429';
const SOFT = '#565961';
const AMBER = '#8f5211';
const require = createRequire(import.meta.url);

const el = (type: string, style: Record<string, unknown>, children?: unknown) => ({
  type,
  props: { style, children },
});

const font = (pkg: string, file: string) =>
  readFile(require.resolve(`@fontsource/${pkg}/files/${file}`));

let fonts: Promise<SatoriOptions['fonts']> | undefined;
const loadFonts = () =>
  (fonts ??= Promise.all([
    font('space-grotesk', 'space-grotesk-latin-500-normal.woff'),
    font('space-grotesk', 'space-grotesk-latin-600-normal.woff'),
    font('instrument-serif', 'instrument-serif-latin-400-italic.woff'),
    font('jetbrains-mono', 'jetbrains-mono-latin-400-normal.woff'),
  ]).then(([sans500, sans600, serifItalic, mono]) => [
    { name: 'Space Grotesk', data: sans500, weight: 500 as const, style: 'normal' as const },
    { name: 'Space Grotesk', data: sans600, weight: 600 as const, style: 'normal' as const },
    { name: 'Instrument Serif', data: serifItalic, weight: 400 as const, style: 'italic' as const },
    { name: 'JetBrains Mono', data: mono, weight: 400 as const, style: 'normal' as const },
  ]));

export async function renderOgCard({ kicker, title, meta }: OgCard) {
  const card = el(
    'div',
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '64px 80px 56px',
      background: PAPER,
      color: INK,
      fontFamily: 'Space Grotesk',
    },
    [
      el('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, [
        el(
          'div',
          {
            width: 56,
            height: 56,
            borderRadius: 13,
            background: AMBER,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
          el('div', { color: PAPER, fontSize: 34, fontWeight: 600, lineHeight: 1 }, 'Y'),
        ),
        el(
          'div',
          { fontFamily: 'Instrument Serif', fontStyle: 'italic', fontSize: 34, color: AMBER },
          kicker,
        ),
      ]),
      el('div', { display: 'flex', flexDirection: 'column' }, [
        el(
          'div',
          {
            fontSize: title.length > 42 ? 58 : 68,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            lineHeight: 1.12,
            maxWidth: 980,
          },
          title,
        ),
        el('div', { marginTop: 26, fontFamily: 'JetBrains Mono', fontSize: 24, color: SOFT }, meta),
      ]),
      el('div', { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }, [
        el('div', { display: 'flex', flexDirection: 'column' }, [
          el('div', { width: 88, height: 3, background: AMBER, marginBottom: 18 }),
          el('div', { fontSize: 28, fontWeight: 500 }, 'Yash Raj Pandey'),
        ]),
        el('div', { fontFamily: 'JetBrains Mono', fontSize: 22, color: SOFT }, 'yashrajpandey.com'),
      ]),
    ],
  );

  const svg = await satori(card as unknown as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: await loadFonts(),
  });
  return new Uint8Array(new Resvg(svg).render().asPng());
}
