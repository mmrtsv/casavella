// Hash routes, so the single page works on any path and reloads keep the page. The address holds the page and its tab
// (#/social/calendar, #/stays/prices, #/restaurant/paid), so a link, a reload or Pregunta lands on the exact tab
import { useSyncExternalStore } from 'react';
import { leave } from './guard';
export type Page = 'home' | 'bookings' | 'restaurant' | 'stays' | 'social' | 'analytics' | 'chat';
export const PAGES: Page[] = ['home', 'bookings', 'restaurant', 'stays', 'social', 'analytics', 'chat'];
// Calendari is a tab of Reserves, Preus and Normes of Allotjaments, Correus of Xarxes socials; their old addresses open those tabs
const ALIAS: Record<string, [Page, string]> = { calendar: ['bookings', 'calendar'], prices: ['stays', 'prices'], rules: ['stays', 'rules'], emails: ['social', 'emails'] };
// A link may also carry what to open on the page (#/restaurant/paid?paid=2026-10-31): lib/ui.ts reads it once, at start.
// ?tab= is how older emails gave the tab (#/social?tab=plan); it still works
const hashParts = () => {
  const [path, q = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const [p = '', t = ''] = path.split('/').map(s => decodeURIComponent(s));
  return { p, t, q: new URLSearchParams(q) };
};
const fromHash = (): { p: Page; t: string } | null => {
  const { p, t, q } = hashParts(), a = ALIAS[p];
  if (a) return { p: a[0], t: a[1] };
  return PAGES.includes(p as Page) ? { p: p as Page, t: t || q.get('tab') || '' } : null;
};
export const startParams = hashParts().q;
// Opening Maite starts at Inici; a link or a reload keeps the page and the tab in the address
const first = fromHash();
let current: Page = first?.p || 'home', tab = first?.t || '';
const subs = new Set<() => void>();
const notify = () => subs.forEach(f => f());
const write = () => { const h = '#/' + current + (tab ? '/' + tab : ''); if (location.hash !== h) history.replaceState(null, '', h); };
function show(p: Page, t = '') { current = p; tab = t; write(); notify(); }
// Old addresses (#/calendar, ?tab=) become the new ones; startParams above already has the query
if (first) write();
// A link changes the hash first; with unsaved changes the hash goes back until they are saved or discarded
addEventListener('hashchange', () => {
  const h = fromHash();
  if (!h || (h.p === current && (!h.t || h.t === tab))) { write(); return; }
  write();
  leave(() => show(h.p, h.t));
});
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const usePage = () => useSyncExternalStore(subscribe, () => current);
// Opens a page, on a tab when given; the same page with another tab just changes the tab
export function go(p: Page, t = '') {
  if (p === current && (!t || t === tab)) return;
  leave(() => show(p, t));
}
// A page's tab, kept in the address: one the page doesn't have (or none) gives the fallback. Changing it doesn't ask about
// unsaved changes; pages that need that wrap the setter in leave()
export function useTab<T extends string>(tabs: readonly T[], fallback: T): [T, (t: T) => void] {
  const t = useSyncExternalStore(subscribe, () => tab);
  const set = (n: T) => { if (n === tab) return; tab = n; write(); notify(); };
  return [tabs.includes(t as T) ? t as T : fallback, set];
}
