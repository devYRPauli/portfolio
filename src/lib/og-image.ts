import { readFile } from 'node:fs/promises';
import satori, { type SatoriOptions } from 'satori';
import { Resvg } from '@resvg/resvg-js';

interface OgCard {
  kicker: string;
  title: string;
  meta: string;
}

// The light theme from global.css.
const BG = '#f4f5f2';
const INK = '#1a1e22';
const SOFT = '#48505a';
const LINE = '#d3d8d1';

const el = (type: string, style: Record<string, unknown>, children?: unknown, props: Record<string, unknown> = {}) => ({
  type,
  props: { style, children, ...props },
});

// Satori cannot read a variable font, so these are static instances of Cal Sans:
// the display cut for titles and the text cut for everything else. They carry no
// GPOS: with it, Satori opened random gaps of about twice a space between words.
const fontFile = (name: string) => readFile(`src/assets/fonts/cal-sans/og/${name}`);

let assets: Promise<{ fonts: SatoriOptions['fonts']; memoji: string }> | undefined;
const loadAssets = () =>
  (assets ??= Promise.all([
    fontFile('CalSans-Display.ttf'),
    fontFile('CalSans-Text.ttf'),
    fontFile('CalSans-TextSemiBold.ttf'),
    readFile('src/assets/memoji.png'),
  ]).then(([display, text, textSemiBold, memoji]) => ({
    fonts: [
      { name: 'Cal Sans Display', data: display, weight: 700 as const, style: 'normal' as const },
      { name: 'Cal Sans', data: text, weight: 400 as const, style: 'normal' as const },
      { name: 'Cal Sans', data: textSemiBold, weight: 600 as const, style: 'normal' as const },
    ],
    memoji: `data:image/png;base64,${memoji.toString('base64')}`,
  })));

export async function renderOgCard({ kicker, title, meta }: OgCard) {
  const { fonts, memoji } = await loadAssets();
  const card = el(
    'div',
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '60px 80px 56px',
      background: BG,
      color: INK,
      fontFamily: 'Cal Sans',
    },
    [
      el('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, [
        el('div', { display: 'flex', alignItems: 'center' }, [
          el('img', { width: 72, height: 74 }, undefined, { src: memoji, width: 72, height: 74 }),
          el('div', { marginLeft: 20, fontFamily: 'Cal Sans Display', fontSize: 32 }, 'Yash Raj Pandey'),
        ]),
        el('div', { fontSize: 30, fontWeight: 600, color: SOFT }, kicker),
      ]),
      el('div', { display: 'flex', flexDirection: 'column' }, [
        el(
          'div',
          {
            fontFamily: 'Cal Sans Display',
            fontSize: title.length > 42 ? 62 : 74,
            lineHeight: 1.06,
            maxWidth: 1000,
          },
          title,
        ),
        el('div', { marginTop: 24, fontSize: 30, color: SOFT }, meta),
      ]),
      el(
        'div',
        { display: 'flex', paddingTop: 22, borderTop: `2px solid ${LINE}`, fontSize: 24, color: SOFT },
        'yashrajpandey.com',
      ),
    ],
  );

  const svg = await satori(card as unknown as Parameters<typeof satori>[0], { width: 1200, height: 630, fonts });
  return new Uint8Array(new Resvg(svg).render().asPng());
}
