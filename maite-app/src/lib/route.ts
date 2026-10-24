// Hash routes, so the single page works on any path and reloads keep the page
import { useSyncExternalStore } from 'react';
import { leave } from './guard';
export type Page = 'home' | 'calendar' | 'bookings' | 'restaurant' | 'prices' | 'rules' | 'stays' | 'emails' | 'social';
export const PAGES: Page[] = ['home', 'calendar', 'bookings', 'restaurant', 'prices', 'rules', 'stays', 'emails', 'social'];
const fromHash = (): Page | null => { const h = location.hash.replace(/^#\/?/, '') as Page; return PAGES.includes(h) ? h : null; };
const initial = (): Page => {
  // Opening Maite starts at Inici; a link or a reload keeps the page in the address
  return fromHash() || 'home';
};
let current = initial();
const subs = new Set<() => void>();
function show(p: Page) {
  current = p;
  if (location.hash !== '#/' + p) history.replaceState(null, '', '#/' + p);
  subs.forEach(f => f());
}
// A link changes the hash first; with unsaved changes the hash goes back until they are saved or discarded
addEventListener('hashchange', () => {
  const p = fromHash();
  if (!p || p === current) return;
  history.replaceState(null, '', '#/' + current);
  leave(() => show(p));
});
export const usePage = () => useSyncExternalStore(f => { subs.add(f); return () => { subs.delete(f); }; }, () => current);
export function go(p: Page) {
  if (p === current) return;
  leave(() => show(p));
}
