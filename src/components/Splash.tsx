// Boot splash — cycles a few greetings, then reveals the app.
import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';

const GREETINGS = ['Hello', 'Bonjour', 'नमस्ते', 'Welcome'];

export default function Splash() {
  const setBooted = useStore((s) => s.setBooted);
  const [i, setI] = useState(0);
  const [exit, setExit] = useState(false);

  useEffect(() => {
    if (i < GREETINGS.length - 1) {
      const id = setTimeout(() => setI(i + 1), 240);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => {
      setExit(true);
      setTimeout(() => setBooted(true), 400);
    }, 400);
    return () => clearTimeout(id);
  }, [i, setBooted]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: exit ? 0 : 1,
        transition: 'opacity 380ms var(--ease-swift)',
        pointerEvents: exit ? 'none' : 'auto',
      }}
    >
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.3 }} />
      <div style={{ position: 'absolute', top: 24, left: 24, fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.16em', fontFamily: 'var(--font-mono)' }}>YRP // PORTFOLIO</div>
      <div style={{ position: 'absolute', bottom: 24, left: 24, display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.16em', fontFamily: 'var(--font-mono)' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber)' }} />
        BOOTING · {i + 1}/{GREETINGS.length}
      </div>
      <div className="serif" key={i} style={{ fontSize: 'clamp(56px, 8vw, 96px)', lineHeight: 1, fontStyle: 'italic', letterSpacing: '-0.03em', animation: 'rise-fade 240ms var(--ease-swift) both' }}>
        {GREETINGS[i]}.
      </div>
    </div>
  );
}
