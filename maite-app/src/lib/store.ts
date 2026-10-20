// One shared store for what Maite reads: stays, settings, calendar entries (loaded by date windows and merged by id)
import { useSyncExternalStore } from 'react';
import { api, setStayNames, type ApiError } from './api';
import { addDays, TODAY } from './dates';
import type { Booking, Settings, Stay, Content } from './types';

interface State {
  stays: Stay[]; settings: Settings | null; bookings: Map<string, Booking>; user: string;
  notice: string; ready: boolean; error: string; content: Content | null; version: number;
}
let state: State = { stays: [], settings: null, bookings: new Map(), user: '', notice: '', ready: false, error: '', content: null, version: 0 };
let loaded: [string, string][] = [];
const subs = new Set<() => void>();
const emit = (patch: Partial<State>) => { state = { ...state, ...patch, version: state.version + 1 }; subs.forEach(f => f()); };
export const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const getState = () => state;
export function useStore<T>(pick: (s: State) => T): T { return useSyncExternalStore(subscribe, () => pick(state)); }

export const keyOf = (b: Pick<Booking, 'stay' | 'id'>) => b.stay + '|' + b.id;
export const stayName = (id: string) => state.stays.find(s => s.id === id)?.name || id;
export const shortName = (id: string) => state.stays.find(s => s.id === id)?.short || stayName(id);
setStayNames(stayName);

export async function load(from: string, to: string) {
  const d = await api<{ user: string; stays: Stay[]; bookings: Booking[]; errors: { stay: string; error: string }[] }>(`bookings?from=${from}&to=${to}`);
  const map = new Map(state.bookings);
  for (const [k, b] of map) if (b.first < to && b.until > from) map.delete(k);
  for (const b of d.bookings) map.set(keyOf(b), b);
  loaded.push([from, to]);
  const names = (ids: string[]) => ids.map(id => d.stays.find(s => s.id === id)?.name || id);
  const off = names(d.errors.filter(e => e.error === 'not_configured').map(e => e.stay));
  const bad = d.errors.filter(e => e.error !== 'not_configured').map(e => `${names([e.stay])[0]} (${e.error})`);
  emit({ stays: d.stays, user: d.user, bookings: map, notice: [off.length && `Calendari no connectat: ${off.join(', ')}.`, bad.length && `No s'ha pogut llegir: ${bad.join(', ')}.`].filter(Boolean).join(' ') });
}
const covered = (from: string, to: string) => loaded.some(([a, b]) => a <= from && b >= to);
export async function ensure(from: string, to: string) { if (!covered(from, to)) await load(from, to); }
let extra: [string, string] | null = null;
export async function reload(window?: [string, string]) {
  if (window) extra = window;
  // A busy moment at Google or Cloudflare (often right after a save) gets one more try before it shows
  for (let attempt = 0; ; attempt++) {
    loaded = [];
    try {
      const settings = await api<Settings>('settings');
      emit({ settings });
      await load(addDays(TODAY, -120), addDays(TODAY, 280));
      if (extra && !covered(...extra)) await load(...extra);
      return emit({ ready: true, error: '' });
    } catch (e) {
      if (attempt < 1 && (e as ApiError).code !== 'access') { await new Promise(r => setTimeout(r, 1200)); continue; }
      return emit({ ready: true, error: (e as Error).message });
    }
  }
}
export const setBooking = (b: Booking) => { const map = new Map(state.bookings); map.set(keyOf(b), b); emit({ bookings: map }); };
export const setSettings = (settings: Settings) => emit({ settings });
export const setStays = (stays: Stay[]) => emit({ stays });
export async function loadContent() { if (!state.content) emit({ content: await api<Content>('stays') }); return state.content!; }
export const setContent = (content: Content) => emit({ content });
export const allBookings = () => [...state.bookings.values()];
