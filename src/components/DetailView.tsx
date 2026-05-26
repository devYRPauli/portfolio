// Detail overlay — project case study, playbook, tool launcher, long-form bio.
import { Suspense, lazy, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { PLAYBOOKS, type Item } from '@/data/content';
import { I } from '@/icons';
import { useStore } from '@/store/useStore';
import { useFocusTrap } from '@/lib/useFocusTrap';
import { Tag, LiveDot, Code, Pill } from './primitives';

const ToolRenderer = lazy(() => import('./tools'));

function Section({ n, heading, accent = 'var(--amber)', children }: { n: string; heading: string; accent?: string; children: ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <span className="mono" style={{ fontSize: 11, color: accent, letterSpacing: '0.1em' }}>// {n}</span>
        <h2 style={{ fontSize: 'clamp(20px, 2.4vw, 26px)', fontWeight: 500, letterSpacing: '-0.01em' }}>{heading}</h2>
      </div>
      <div>{children}</div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.025)', border: '1px solid var(--line)', borderRadius: 10 }}>
      <div className="mono" style={{ fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function ProjectDetail({ item }: { item: Item }) {
  const cs = item.caseStudy;
  const accent = item.accent ?? 'var(--amber)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      <div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          {item.tags?.map((t) => <Tag key={t}>{t}</Tag>)}
          <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 11 }} className="mono">
            <LiveDot color={accent} /> {(item.status || '').toUpperCase()}
          </span>
        </div>
        <h1 className="serif" style={{ fontSize: 'clamp(40px, 7vw, 72px)', lineHeight: 0.98, letterSpacing: '-0.03em', fontStyle: 'italic', marginBottom: 16 }}>{item.title}</h1>
        <div style={{ fontSize: 'clamp(16px, 2vw, 22px)', color: 'var(--ink-dim)', lineHeight: 1.4, maxWidth: 720 }}>{item.description}</div>
        {item.href && (
          <div style={{ marginTop: 18 }}>
            <Pill accent icon={<I.ArrowUR size={12} />} href={item.href}>View project</Pill>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        <Stat label="Role" value={item.role} />
        <Stat label="Year" value={item.year} />
        <Stat label="Status" value={item.status} />
      </div>

      {cs && (
        <>
          <Section n="01" heading="Problem" accent={accent}>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--ink)' }}>{cs.problem}</p>
          </Section>

          <Section n="02" heading="Approach" accent={accent}>
            <ol style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {cs.approach.map((a, i) => (
                <li key={i} style={{ display: 'flex', gap: 16, fontSize: 15, lineHeight: 1.7 }}>
                  <span className="mono" style={{ color: accent, minWidth: 30, fontSize: 12, paddingTop: 5 }}>{String(i + 1).padStart(2, '0')}</span>
                  <span>{a}</span>
                </li>
              ))}
            </ol>
          </Section>

          <Section n="03" heading="Stack" accent={accent}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {cs.stack.map((s) => (
                <div key={s} className="mono" style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)', borderRadius: 6, fontSize: 12 }}>{s}</div>
              ))}
            </div>
          </Section>

          {cs.metrics.length > 0 && (
            <Section n="04" heading="Impact" accent={accent}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                {cs.metrics.map((m) => (
                  <div key={m.label} style={{ padding: 18, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--line)', borderRadius: 10 }}>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>{m.label}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                      <span className="mono" style={{ fontSize: 14, color: 'var(--ink-mute)', textDecoration: 'line-through' }}>{m.before}</span>
                      <I.Arrow size={12} style={{ color: accent }} />
                      <span className="mono" style={{ fontSize: 22, color: accent, fontWeight: 500 }}>{m.after}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section n="05" heading="Trade-offs" accent={accent}>
            <p className="serif" style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--ink-dim)', fontStyle: 'italic' }}>{cs.tradeoffs}</p>
          </Section>
        </>
      )}
    </div>
  );
}

function PlaybookDetail({ item }: { item: Item }) {
  const pb = item.playbookId ? PLAYBOOKS[item.playbookId] : undefined;
  if (!pb) return null;
  const accent = item.accent ?? 'var(--amber)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 16 }}>{item.label} · {item.read}</div>
        <h1 className="serif" style={{ fontSize: 'clamp(36px, 6vw, 64px)', lineHeight: 1, letterSpacing: '-0.03em', fontStyle: 'italic', marginBottom: 14 }}>{pb.title}</h1>
        <div style={{ fontSize: 'clamp(15px, 1.8vw, 20px)', color: 'var(--ink-dim)', lineHeight: 1.4 }}>{pb.subtitle}</div>
      </div>
      <div style={{ padding: 24, borderLeft: `2px solid ${accent}`, background: `color-mix(in oklch, ${accent} 12%, transparent)`, borderRadius: '0 10px 10px 0' }}>
        <div className="serif" style={{ fontSize: 17, lineHeight: 1.7, fontStyle: 'italic' }}>{pb.intro}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {pb.chapters.map((ch) => (
          <div key={ch.n}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 12 }}>
              <span className="mono" style={{ color: accent, fontSize: 13 }}>{ch.n}</span>
              <h3 style={{ fontSize: 'clamp(18px, 2.2vw, 22px)', fontWeight: 500, letterSpacing: '-0.01em' }}>{ch.heading}</h3>
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--ink)', marginLeft: 40 }}>{ch.body}</p>
            {ch.code && <div style={{ marginLeft: 40 }}><Code>{ch.code}</Code></div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ToolDetail({ item }: { item: Item }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 12 }}>{item.label} · LIVE</div>
        <h1 className="serif" style={{ fontSize: 'clamp(34px, 5vw, 52px)', lineHeight: 1, letterSpacing: '-0.02em', fontStyle: 'italic', marginBottom: 10 }}>{item.title}</h1>
        <div style={{ fontSize: 17, color: 'var(--ink-dim)' }}>{item.subtitle}</div>
      </div>
      <div style={{ flex: 1, minHeight: 480, display: 'flex', flexDirection: 'column' }}>
        <Suspense fallback={<div className="mono" style={{ color: 'var(--ink-dim)', fontSize: 12, padding: 40 }}>Loading tool…</div>}>
          {item.toolType && <ToolRenderer type={item.toolType} />}
        </Suspense>
      </div>
    </div>
  );
}

function BioDetail() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 720 }}>
      <div className="eyebrow">About // long-form</div>
      <h1 className="serif" style={{ fontSize: 'clamp(38px, 6vw, 56px)', lineHeight: 1, letterSpacing: '-0.03em', fontStyle: 'italic' }}>Hi, I'm Yash.</h1>
      <p style={{ fontSize: 18, lineHeight: 1.7 }}>
        I build AI infrastructure and production software systems. I'm the AI Agents Architect at the University of Florida's Institute of Food and Agricultural Sciences, where I lead a function I proposed myself: self-hosted, local-first AI that runs entirely on-premise, so sensitive data never has to leave the building.
      </p>
      <p style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--ink-dim)' }}>
        My focus is the part of AI everyone talks about but few have shipped end to end: open-weight LLMs, retrieval-augmented generation, vector search, and AI agents, running in production rather than in a demo. I own the full lifecycle, from hardware selection and model evaluation to evaluation-gated releases.
      </p>
      <p style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--ink-dim)' }}>
        I joined UF in March 2025 as a Software Engineer, was promoted to Lead in October 2025, and moved into the Architect role in April 2026. Before the AI work I built Blue Omics, a full-stack platform that grew to 5M+ live records and became the lab's system of record. The way I work: understand the real problem, build the simplest thing that works, measure it, iterate.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginTop: 8 }}>
        <Stat label="Based in" value="Gainesville, FL" />
        <Stat label="Role" value="AI Agents Architect, UF IFAS" />
        <Stat label="Focus" value="Local-first LLMs, RAG, agents" />
        <Stat label="Open to" value="Conversations on AI infra" />
      </div>
    </div>
  );
}

function PlaybooksIntro() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 680 }}>
      <div className="eyebrow">Playbooks // intro</div>
      <h1 className="serif" style={{ fontSize: 'clamp(36px, 6vw, 56px)', lineHeight: 1, letterSpacing: '-0.03em', fontStyle: 'italic' }}>Field notes from production.</h1>
      <p style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--ink-dim)' }}>
        These are the patterns I keep coming back to when building AI systems that have to run in production, not just demo well. Self-hosting open-weight models, making RAG actually hold up, and gating releases on evaluation instead of vibes. Open any play to read it in full.
      </p>
    </div>
  );
}

function ContactExtra() {
  return (
    <div style={{ maxWidth: 640 }}>
      <h1 className="serif" style={{ fontSize: 'clamp(38px, 6vw, 56px)', lineHeight: 1, letterSpacing: '-0.03em', fontStyle: 'italic', marginBottom: 24 }}>Fastest way to reach me.</h1>
      <p style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--ink-dim)', marginBottom: 24 }}>
        Email always works. If you're reaching out about AI infrastructure, local-first LLMs, or something you're building, tell me the problem and where you're stuck. I reply to every thoughtful message.
      </p>
      <Pill accent icon={<I.Mail size={14} />} href="mailto:yashpn62@gmail.com">yashpn62@gmail.com</Pill>
    </div>
  );
}

function kindLabel(item: Item): string {
  if (item.kind === 'project') return `Case Study // ${item.year}`;
  if (item.kind === 'playbook') return `Playbook // ${item.read || ''}`;
  if (item.kind === 'tool') return 'Tool // Live';
  return 'Detail';
}

export default function DetailView() {
  const item = useStore((s) => s.opened);
  const setOpened = useStore((s) => s.setOpened);
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpened(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, setOpened]);

  if (!item) return null;

  return (
    <div
      onClick={() => setOpened(null)}
      style={{ position: 'fixed', inset: 0, zIndex: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(16px, 3vw, 40px)', background: 'rgba(5,5,7,0.78)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', animation: 'rise-fade 220ms var(--ease-swift) both' }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={item.title ?? kindLabel(item)}
        style={{ width: 'min(1100px, 100%)', maxHeight: '90vh', background: 'var(--bg-2)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-lg)', boxShadow: '0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02) inset', overflowY: 'auto', padding: 'clamp(24px, 3vw, 40px) clamp(20px, 3vw, 48px) clamp(40px, 5vw, 64px)', animation: 'pop-in 260ms var(--ease-swift) both' }}
      >
        <div style={{ position: 'sticky', top: 'clamp(-24px, -3vw, -40px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '16px 0', marginTop: 'clamp(-24px, -3vw, -40px)', borderBottom: '1px solid var(--line)', background: 'var(--bg-2)', zIndex: 1 }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{kindLabel(item)}</div>
          <button onClick={() => setOpened(null)} aria-label="Close" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', border: '1px solid var(--line-2)', borderRadius: 999, color: 'var(--ink-dim)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em' }}>
            <I.Close size={12} /> ESC
          </button>
        </div>

        {item.kind === 'project' && <ProjectDetail item={item} />}
        {item.kind === 'playbook' && <PlaybookDetail item={item} />}
        {item.kind === 'tool' && <ToolDetail item={item} />}
        {(item.kind === 'hero' || item.kind === 'aboutHero') && <BioDetail />}
        {item.kind === 'pbHero' && <PlaybooksIntro />}
        {item.kind === 'contactHero' && <ContactExtra />}
      </div>
    </div>
  );
}
