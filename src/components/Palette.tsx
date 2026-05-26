// Command palette — fuzzy-searchable navigator with real actions (⌘K).
import { useEffect, useMemo, useRef, useState } from 'react';
import { CONTENT, ISLANDS, type Item } from '@/data/content';
import { I, type IconName } from '@/icons';
import { useStore } from '@/store/useStore';
import { useFocusTrap } from '@/lib/useFocusTrap';

interface Command {
  id: string;
  group: string;
  title: string;
  hint?: string;
  icon: IconName;
  action: () => void;
}

function fuzzyMatch(query: string, text: string): { score: number } | null {
  if (!query) return { score: 0 };
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  let ti = 0;
  let score = 0;
  let lastMatch = -2;
  while (qi < q.length && ti < t.length) {
    if (q[qi] === t[ti]) {
      score += ti === lastMatch + 1 ? 3 : 1;
      lastMatch = ti;
      qi++;
    }
    ti++;
  }
  if (qi < q.length) return null;
  if (t.startsWith(q)) score += 5;
  return { score };
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-block', padding: '1px 5px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--line-2)', borderRadius: 3, fontSize: 9, color: 'var(--ink)' }}>{children}</span>
  );
}

export default function Palette() {
  const setActive = useStore((s) => s.setActive);
  const setOpened = useStore((s) => s.setOpened);
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);

  const [query, setQuery] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef);

  const close = () => setPaletteOpen(false);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const all = useMemo<Command[]>(() => {
    const navIcons: Record<string, IconName> = { home: 'Home', work: 'Work', about: 'About', lab: 'Flask', playbooks: 'Book', contact: 'Mail' };
    const cmds: Command[] = [];

    ISLANDS.forEach((isl) => {
      cmds.push({ id: `nav-${isl.id}`, group: 'Navigate', title: `Go to ${isl.label}`, hint: `Island ${isl.number}`, icon: navIcons[isl.id] ?? 'Compass', action: () => { setActive(isl.id); close(); } });
    });

    const open = (p: Item) => { setActive(p.id.startsWith('work') ? 'work' : p.id.startsWith('lab') ? 'lab' : 'playbooks'); setOpened(p); close(); };

    CONTENT.work.filter((i) => i.kind === 'project').forEach((p) => {
      cmds.push({ id: `proj-${p.id}`, group: 'Projects', title: p.title ?? '', hint: p.subtitle, icon: p.icon ?? 'Cpu', action: () => open(p) });
    });
    CONTENT.lab.filter((i) => i.kind === 'tool').forEach((tl) => {
      cmds.push({ id: `tool-${tl.id}`, group: 'Tools', title: tl.title ?? '', hint: tl.subtitle, icon: tl.icon ?? 'Flask', action: () => open(tl) });
    });
    CONTENT.playbooks.filter((i) => i.kind === 'playbook').forEach((p) => {
      cmds.push({ id: `pb-${p.id}`, group: 'Playbooks', title: (p.title ?? '').replace('\n', ' '), hint: p.read, icon: p.icon ?? 'Book', action: () => open(p) });
    });

    cmds.push({ id: 'act-email', group: 'Actions', title: 'Copy email address', hint: 'yashpn62@gmail.com', icon: 'Mail', action: () => { navigator.clipboard?.writeText('yashpn62@gmail.com').catch(() => {}); close(); } });
    cmds.push({ id: 'act-mail', group: 'Actions', title: 'Send email', hint: 'opens mail client', icon: 'Mail', action: () => { window.location.href = 'mailto:yashpn62@gmail.com'; close(); } });
    cmds.push({ id: 'act-linkedin', group: 'Actions', title: 'Open LinkedIn', hint: '/in/yashrajpandeyy', icon: 'Linked', action: () => { window.open('https://www.linkedin.com/in/yashrajpandeyy', '_blank'); close(); } });
    cmds.push({ id: 'act-github', group: 'Actions', title: 'Open GitHub', hint: 'devYRPauli', icon: 'Git', action: () => { window.open('https://github.com/devYRPauli', '_blank'); close(); } });
    cmds.push({ id: 'act-resume', group: 'Actions', title: 'Open resume (PDF)', hint: 'Resume_YashRaj.pdf', icon: 'File', action: () => { window.open('/Resume_YashRaj.pdf', '_blank'); close(); } });

    return cmds;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matches = useMemo(() => {
    if (!query.trim()) return all;
    return all
      .map((c) => {
        const m1 = fuzzyMatch(query, c.title);
        const m2 = fuzzyMatch(query, c.group);
        const score = (m1 ? m1.score * 2 : 0) + (m2 ? m2.score : 0);
        return m1 || m2 ? { c, score } : null;
      })
      .filter((x): x is { c: Command; score: number } => x !== null)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.c);
  }, [query, all]);

  const groups = useMemo(() => {
    const g: Record<string, Command[]> = {};
    matches.forEach((c) => { (g[c.group] = g[c.group] || []).push(c); });
    return g;
  }, [matches]);

  useEffect(() => { setSel(0); }, [query]);
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${sel}"]`);
    if (el) (el as HTMLElement).scrollIntoView({ block: 'nearest' });
  }, [sel]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(matches.length - 1, s + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); matches[sel]?.action(); }
  };

  return (
    <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 900, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '12vh', background: 'rgba(5,5,7,0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', animation: 'rise-fade 200ms var(--ease-swift) both' }}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Command palette" onClick={(e) => e.stopPropagation()} style={{ width: 'min(640px, 92vw)', maxHeight: '70vh', display: 'flex', flexDirection: 'column', background: 'var(--glass-strong)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-lg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 30px 80px rgba(0,0,0,0.5)', overflow: 'hidden', animation: 'pop-in 220ms var(--ease-swift) both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)', padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
          <I.Search size={16} style={{ color: 'var(--ink-dim)' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search projects, tools, playbooks, actions…"
            spellCheck={false}
            autoComplete="off"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--ink)', fontFamily: 'var(--font-sans)', fontSize: 15, letterSpacing: '-0.01em' }}
          />
          <button onClick={close} style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line-2)', borderRadius: 4, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-dim)', letterSpacing: '0.08em' }}>ESC</button>
        </div>

        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {matches.length === 0 ? (
            <div style={{ padding: 'var(--s-7) var(--s-4)', textAlign: 'center', color: 'var(--ink-dim)', fontSize: 13 }}>No matches. Try "work", "regex", "email"…</div>
          ) : (
            Object.entries(groups).map(([group, items]) => (
              <div key={group} style={{ marginBottom: 'var(--s-2)' }}>
                <div className="eyebrow" style={{ padding: '8px 10px 4px', fontSize: 9 }}>{group}</div>
                {items.map((c) => {
                  const idx = matches.indexOf(c);
                  const selected = idx === sel;
                  const IconCmp = I[c.icon] ?? I.Compass;
                  return (
                    <button
                      key={c.id}
                      data-idx={idx}
                      onMouseEnter={() => setSel(idx)}
                      onClick={() => c.action()}
                      style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)', width: '100%', padding: '10px 12px', background: selected ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', borderRadius: 'var(--r-sm)', textAlign: 'left', color: 'var(--ink)', transition: 'background 100ms' }}
                    >
                      <span style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: selected ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.025)', borderRadius: 6, color: selected ? 'var(--amber)' : 'var(--ink-dim)', flexShrink: 0 }}>
                        <IconCmp size={14} />
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, display: 'block' }}>{c.title}</span>
                        {c.hint && <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>{c.hint}</span>}
                      </span>
                      {selected && <span className="mono" style={{ fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.1em', padding: '2px 6px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line-2)', borderRadius: 4 }}>↵</span>}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderTop: '1px solid var(--line)', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-dim)', letterSpacing: '0.08em' }}>
          <span>{matches.length} result{matches.length === 1 ? '' : 's'}</span>
          <span style={{ display: 'flex', gap: 'var(--s-3)' }}>
            <span><Kbd>↑↓</Kbd> navigate</span>
            <span><Kbd>↵</Kbd> select</span>
            <span><Kbd>esc</Kbd> close</span>
          </span>
        </div>
      </div>
    </div>
  );
}
