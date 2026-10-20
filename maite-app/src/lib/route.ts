// Hash routes, so the single page works on any path and reloads keep the page
import { useSyncExternalStore } from 'react';
export type Page = 'calendar' | 'bookings' | 'prices' | 'discounts' | 'rules' | 'stays';
export const PAGES: Page[] = ['calendar', 'bookings', 'prices', 'discounts', 'rules', 'stays'];
const read = (): Page => {
  const h = location.hash.replace(/^#\/?/, '') as Page;
  if (PAGES.includes(h)) return h;
  try { const saved = localStorage.getItem('maite-page') as Page; if (PAGES.includes(saved)) return saved; } catch (e) {}
  return 'calendar';
};
const sub = (f: () => void) => { addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); };
export const usePage = () => useSyncExternalStore(sub, read);
export function go(p: Page) {
  try { localStorage.setItem('maite-page', p); } catch (e) {}
  if (read() !== p || location.hash !== '#/' + p) location.hash = '/' + p;
}
