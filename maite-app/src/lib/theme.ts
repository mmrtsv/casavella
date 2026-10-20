// Dark first; the choice is remembered on this device
import { useSyncExternalStore } from 'react';
type Theme = 'dark' | 'light';
const subs = new Set<() => void>();
const read = (): Theme => (document.documentElement.classList.contains('light') ? 'light' : 'dark');
export const useTheme = () => useSyncExternalStore(f => { subs.add(f); return () => { subs.delete(f); }; }, read);
export function setTheme(t: Theme) {
  const el = document.documentElement;
  el.classList.remove('light', 'dark'); el.classList.add(t); el.dataset.theme = t;
  try { localStorage.setItem('maite-theme', t); } catch (e) {}
  subs.forEach(f => f());
}
