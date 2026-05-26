import { create } from 'zustand';
import type { IslandId, Item } from '@/data/content';

interface AppState {
  booted: boolean;
  active: IslandId;
  opened: Item | null;
  paletteOpen: boolean;
  setBooted: (v: boolean) => void;
  setActive: (id: IslandId) => void;
  setOpened: (item: Item | null) => void;
  setPaletteOpen: (v: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  booted: false,
  active: 'home',
  opened: null,
  paletteOpen: false,
  setBooted: (booted) => set({ booted }),
  setActive: (active) => set({ active }),
  setOpened: (opened) => set({ opened }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
}));
