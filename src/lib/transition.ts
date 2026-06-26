// Camera-between-islands transition orchestrator.
//
// A phase machine (leaving -> travelling -> entering -> idle) driven by timers,
// with a single RAF loop interpolating `t` (0..1) within the active phase so React
// always sees fresh values. Pure helpers compute the stage transform (pan-zoom) and
// per-card entry styles (slide-from-edge). No animation library required.
import { useEffect, useRef, useState } from 'react';
import { ISLAND_BY_ID, type IslandId } from '@/data/content';

export type Phase = 'idle' | 'leaving' | 'travelling' | 'entering';

export interface TravelVector { dx: number; dy: number; dist: number; angle: number; }
export interface StageStyle { transform: string; opacity: number; filter: string; }
export interface AreaRect { row: number; col: number; rows: number; cols: number; }
export interface CardStyle { opacity: number; transform: string; }

export const DEFAULT_DURATION = 1000;

export function travelVector(fromId: string, toId: string): TravelVector {
  const a = ISLAND_BY_ID[fromId];
  const b = ISLAND_BY_ID[toId];
  if (!a || !b) return { dx: 1, dy: 0, dist: 0, angle: 0 };
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1;
  return { dx: dx / dist, dy: dy / dist, dist, angle: Math.atan2(dy, dx) };
}

const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInCubic = (x: number) => x * x * x;
export const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const easeOutBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

export interface TransitionState {
  renderingId: IslandId;
  phase: Phase;
  t: number;
  prevIsland: IslandId;
  nextIsland: IslandId;
}

export function useIslandTransition(
  activeIsland: IslandId,
  duration: number = DEFAULT_DURATION,
): TransitionState {
  const [renderingId, setRenderingId] = useState<IslandId>(activeIsland);
  const [prevIsland, setPrevIsland] = useState<IslandId>(activeIsland);
  const [phase, setPhase] = useState<Phase>('idle');
  const [t, setT] = useState(0);

  const rafRef = useRef<number | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastActiveRef = useRef<IslandId>(activeIsland);

  useEffect(() => {
    if (lastActiveRef.current === activeIsland) return;
    const from = lastActiveRef.current;
    const to = activeIsland;
    lastActiveRef.current = to;

    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    setPrevIsland(from);

    const leaveDur = duration * 0.18;
    const travelDur = duration * 0.55;
    const enterDur = duration * 0.27;
    const leaveEnd = leaveDur;
    const travelEnd = leaveEnd + travelDur;
    const enterEnd = travelEnd + enterDur;

    const start = performance.now();
    setPhase('leaving');
    setT(0);

    timersRef.current.push(
      setTimeout(() => {
        setRenderingId(to);
        setPhase('travelling');
      }, leaveEnd),
    );
    timersRef.current.push(
      setTimeout(() => {
        setPhase('entering');
      }, travelEnd),
    );
    timersRef.current.push(
      setTimeout(() => {
        setPhase('idle');
        setT(0);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }, enterEnd + 16),
    );

    const tick = (now: number) => {
      const elapsed = now - start;
      if (elapsed < leaveEnd) {
        setT(elapsed / leaveDur);
      } else if (elapsed < travelEnd) {
        setT((elapsed - leaveEnd) / travelDur);
      } else if (elapsed < enterEnd) {
        setT((elapsed - travelEnd) / enterDur);
      } else {
        rafRef.current = null;
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [activeIsland, duration]);

  useEffect(
    () => () => {
      timersRef.current.forEach((id) => clearTimeout(id));
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  return { renderingId, phase, t, prevIsland, nextIsland: activeIsland };
}

// Outer stage transform - pan-zoom: blur + slide out toward travel direction, slide in.
const TRAVEL = 18; // vw/vh shift at peak

export function getStageTransform(phase: Phase, t: number, dir: TravelVector): StageStyle {
  if (phase === 'idle') return { transform: 'translate3d(0,0,0) scale(1)', opacity: 1, filter: 'none' };
  const { dx, dy } = dir;

  if (phase === 'leaving') {
    const k = easeInCubic(t);
    return {
      transform: `translate3d(${-dx * TRAVEL * k}vw, ${-dy * TRAVEL * k}vh, 0) scale(${1 - 0.04 * k})`,
      opacity: 1 - 0.6 * k,
      filter: `blur(${k * 4}px)`,
    };
  }
  if (phase === 'travelling') {
    return { transform: `translate3d(${-dx * TRAVEL}vw, ${-dy * TRAVEL}vh, 0) scale(0.96)`, opacity: 0, filter: 'blur(4px)' };
  }
  // entering
  const k = easeOutCubic(t);
  return {
    transform: `translate3d(${dx * TRAVEL * (1 - k)}vw, ${dy * TRAVEL * (1 - k)}vh, 0) scale(${0.96 + 0.04 * k})`,
    opacity: 0.4 + 0.6 * k,
    filter: `blur(${(1 - k) * 4}px)`,
  };
}

// Per-card entry choreography - slide in from nearest screen edge with overshoot.
export function getCardEntryStyle(
  i: number,
  total: number,
  phase: Phase,
  t: number,
  areaRect: AreaRect | null,
): CardStyle | null {
  if (phase !== 'entering') {
    if (phase === 'idle') return null; // card uses its own resting state
    return { opacity: 1, transform: 'translate3d(0,0,0) scale(1)' };
  }

  const stagger = (i / Math.max(1, total - 1)) * 0.5;
  const local = Math.max(0, Math.min(1, (t - stagger) / (1 - stagger || 1)));

  const { row = 1, col = 1, rows = 3, cols = 4 } = areaRect || ({} as AreaRect);
  const fromTop = row <= 1;
  const fromBottom = row >= rows;
  const fromLeft = col <= 1;
  const fromRight = col >= cols;
  let tx = 0;
  let ty = 0;
  const D = 80;
  if (fromTop) ty = -D;
  else if (fromBottom) ty = D;
  if (fromLeft) tx = -D;
  else if (fromRight) tx = D;
  if (tx === 0 && ty === 0) ty = D * 0.6; // interior cards drift up from below
  const k = easeOutBack(local);
  return {
    opacity: local,
    transform: `translate3d(${tx * (1 - k)}px, ${ty * (1 - k)}px, 0) scale(${0.9 + 0.1 * easeOutCubic(local)})`,
  };
}
