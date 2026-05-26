import { Suspense, lazy, useEffect, useState } from 'react';
import { ISLANDS } from '@/data/content';
import { DEFAULT_DURATION } from '@/lib/transition';
import { useStore } from '@/store/useStore';
import Splash from './components/Splash';
import Stage from './components/Stage';
import CommandBar from './components/CommandBar';
import MobileView from './components/MobileView';

const DetailView = lazy(() => import('./components/DetailView'));
const Palette = lazy(() => import('./components/Palette'));

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

export default function App() {
  const booted = useStore((s) => s.booted);
  const active = useStore((s) => s.active);
  const opened = useStore((s) => s.opened);
  const paletteOpen = useStore((s) => s.paletteOpen);
  const setActive = useStore((s) => s.setActive);
  const setOpened = useStore((s) => s.setOpened);
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);

  const isMobile = useMediaQuery('(max-width: 767px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const duration = reducedMotion ? 1 : DEFAULT_DURATION;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
        if (e.key === 'Escape') el.blur();
        return;
      }
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen(!paletteOpen);
        return;
      }
      if (e.key === '/' || e.key === '`' || e.key === '~') {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (paletteOpen) return;
      if (e.key === 'Escape' && opened) {
        setOpened(null);
        return;
      }
      if (opened) return;
      const idx = ISLANDS.findIndex((i) => i.id === active);
      const n = ISLANDS.length;
      if (e.key === 'ArrowRight' || e.key === 'l') setActive(ISLANDS[(idx + 1) % n].id);
      else if (e.key === 'ArrowLeft' || e.key === 'h') setActive(ISLANDS[(idx - 1 + n) % n].id);
      else if (e.key.toLowerCase() === 'g') setActive('home');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, opened, paletteOpen, setActive, setOpened, setPaletteOpen]);

  return (
    <>
      {!booted && <Splash />}

      {booted && (
        isMobile ? (
          <MobileView />
        ) : (
          <div className="noise" style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
            <Stage duration={duration} />
            <CommandBar />
          </div>
        )
      )}

      {opened && (
        <Suspense fallback={null}>
          <DetailView />
        </Suspense>
      )}

      {paletteOpen && (
        <Suspense fallback={null}>
          <Palette />
        </Suspense>
      )}
    </>
  );
}
