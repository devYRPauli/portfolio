// Viewport-fit stage — one screen per island, no scroll. Cards lay out in a fixed grid
// that fills the safe viewport area; islands swap via the camera transition.
import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { CONTENT, ISLANDS, ISLAND_BY_ID, type IslandId, type Item } from '@/data/content';
import { I, type IconName } from '@/icons';
import { useStore } from '@/store/useStore';
import {
  useIslandTransition,
  travelVector,
  getStageTransform,
  getCardEntryStyle,
  easeInOutCubic,
  type Phase,
  type AreaRect,
  type CardStyle,
} from '@/lib/transition';
import { renderModule } from './modules';
import { Pill, Tag, LiveDot } from './primitives';

interface Layout {
  cols: number;
  rows: number;
  cells: Record<string, string>;
}

const LAYOUTS: Record<IslandId, Layout> = {
  home: {
    cols: 4, rows: 3,
    cells: {
      'home-hero': '1 / 1 / 3 / 3',
      'home-facets': '1 / 3 / 3 / 4',
      'home-visitor': '1 / 4 / 2 / 5',
      'home-clock': '2 / 4 / 3 / 5',
      'home-github': '3 / 1 / 4 / 5',
    },
  },
  work: {
    cols: 4, rows: 3,
    cells: {
      'work-header': '1 / 1 / 2 / 3',
      'work-stack': '1 / 3 / 2 / 5',
      'work-blue-omics': '2 / 1 / 4 / 3',
      'work-turboquant': '2 / 3 / 4 / 4',
      'work-applyscore': '2 / 4 / 4 / 5',
    },
  },
  about: {
    cols: 4, rows: 3,
    cells: {
      'about-hero': '1 / 1 / 3 / 3',
      'about-manifesto': '1 / 3 / 3 / 4',
      'about-records': '1 / 4 / 2 / 5',
      'about-promotions': '2 / 4 / 3 / 5',
      'about-timeline': '3 / 1 / 4 / 3',
      'about-football': '3 / 3 / 4 / 5',
    },
  },
  lab: {
    cols: 3, rows: 3,
    cells: {
      'lab-header': '1 / 1 / 2 / 3',
      'lab-tagline': '1 / 3 / 2 / 4',
      'lab-token': '2 / 1 / 3 / 2',
      'lab-prompt': '2 / 2 / 3 / 3',
      'lab-json': '2 / 3 / 3 / 4',
      'lab-regex': '3 / 1 / 4 / 2',
      'lab-curl': '3 / 2 / 4 / 3',
      'lab-contrast': '3 / 3 / 4 / 4',
    },
  },
  playbooks: {
    cols: 4, rows: 3,
    cells: {
      'pb-header': '1 / 1 / 3 / 3',
      'pb-count': '1 / 3 / 2 / 5',
      'pb-local-llm': '2 / 3 / 4 / 4',
      'pb-rag': '2 / 4 / 4 / 5',
      'pb-eval': '3 / 1 / 4 / 3',
    },
  },
  contact: {
    cols: 4, rows: 3,
    cells: {
      'contact-hero': '1 / 1 / 3 / 3',
      'contact-linkedin': '1 / 3 / 3 / 4',
      'contact-github': '1 / 4 / 3 / 5',
      'contact-location': '3 / 1 / 4 / 3',
      'contact-avail': '3 / 3 / 4 / 5',
    },
  },
};

const EXPANDABLE = new Set(['project', 'playbook', 'tool', 'hero', 'aboutHero', 'pbHero', 'contactHero']);

function parseAreaRect(area: string, cols: number, rows: number): AreaRect | null {
  const parts = area.split('/').map((s) => parseInt(s.trim(), 10));
  if (parts.length !== 4 || parts.some(Number.isNaN)) return null;
  return { row: parts[0], col: parts[1], rows, cols };
}

function iconOf(name: IconName | undefined, fallback: IconName) {
  return (name && I[name]) || I[fallback];
}

// ===== Card renderers =====

function HomeHero({ item }: { item: Item }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="eyebrow">{item.label}</div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: 6 }}>
          <LiveDot color="var(--amber)" /> AVAILABLE
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, padding: 'var(--s-2) 0' }}>
        <img
          src="/memoji.png"
          alt="Yash waving hello"
          draggable={false}
          style={{
            height: 'clamp(116px, 17vh, 188px)',
            width: 'auto',
            objectFit: 'contain',
            transformOrigin: '52% 88%',
            animation: 'wave 3.6s var(--ease-cine) infinite',
            filter: 'drop-shadow(0 16px 36px rgba(0,0,0,0.45))',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
      </div>
      <div>
        <div style={{ fontSize: 'clamp(34px, 4vw, 56px)', lineHeight: 1, fontWeight: 500, letterSpacing: '-0.03em', marginBottom: 'var(--s-3)' }}>
          Yash Raj Pandey.
        </div>
        <div className="serif" style={{ fontSize: 'clamp(18px, 1.8vw, 26px)', fontStyle: 'italic', color: 'var(--ink-dim)', lineHeight: 1.15, letterSpacing: '-0.01em', marginBottom: 'var(--s-4)' }}>
          AI Agents Architect.<br />Local-first AI infrastructure.
        </div>
        <div style={{ display: 'flex', gap: 'var(--s-2)', flexWrap: 'wrap' }}>
          <Pill accent icon={<I.ArrowUR size={11} />}>Open case studies</Pill>
          <Pill icon={<I.Terminal size={11} />}>Press ⌘K</Pill>
        </div>
      </div>
    </div>
  );
}

function AboutHero({ item }: { item: Item }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="eyebrow">{item.label}</div>
        <I.Compass size={16} style={{ color: 'var(--ink-dim)' }} />
      </div>
      <div>
        <div className="serif" style={{ fontSize: 'clamp(36px, 4vw, 52px)', lineHeight: 1, letterSpacing: '-0.02em', fontStyle: 'italic', marginBottom: 'var(--s-3)' }}>
          Driven by<br />precision.
        </div>
        <div style={{ fontSize: 'clamp(13px, 1vw, 14px)', color: 'var(--ink-dim)', lineHeight: 1.6, maxWidth: 380 }}>
          Craft is not a stage of the process — it's the entire process.
        </div>
      </div>
      <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', display: 'flex', gap: 'var(--s-4)', letterSpacing: '0.1em', flexWrap: 'wrap' }}>
        <span>5M+ RECORDS</span><span>3 ROLES / 14 MO</span><span>UF IFAS</span>
      </div>
    </div>
  );
}

function PlaybooksHero({ item }: { item: Item }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="eyebrow">{item.label}</div>
        <I.Book size={16} style={{ color: 'var(--ink-dim)' }} />
      </div>
      <div>
        <div className="serif" style={{ fontSize: 'clamp(36px, 4vw, 52px)', lineHeight: 1, letterSpacing: '-0.02em', fontStyle: 'italic', marginBottom: 'var(--s-3)' }}>
          Field notes.
        </div>
        <div style={{ fontSize: 'clamp(13px, 1vw, 14px)', color: 'var(--ink-dim)', lineHeight: 1.6, maxWidth: 380 }}>
          Patterns from production LLM systems. What I'd build the same, and what I'd never build again.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--s-2)' }}>
        <Tag>LOCAL LLMS</Tag><Tag>RAG</Tag><Tag>EVALS</Tag>
      </div>
    </div>
  );
}

function ContactHero({ item }: { item: Item }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="eyebrow">{item.label}</div>
        <I.Mail size={16} style={{ color: 'var(--ink-dim)' }} />
      </div>
      <div>
        <div className="serif" style={{ fontSize: 'clamp(34px, 3.6vw, 48px)', lineHeight: 1.05, letterSpacing: '-0.02em', fontStyle: 'italic', marginBottom: 'var(--s-3)' }}>
          Let's build<br />something real.
        </div>
        <div style={{ fontSize: 'clamp(13px, 1vw, 14px)', color: 'var(--ink-dim)', lineHeight: 1.6, marginBottom: 'var(--s-4)' }}>
          Open to good conversations on AI infrastructure and local-first LLM systems.
        </div>
        <Pill accent icon={<I.Mail size={12} />} href="mailto:yashpn62@gmail.com">yashpn62@gmail.com</Pill>
      </div>
    </div>
  );
}

function HeaderCard({ item }: { item: Item }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', gap: 'var(--s-3)' }}>
      <div className="eyebrow">{item.label}</div>
      <div>
        <div style={{ fontSize: 'clamp(22px, 2vw, 30px)', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{item.title}</div>
        <div style={{ fontSize: 13, color: 'var(--ink-dim)', marginTop: 'var(--s-2)', lineHeight: 1.5 }}>{item.subtitle}</div>
      </div>
    </div>
  );
}

function StatCard({ item }: { item: Item }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div className="eyebrow">Metric</div>
      <div>
        <div className="mono" style={{ fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 500, lineHeight: 1, color: 'var(--ink)' }}>{item.title}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-dim)', marginTop: 'var(--s-2)' }}>{item.subtitle}</div>
      </div>
    </div>
  );
}

function ProjectCard({ item }: { item: Item }) {
  const IconCmp = iconOf(item.icon, 'Cpu');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', gap: 'var(--s-3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--s-3)' }}>
        <div className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
          <span>{item.year}</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--ink-mute)' }} />
          <span>{item.role}</span>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--s-2)', flexShrink: 0 }}>
          <LiveDot color="var(--cyan)" />
          <IconCmp size={16} style={{ color: 'var(--ink-dim)' }} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 'clamp(20px, 1.8vw, 26px)', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{item.title}</div>
        <div className="serif" style={{ fontSize: 'clamp(13px, 1vw, 15px)', fontStyle: 'italic', color: 'var(--ink-dim)', marginTop: 4 }}>{item.subtitle}</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-dim)', marginTop: 'var(--s-2)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {item.tags?.slice(0, 4).map((t) => <Tag key={t}>{t}</Tag>)}
      </div>
    </div>
  );
}

function PlaybookCard({ item }: { item: Item }) {
  const IconCmp = iconOf(item.icon, 'Book');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', gap: 'var(--s-3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="eyebrow">{item.label}</div>
        <IconCmp size={16} style={{ color: 'var(--ink-dim)' }} />
      </div>
      <div>
        <div className="serif" style={{ fontSize: 'clamp(20px, 1.8vw, 26px)', fontStyle: 'italic', letterSpacing: '-0.01em', lineHeight: 1.1, whiteSpace: 'pre-line' }}>{item.title}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-dim)', marginTop: 'var(--s-2)', lineHeight: 1.5 }}>{item.subtitle}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.1em' }}>{item.read?.toUpperCase() || 'READ'}</span>
        <I.Arrow size={14} style={{ color: 'var(--ink-dim)' }} />
      </div>
    </div>
  );
}

function ToolCard({ item }: { item: Item }) {
  const IconCmp = iconOf(item.icon, 'Flask');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="eyebrow">{item.label}</div>
        <IconCmp size={16} style={{ color: 'var(--ink-dim)' }} />
      </div>
      <div>
        <div style={{ fontSize: 'clamp(18px, 1.5vw, 22px)', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{item.title}</div>
        <div className="serif" style={{ fontSize: 'clamp(13px, 1vw, 15px)', fontStyle: 'italic', color: 'var(--ink-dim)', marginTop: 'var(--s-1)', lineHeight: 1.3 }}>{item.subtitle}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.1em' }}>LAUNCH</span>
        <I.ArrowUR size={14} style={{ color: 'var(--ink-dim)' }} />
      </div>
    </div>
  );
}

function LinkCard({ item }: { item: Item }) {
  const IconCmp = iconOf(item.icon, 'Link');
  return (
    <a
      href={item.href}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', color: 'inherit', textDecoration: 'none' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <IconCmp size={item.big ? 22 : 16} style={{ color: 'var(--ink-dim)' }} />
        <I.ArrowUR size={12} style={{ color: 'var(--ink-mute)' }} />
      </div>
      <div>
        <div style={{ fontSize: item.big ? 'clamp(18px, 1.5vw, 22px)' : 'clamp(14px, 1.1vw, 16px)', fontWeight: 500 }}>{item.title}</div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-dim)', marginTop: 4, letterSpacing: '0.05em' }}>{item.subtitle}</div>
      </div>
    </a>
  );
}

function FactCard({ item }: { item: Item }) {
  const IconCmp = iconOf(item.icon, 'Map');
  const inner = (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <IconCmp size={16} style={{ color: 'var(--ink-dim)' }} />
        {item.href ? <I.ArrowUR size={12} style={{ color: 'var(--ink-mute)' }} /> : item.status === 'live' && <LiveDot color="var(--cyan)" />}
      </div>
      <div>
        <div style={{ fontSize: 'clamp(16px, 1.4vw, 20px)', fontWeight: 500 }}>{item.title}</div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-dim)', marginTop: 4, letterSpacing: '0.05em' }}>{item.subtitle}</div>
        {item.description && <div style={{ fontSize: 12, color: 'var(--ink-dim)', marginTop: 'var(--s-2)', lineHeight: 1.5 }}>{item.description}</div>}
      </div>
    </div>
  );
  if (item.href) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: 'inherit', textDecoration: 'none', display: 'block', height: '100%' }}>
        {inner}
      </a>
    );
  }
  return inner;
}

const TIMELINE_HUES = ['var(--amber)', 'var(--cyan)', 'var(--green)', 'var(--violet)', 'var(--amber)'];

function TimelineCard({ item }: { item: Item }) {
  const entries = item.timeline ?? [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div className="eyebrow">{item.title}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', position: 'relative', padding: 'var(--s-3) 0' }}>
        {/* base track */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: 'var(--line-2)' }} />
        {/* animated colored track drawing left → right */}
        <div
          style={{
            position: 'absolute', left: 0, right: 0, top: '50%', height: 2, borderRadius: 2,
            background: 'linear-gradient(90deg, var(--amber), var(--cyan), var(--green), var(--violet), var(--amber))',
            transformOrigin: 'left center',
            animation: 'draw-line 1100ms var(--ease-cine) both',
          }}
        />
        {entries.map((it, i) => {
          const last = i === entries.length - 1;
          const hue = TIMELINE_HUES[i % TIMELINE_HUES.length];
          return (
            <div
              key={it.year}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--s-2)', zIndex: 1, position: 'relative',
                animation: `rise-fade 420ms var(--ease-swift) both`, animationDelay: `${250 + i * 150}ms`,
              }}
            >
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.1em' }}>{it.year}</div>
              <div
                style={{
                  width: last ? 11 : 9, height: last ? 11 : 9, borderRadius: '50%',
                  background: hue, boxShadow: `0 0 10px ${hue}`,
                  animation: last ? 'ring 2.4s ease-in-out infinite' : undefined,
                  animationDelay: last ? '1400ms' : undefined,
                }}
              />
              <div style={{ fontSize: 11, fontWeight: 500, color: last ? 'var(--ink)' : 'var(--ink-dim)' }}>{it.title}</div>
            </div>
          );
        })}
      </div>
      <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.1em' }}>FULL STORY IN ABOUT</div>
    </div>
  );
}

function LabBanner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="eyebrow">Principles</div>
        <I.Flask size={16} style={{ color: 'var(--ink-dim)' }} />
      </div>
      <div>
        <div className="serif" style={{ fontSize: 'clamp(22px, 2vw, 30px)', fontStyle: 'italic', lineHeight: 1.05, letterSpacing: '-0.015em', marginBottom: 'var(--s-2)' }}>
          No signup. No tracking.
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-dim)', lineHeight: 1.5 }}>Everything runs client-side. Your data never leaves the browser.</div>
      </div>
    </div>
  );
}

export function isExpandable(kind: string) {
  return EXPANDABLE.has(kind);
}

export function CardContent({ item }: { item: Item }) {
  switch (item.kind) {
    case 'hero': return <HomeHero item={item} />;
    case 'aboutHero': return <AboutHero item={item} />;
    case 'pbHero': return <PlaybooksHero item={item} />;
    case 'contactHero': return <ContactHero item={item} />;
    case 'header': return <HeaderCard item={item} />;
    case 'module': return renderModule(item);
    case 'stat': return <StatCard item={item} />;
    case 'project': return <ProjectCard item={item} />;
    case 'playbook': return <PlaybookCard item={item} />;
    case 'tool': return <ToolCard item={item} />;
    case 'link': return <LinkCard item={item} />;
    case 'fact': return <FactCard item={item} />;
    case 'timeline': return <TimelineCard item={item} />;
    case 'labBanner': return <LabBanner />;
    default: return null;
  }
}

function BentoCard({ item, area, entryStyle, onOpen }: { item: Item; area: string; entryStyle: CardStyle | null; onOpen: (item: Item) => void }) {
  const expandable = EXPANDABLE.has(item.kind);
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);

  const transform = entryStyle
    ? entryStyle.transform
    : pressed
      ? 'scale(0.97)'
      : hover && expandable
        ? 'translateY(-2px)'
        : 'translateY(0)';

  const style: CSSProperties = {
    gridArea: area,
    position: 'relative',
    padding: 'clamp(14px, 1.6vw, 22px)',
    background: hover && expandable ? 'rgba(255,255,255,0.025)' : 'var(--glass)',
    border: `1px solid ${hover && expandable ? 'var(--line-3)' : 'var(--line-2)'}`,
    borderRadius: 'var(--r-md)',
    overflow: 'hidden',
    isolation: 'isolate',
    cursor: expandable ? 'pointer' : 'default',
    transition: entryStyle
      ? 'border-color 140ms var(--ease-swift), background 140ms var(--ease-swift)'
      : 'opacity 360ms var(--ease-swift), border-color 140ms var(--ease-swift), transform 160ms cubic-bezier(0.34, 1.56, 0.64, 1), background 140ms var(--ease-swift)',
    transform,
    opacity: entryStyle ? entryStyle.opacity : 1,
    boxShadow: hover && expandable ? '0 8px 24px rgba(0,0,0,0.25), 0 0 0 1px rgba(212,165,116,0.06)' : 'none',
    minHeight: 0,
    minWidth: 0,
    willChange: entryStyle ? 'transform, opacity' : undefined,
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPressed(false); }}
      onMouseDown={() => expandable && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onClick={() => expandable && onOpen(item)}
      style={style}
    >
      <div style={{ position: 'relative', height: '100%', minHeight: 0 }}>
        <CardContent item={item} />
      </div>
      {expandable && (
        <div aria-hidden style={{ position: 'absolute', top: 10, right: 10, width: 18, height: 18, opacity: hover ? 1 : 0, transition: 'opacity 180ms', color: 'var(--ink-dim)' }}>
          <I.ArrowUR size={14} />
        </div>
      )}
    </div>
  );
}

// ===== Constellation overlay (shown during travel) =====
function ConstellationOverlay({ phase, t, prevIsland, nextIsland }: { phase: Phase; t: number; prevIsland: string; nextIsland: string }) {
  let vis = 0;
  if (phase === 'leaving') vis = Math.max(0, (t - 0.3) / 0.7);
  else if (phase === 'travelling') vis = 1;
  else if (phase === 'entering') vis = Math.max(0, 1 - t / 0.5);
  if (vis <= 0.001) return null;

  const VB = { w: 600, h: 400 };
  const cx = VB.w / 2;
  const cy = VB.h / 2;
  const SCALE = 1.1;
  const pts = ISLANDS.map((isl) => ({ id: isl.id, label: isl.label, number: isl.number, x: cx + isl.x * SCALE, y: cy + isl.y * SCALE }));
  const from = pts.find((p) => p.id === prevIsland);
  const to = pts.find((p) => p.id === nextIsland);

  let pathDraw = 0;
  if (phase === 'travelling') pathDraw = easeInOutCubic(t);
  else if (phase === 'entering') pathDraw = 1;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, pointerEvents: 'none', opacity: vis, transition: 'opacity 60ms linear', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(11,11,13,0.55) 0%, rgba(11,11,13,0.85) 100%)' }} />
      <svg viewBox={`0 0 ${VB.w} ${VB.h}`} style={{ width: 'min(72vw, 760px)', height: 'auto', maxHeight: '70vh', overflow: 'visible' }}>
        <defs>
          <radialGradient id="dotGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--amber)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--amber)" stopOpacity="0" />
          </radialGradient>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {Array.from({ length: 13 }).map((_, i) => (
          <line key={`vx${i}`} x1={i * 50} y1={0} x2={i * 50} y2={VB.h} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        ))}
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`hx${i}`} x1={0} y1={i * 50} x2={VB.w} y2={i * 50} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        ))}
        {pts.map((p, i) => pts.slice(i + 1).map((q, j) => (
          <line key={`c${i}-${j}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="2 4" />
        )))}
        {pts.map((p) => {
          const isFrom = p.id === prevIsland;
          const isTo = p.id === nextIsland;
          return (
            <g key={p.id}>
              <circle cx={p.x} cy={p.y} r={isTo ? 22 : 16} fill="url(#dotGlow)" opacity={isTo ? 1 : isFrom ? 0.7 : 0.3} />
              <circle cx={p.x} cy={p.y} r={isTo || isFrom ? 5 : 3} fill={isTo ? 'var(--amber)' : isFrom ? 'var(--ink)' : 'var(--ink-mute)'} filter={isTo ? 'url(#softGlow)' : undefined} />
              <text x={p.x + 10} y={p.y - 8} fill={isTo || isFrom ? 'var(--ink)' : 'var(--ink-mute)'} fontSize="10" fontFamily="var(--font-mono)" letterSpacing="0.1em" opacity={isTo || isFrom ? 1 : 0.5}>
                {p.number} {p.label.toUpperCase()}
              </text>
            </g>
          );
        })}
        {from && to && (() => {
          const mx = (from.x + to.x) / 2;
          const my = (from.y + to.y) / 2;
          const ndx = -(to.y - from.y);
          const ndy = to.x - from.x;
          const nlen = Math.hypot(ndx, ndy) || 1;
          const curve = 28;
          const cx2 = mx + (ndx / nlen) * curve;
          const cy2 = my + (ndy / nlen) * curve;
          const d = `M ${from.x} ${from.y} Q ${cx2} ${cy2} ${to.x} ${to.y}`;
          const totalLen = Math.hypot(to.x - from.x, to.y - from.y) + curve;
          const u = pathDraw;
          const px = (1 - u) * (1 - u) * from.x + 2 * (1 - u) * u * cx2 + u * u * to.x;
          const py = (1 - u) * (1 - u) * from.y + 2 * (1 - u) * u * cy2 + u * u * to.y;
          return (
            <>
              <path d={d} stroke="var(--amber)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeDasharray={totalLen} strokeDashoffset={totalLen * (1 - pathDraw)} filter="url(#softGlow)" opacity="0.95" />
              {pathDraw > 0 && pathDraw < 1 && <circle cx={px} cy={py} r="4" fill="var(--amber)" filter="url(#softGlow)" />}
            </>
          );
        })()}
      </svg>
      <div style={{ position: 'absolute', bottom: '14vh', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--ink-dim)', textTransform: 'uppercase', marginBottom: 6 }}>Travelling</div>
        <div className="mono" style={{ fontSize: 13, letterSpacing: '0.08em', color: 'var(--ink)' }}>
          {ISLAND_BY_ID[prevIsland]?.label.toUpperCase()}
          <span style={{ color: 'var(--amber)', margin: '0 12px' }}>→</span>
          {ISLAND_BY_ID[nextIsland]?.label.toUpperCase()}
        </div>
      </div>
    </div>
  );
}

// ===== Stage =====
export default function Stage({ duration }: { duration?: number }) {
  const active = useStore((s) => s.active);
  const setOpened = useStore((s) => s.setOpened);
  const { renderingId, phase, t, prevIsland, nextIsland } = useIslandTransition(active, duration);
  const dir = useMemo(() => travelVector(prevIsland, nextIsland), [prevIsland, nextIsland]);

  const layout = LAYOUTS[renderingId] ?? LAYOUTS.home;
  const items = CONTENT[renderingId] ?? [];
  const stageStyle = getStageTransform(phase, t, dir);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.35 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 35%, rgba(11,11,13,0.92) 100%)', pointerEvents: 'none' }} />

      <div
        style={{
          position: 'absolute',
          top: 'var(--stage-top)',
          left: 'var(--stage-x)',
          right: 'var(--stage-x)',
          bottom: 'var(--stage-bottom)',
          opacity: stageStyle.opacity,
          transform: stageStyle.transform,
          filter: stageStyle.filter,
          transformOrigin: '50% 50%',
          willChange: 'transform, opacity, filter',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${layout.rows}, minmax(0, 1fr))`,
            gap: 'clamp(10px, 1vw, 16px)',
            width: '100%',
            height: '100%',
          }}
        >
          {items.map((item, i) => {
            const area = layout.cells[item.id];
            if (!area) return null;
            const areaRect = parseAreaRect(area, layout.cols, layout.rows);
            const entryStyle = getCardEntryStyle(i, items.length, phase, t, areaRect);
            return <BentoCard key={`${renderingId}-${item.id}`} item={item} area={area} entryStyle={entryStyle} onOpen={setOpened} />;
          })}
        </div>
      </div>

      <ConstellationOverlay phase={phase} t={t} prevIsland={prevIsland} nextIsland={nextIsland} />
    </div>
  );
}
