// Which window is open (client file, new booking, close dates, cancel, command palette) and the toasts
import { useSyncExternalStore } from 'react';

export interface BookDraft { stay?: string; first?: string; until?: string }
export interface BlockDraft { stays?: string[]; first?: string; until?: string }
interface UI {
  detail: string | null; book: BookDraft | null; block: BlockDraft | null; cancel: string | null; palette: boolean;
}
let ui: UI = { detail: null, book: null, block: null, cancel: null, palette: false };
const subs = new Set<() => void>();
const set = (p: Partial<UI>) => { ui = { ...ui, ...p }; subs.forEach(f => f()); };
export const useUI = <T,>(pick: (u: UI) => T) => useSyncExternalStore(f => { subs.add(f); return () => { subs.delete(f); }; }, () => pick(ui));
export const openDetail = (key: string) => set({ detail: key });
export const closeDetail = () => set({ detail: null });
export const openBook = (d: BookDraft = {}) => set({ book: d });
export const closeBook = () => set({ book: null });
export const openBlock = (d: BlockDraft = {}) => set({ block: d });
export const closeBlock = () => set({ block: null });
export const openCancel = (key: string) => set({ cancel: key, detail: null });
export const closeCancel = () => set({ cancel: null });
export const setPalette = (palette: boolean) => set({ palette });
export const getPalette = () => ui.palette;
