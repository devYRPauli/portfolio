// Live aesthetic modules. Visitor uses real ipapi geolocation; GitHub uses real
// contribution data; the rest are decorative.
import { useEffect, useMemo, useState } from 'react';
import type { Item } from '@/data/content';
import { LiveDot } from './primitives';

const GREETING_MAP: Record<string, string> = {
  IN: 'Namaste', US: 'Hello', GB: 'Hello', AU: 'Hello', CA: 'Hello',
  FR: 'Bonjour', BE: 'Bonjour', DE: 'Hallo', AT: 'Hallo', CH: 'Hallo',
  ES: 'Hola', MX: 'Hola', AR: 'Hola', CO: 'Hola', IT: 'Ciao',
  JP: 'Konnichiwa', KR: 'Annyeong', CN: 'Ni Hao', BR: 'Olá', PT: 'Olá',
  RU: 'Privet', SA: 'Marhaba', AE: 'Marhaba', EG: 'Marhaba', NL: 'Hallo',
};

function ClockModule() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = String(t.getHours()).padStart(2, '0');
  const mm = String(t.getMinutes()).padStart(2, '0');
  const ss = String(t.getSeconds()).padStart(2, '0');
  const date = t.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div className="eyebrow">Local // Gainesville</div>
      <div className="mono" style={{ fontSize: 'clamp(28px, 3.4vw, 38px)', letterSpacing: '0.02em', display: 'flex', alignItems: 'baseline', gap: 2 }}>
        <span>{hh}</span>
        <span style={{ opacity: 0.4 }}>:</span>
        <span>{mm}</span>
        <span style={{ opacity: 0.3, fontSize: '0.62em', color: 'var(--amber)' }}>:{ss}</span>
      </div>
      <div className="mono" style={{ fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.1em' }}>{date.toUpperCase()}</div>
    </div>
  );
}

// The home centerpiece: cycles through the facets of who Yash is, each with its own
// accent. Not "RAG guy" — range.
const FACETS = [
  { label: 'Architect.', sub: 'AI agents in production', color: 'var(--amber)' },
  { label: 'Researcher.', sub: 'quantization on Apple Silicon', color: 'var(--cyan)' },
  { label: 'Builder.', sub: '0 → 5M+ records shipped', color: 'var(--green)' },
  { label: 'Football nerd.', sub: 'off the clock, always', color: 'var(--rose)' },
];

function FacetsModule() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % FACETS.length), 2800);
    return () => clearInterval(id);
  }, []);
  const f = FACETS[i];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div className="eyebrow">I am //</div>
      <div style={{ minHeight: 0 }}>
        <div key={i} style={{ animation: 'facet-in 520ms var(--ease-swift) both' }}>
          <div style={{ fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, color: f.color }}>{f.label}</div>
          <div className="serif" style={{ fontSize: 'clamp(14px, 1.3vw, 18px)', fontStyle: 'italic', color: 'var(--ink-dim)', marginTop: 'var(--s-2)' }}>{f.sub}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 5 }}>
        {FACETS.map((ff, k) => (
          <div key={k} style={{ width: 22, height: 2, borderRadius: 2, background: k === i ? ff.color : 'var(--line-2)', transition: 'background 300ms' }} />
        ))}
      </div>
    </div>
  );
}

interface ContribDay { date: string; count: number; level: number; }
const GH_USER = 'devYRPauli';
const GH_COLORS = ['var(--gh-0)', 'var(--gh-1)', 'var(--gh-2)', 'var(--gh-3)', 'var(--gh-4)'];

// Real GitHub contribution graph — fetched client-side, breathing green squares that
// reveal left → right on load. Decorative if the fetch fails (graceful skeleton).
function GithubGraphModule() {
  const [days, setDays] = useState<ContribDay[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`https://github-contributions-api.jogruber.de/v4/${GH_USER}?y=last`)
      .then((r) => r.json())
      .then((d: { total?: Record<string, number>; contributions?: ContribDay[] }) => {
        if (cancelled) return;
        const c = d.contributions ?? [];
        setDays(c);
        setTotal(d.total ? Object.values(d.total)[0] ?? null : c.reduce((s, x) => s + x.count, 0));
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, []);

  // Chunk days into week-columns, padding the front so column 1 aligns to weekday.
  const weeks = useMemo(() => {
    const src = days ?? Array.from({ length: 364 }, () => ({ date: '', count: 0, level: 0 }) as ContribDay);
    const padded: (ContribDay | null)[] = [...src];
    if (src.length && src[0].date) {
      const lead = new Date(src[0].date).getDay();
      for (let k = 0; k < lead; k++) padded.unshift(null);
    }
    const cols: (ContribDay | null)[][] = [];
    for (let k = 0; k < padded.length; k += 7) cols.push(padded.slice(k, k + 7));
    return cols;
  }, [days]);

  const loading = !days && !failed;

  return (
    <a
      href={`https://github.com/${GH_USER}`}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', color: 'inherit', textDecoration: 'none', gap: 'var(--s-3)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Activity // GitHub {!loading && !failed && <LiveDot color="var(--green)" />}
        </div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.06em' }}>
          {total != null ? `${total.toLocaleString()} contributions · @${GH_USER}` : `@${GH_USER}`}
        </div>
      </div>
      <div
        style={{
          flex: 1, minHeight: 0, display: 'grid', gridAutoFlow: 'column',
          gridTemplateColumns: `repeat(${weeks.length}, 1fr)`, gridTemplateRows: 'repeat(7, 1fr)',
          gap: 'clamp(2px, 0.3vw, 4px)', alignContent: 'center',
        }}
      >
        {weeks.map((col, ci) =>
          col.map((d, ri) => {
            const lvl = d?.level ?? 0;
            const anim = days
              ? lvl >= 4
                ? { animation: 'cell-in 420ms var(--ease-swift) both, breathe 3.2s ease-in-out infinite', animationDelay: `${ci * 13}ms, ${700 + ci * 13}ms` }
                : { animation: 'cell-in 420ms var(--ease-swift) both', animationDelay: `${ci * 13}ms` }
              : {};
            return (
              <span
                key={`${ci}-${ri}`}
                title={d?.date ? `${d.date}: ${d.count} contributions` : undefined}
                style={{ borderRadius: 2, background: GH_COLORS[lvl], opacity: loading ? 0.5 : 1, ...anim }}
              />
            );
          }),
        )}
      </div>
    </a>
  );
}

function VisitorModule() {
  const [greeting, setGreeting] = useState('Hello');
  const [city, setCity] = useState('your corner of the world');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('https://ipapi.co/json/')
      .then((r) => r.json())
      .then((d: { country_code?: string; city?: string }) => {
        if (cancelled) return;
        setGreeting(GREETING_MAP[d.country_code ?? ''] ?? 'Hello');
        const c = d.city?.trim();
        if (c) setCity(c);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        Visitor {!loading && <LiveDot color="var(--cyan)" />}
      </div>
      <div className="serif" style={{ fontSize: 'clamp(30px, 4vw, 40px)', lineHeight: 1, fontStyle: 'italic' }}>{greeting},</div>
      <div className="mono" style={{ fontSize: 11, color: 'var(--ink-dim)' }}>
        from <span style={{ color: 'var(--cyan)' }}>{loading ? 'locating…' : city}</span>
      </div>
    </div>
  );
}

function TickerModule({ items }: { items?: string[] }) {
  const source = items?.length ? items : ['React', 'TypeScript', 'Python'];
  const content = [...source, ...source, ...source, ...source];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', overflow: 'hidden' }}>
      <div className="eyebrow">Stack</div>
      <div style={{ overflow: 'hidden', position: 'relative', maskImage: 'linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)', WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)' }}>
        <div style={{ display: 'inline-flex', whiteSpace: 'nowrap', animation: 'marquee 32s linear infinite' }}>
          {content.map((it, i) => (
            <span
              key={i}
              className="mono"
              style={{ fontSize: 14, padding: '0 18px', color: i % 3 === 1 ? 'var(--amber)' : 'var(--ink)', display: 'inline-flex', alignItems: 'center', gap: 10 }}
            >
              {it}
              <span style={{ color: 'var(--ink-mute)' }}>/</span>
            </span>
          ))}
        </div>
      </div>
      <div className="mono" style={{ fontSize: 10, color: 'var(--ink-dim)' }}>CURRENTLY SHIPPING WITH</div>
    </div>
  );
}

const MANIFESTO = [
  ['Craft is compounding.', 'Every detail shipped is a detail future-you inherits.'],
  ['Ship the smallest thing.', 'Then let real use teach you the next one.'],
  ['Reliability is a feature.', 'Users will forgive slow. They will not forgive broken.'],
];

function ManifestoModule() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % MANIFESTO.length), 5000);
    return () => clearInterval(id);
  }, []);
  const [head, body] = MANIFESTO[i];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div className="eyebrow">Philosophy</div>
      <div>
        <div key={i} className="serif" style={{ fontSize: 'clamp(24px, 2.6vw, 32px)', lineHeight: 1.05, fontStyle: 'italic', letterSpacing: '-0.01em', animation: 'rise-fade 500ms var(--ease-swift) both' }}>
          {head}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-dim)', marginTop: 12, lineHeight: 1.5 }}>{body}</div>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {MANIFESTO.map((_, k) => (
          <div key={k} style={{ width: 18, height: 2, background: k === i ? 'var(--amber)' : 'var(--line-2)' }} />
        ))}
      </div>
    </div>
  );
}

export function renderModule(item: Item) {
  switch (item.moduleType) {
    case 'clock': return <ClockModule />;
    case 'facets': return <FacetsModule />;
    case 'github': return <GithubGraphModule />;
    case 'visitor': return <VisitorModule />;
    case 'ticker': return <TickerModule items={item.items} />;
    case 'manifesto': return <ManifestoModule />;
    default: return null;
  }
}
