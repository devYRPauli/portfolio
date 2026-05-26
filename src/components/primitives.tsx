// Shared visual primitives.
import type { CSSProperties, ReactNode, MouseEvent } from 'react';

interface PillProps {
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  accent?: boolean;
  small?: boolean;
}

export function Pill({ icon, children, onClick, href, accent, small }: PillProps) {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: small ? 6 : 8,
    padding: small ? '5px 10px' : '7px 13px',
    fontFamily: 'var(--font-mono)',
    fontSize: small ? 10 : 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: accent ? 'var(--amber)' : 'var(--ink)',
    background: accent ? 'var(--amber-soft)' : 'rgba(255,255,255,0.05)',
    border: `1px solid ${accent ? 'var(--amber-soft)' : 'var(--line-2)'}`,
    borderRadius: 999,
    transition: 'all 250ms var(--ease-swift)',
  };
  const onEnter = (e: MouseEvent<HTMLElement>) => {
    e.currentTarget.style.background = accent ? 'var(--amber)' : 'rgba(255,255,255,0.12)';
    e.currentTarget.style.color = accent ? '#0a0a0b' : 'var(--ink)';
  };
  const onLeave = (e: MouseEvent<HTMLElement>) => {
    e.currentTarget.style.background = accent ? 'var(--amber-soft)' : 'rgba(255,255,255,0.05)';
    e.currentTarget.style.color = accent ? 'var(--amber)' : 'var(--ink)';
  };

  if (href) {
    const external = href.startsWith('http');
    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer' : undefined}
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        style={base}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        {icon}
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} style={base} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      {icon}
      {children}
    </button>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span
      className="mono"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 8px',
        fontSize: 10,
        letterSpacing: '0.08em',
        color: 'var(--ink-dim)',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--line)',
        borderRadius: 4,
      }}
    >
      {children}
    </span>
  );
}

export function LiveDot({ color = 'var(--cyan)' }: { color?: string }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: 8, height: 8 }}>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: color,
          animation: 'pulse-dot 1.4s ease-in-out infinite',
        }}
      />
      <span style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: `1px solid ${color}`, opacity: 0.4 }} />
    </span>
  );
}

export function Code({ children }: { children: ReactNode }) {
  return (
    <pre
      className="mono"
      style={{
        margin: '10px 0',
        padding: '14px 16px',
        background: '#07070a',
        border: '1px solid var(--line)',
        borderRadius: 8,
        fontSize: 12,
        lineHeight: 1.65,
        color: '#cbd5e1',
        overflowX: 'auto',
        whiteSpace: 'pre',
      }}
    >
      <code>{children}</code>
    </pre>
  );
}
