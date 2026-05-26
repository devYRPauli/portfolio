// Live aesthetic modules. Visitor uses real ipapi geolocation; the rest are decorative.
import { useEffect, useState } from 'react';
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

function FlowModule() {
  const [bars, setBars] = useState<number[]>(() => Array(14).fill(0).map(() => Math.random()));
  useEffect(() => {
    const id = setInterval(() => {
      setBars((prev) =>
        prev.map((_, i) => {
          const target = 0.2 + Math.sin(Date.now() / 200 + i * 0.7) * 0.4 + Math.random() * 0.3;
          return Math.max(0.08, Math.min(1, target));
        }),
      );
    }, 120);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div className="eyebrow">Flow // Available</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 'clamp(70px, 12vh, 120px)' }}>
        {bars.map((v, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${v * 100}%`,
              background: 'linear-gradient(180deg, var(--amber) 0%, var(--amber-soft) 100%)',
              borderRadius: 2,
              transition: 'height 180ms var(--ease-cine)',
              boxShadow: '0 0 12px var(--amber-glow)',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="mono" style={{ fontSize: 'clamp(18px, 2vw, 24px)' }}>ONLINE</div>
        <LiveDot color="var(--amber)" />
      </div>
    </div>
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
    case 'flow': return <FlowModule />;
    case 'visitor': return <VisitorModule />;
    case 'ticker': return <TickerModule items={item.items} />;
    case 'manifesto': return <ManifestoModule />;
    default: return null;
  }
}
