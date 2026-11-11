// Hash routes, so the single page works on any path and reloads keep the page
import { useSyncExternalStore } from 'react';
import { leave } from './guard';
export type Page = 'home' | 'bookings' | 'restaurant' | 'stays' | 'social' | 'analytics' | 'chat';
export const PAGES: Page[] = ['home', 'bookings', 'restaurant', 'stays', 'social', 'analytics', 'chat'];
// Calendari is a tab of Reserves, Preus and Normes of Allotjaments, Correus of Xarxes socials; their old addresses open those tabs
const ALIAS: Record<string, [Page, string]> = { calendar: ['bookings', 'calendar'], prices: ['stays', 'prices'], rules: ['stays', 'rules'], emails: ['social', 'emails'] };
let aliasTab = '';
// Kept until the page changes, so a page that mounts twice while loading still gets it
export function takeAliasTab() { return aliasTab; }
// A link may carry what to open on the page (#/restaurant?paid=2026-10-31): lib/ui.ts reads it once, at start
const hashParts = () => { const [p, q = ''] = location.hash.replace(/^#\/?/, '').split('?'); return { p: p as Page, q: new URLSearchParams(q) }; };
const fromHash = (): Page | null => {
  const { p } = hashParts(), a = ALIAS[p];
  if (a) { aliasTab = a[1]; if (a[0] === 'social') try { localStorage.setItem('maite-social-tab', a[1]); } catch { /* private window */ } return a[0]; }
  return PAGES.includes(p) ? p : null;
};
export const startParams = hashParts().q;
const initial = (): Page => {
  // Opening Maite starts at Inici; a link or a reload keeps the page in the address
  return fromHash() || 'home';
};
let current = initial();
const subs = new Set<() => void>();
function show(p: Page) {
  current = p; aliasTab = '';
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
