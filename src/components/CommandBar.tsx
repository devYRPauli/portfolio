// Top command bar — brand + ET clock (left), island switcher (center), ⌘K trigger (right).
import { useEffect, useState } from 'react';
import { ISLANDS } from '@/data/content';
import { I } from '@/icons';
import { useStore } from '@/store/useStore';

const ISLAND_ACCENT: Record<string, string> = {
  home: 'var(--amber)', work: 'var(--cyan)', about: 'var(--violet)',
  lab: 'var(--green)', playbooks: 'var(--rose)', contact: 'var(--cyan)',
};

export default function CommandBar() {
  const active = useStore((s) => s.active);
  const setActive = useStore((s) => s.setActive);
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);
  const [now, setNow] = useState(new Date());
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' });

  const panel = {
    background: 'var(--glass-strong)',
    border: '1px solid var(--line-2)',
    borderRadius: 'var(--r-md)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    pointerEvents: 'auto' as const,
  };

  return (
    <div style={{ position: 'fixed', top: 'var(--hud-inset)', left: 'var(--hud-inset)', right: 'var(--hud-inset)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--s-3)', pointerEvents: 'none' }}>
      {/* Brand */}
      <div style={{ ...panel, display: 'flex', alignItems: 'center', gap: 'var(--s-3)', padding: '8px 14px' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)', boxShadow: '0 0 8px var(--amber-glow)' }} />
        <span className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', fontWeight: 500 }}>YASH RAJ PANDEY</span>
        <span style={{ width: 1, height: 12, background: 'var(--line-2)' }} />
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.1em' }}>{time} ET</span>
      </div>

      {/* Island switcher */}
      <div style={{ ...panel, display: 'flex', gap: 2, padding: 4 }}>
        {ISLANDS.map((isl) => {
          const isActive = isl.id === active;
          const isHover = hovered === isl.id;
          const islAccent = ISLAND_ACCENT[isl.id] ?? 'var(--amber)';
          return (
            <button
              key={isl.id}
              onClick={() => setActive(isl.id)}
              onMouseEnter={() => setHovered(isl.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: 'relative',
                padding: '8px 14px',
                borderRadius: 'var(--r-sm)',
                background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: isActive ? 'var(--ink)' : isHover ? 'var(--ink)' : 'var(--ink-dim)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontWeight: isActive ? 500 : 400,
                transition: 'background 160ms var(--ease-swift), color 160ms var(--ease-swift)',
              }}
            >
              {isl.label}
              {isActive && <span aria-hidden style={{ position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)', width: 16, height: 2, background: islAccent, borderRadius: 2, boxShadow: `0 0 8px ${islAccent}` }} />}
            </button>
          );
        })}
      </div>

      {/* Palette trigger */}
      <button onClick={() => setPaletteOpen(true)} style={{ ...panel, display: 'flex', alignItems: 'center', gap: 'var(--s-2)', padding: '8px 14px' }}>
        <I.Search size={13} style={{ color: 'var(--ink-dim)' }} />
        <span style={{ fontSize: 12, color: 'var(--ink-dim)' }}>Quick nav</span>
        <span style={{ marginLeft: 'var(--s-2)', padding: '2px 6px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--line-2)', borderRadius: 4, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-dim)' }}>⌘K</span>
      </button>
    </div>
  );
}
