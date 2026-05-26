// Mobile (<768px) layout — a single vertical scroll of all islands, restyled with v2 tokens.
// Reuses the same card renderers as the desktop stage so content stays identical.
import type { CSSProperties } from 'react';
import { CONTENT, ISLANDS, type Item } from '@/data/content';
import { useStore } from '@/store/useStore';
import { CardContent, isExpandable } from './Stage';

const MIN_HEIGHT: Record<string, number> = {
  '2x2': 230,
  '2x1': 150,
  '1x2': 210,
  '1x1': 130,
};

function MobileCard({ item }: { item: Item }) {
  const setOpened = useStore((s) => s.setOpened);
  const expandable = isExpandable(item.kind);
  // Content-heavy cards (projects, playbooks) get the full row on mobile so their
  // text isn't crushed into a half-width column.
  const fullWidth =
    item.size === '2x2' || item.size === '2x1' ||
    item.kind === 'timeline' || item.kind === 'module' ||
    item.kind === 'project' || item.kind === 'playbook';

  const style: CSSProperties = {
    gridColumn: fullWidth ? '1 / -1' : 'auto',
    minHeight: MIN_HEIGHT[item.size] ?? 130,
    padding: 16,
    background: 'var(--glass)',
    border: '1px solid var(--line-2)',
    borderRadius: 'var(--r-md)',
    overflow: 'hidden',
    position: 'relative',
    cursor: expandable ? 'pointer' : 'default',
    WebkitTapHighlightColor: 'transparent',
  };

  return (
    <div style={style} onClick={() => expandable && setOpened(item)}>
      <div style={{ height: '100%', minHeight: 0 }}>
        <CardContent item={item} />
      </div>
    </div>
  );
}

export default function MobileView() {
  return (
    <div className="noise" style={{ minHeight: '100dvh', padding: '72px 16px 64px' }}>
      <div className="grid-bg" style={{ position: 'fixed', inset: 0, opacity: 0.25, pointerEvents: 'none', zIndex: -1 }} />

      <header style={{ marginBottom: 32 }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: '0.16em', color: 'var(--ink-dim)' }}>YASH RAJ PANDEY</div>
        <div className="serif" style={{ fontSize: 34, fontStyle: 'italic', lineHeight: 1.05, letterSpacing: '-0.02em', marginTop: 8 }}>
          AI Agents Architect.
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink-dim)', marginTop: 6 }}>Local-first AI infrastructure — open-weight LLMs, RAG, and agents in production.</div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        {ISLANDS.map((isl) => (
          <section key={isl.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span className="eyebrow">{isl.number} · {isl.label}</span>
              <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {CONTENT[isl.id].map((item) => <MobileCard key={item.id} item={item} />)}
            </div>
          </section>
        ))}
      </div>

      <footer style={{ marginTop: 56, paddingTop: 24, borderTop: '1px solid var(--line)', textAlign: 'center' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.1em' }}>
          © {new Date().getFullYear()} YASH RAJ PANDEY · GAINESVILLE, FL
        </div>
      </footer>
    </div>
  );
}
