// Which window is open (client file, new booking, close dates, cancel, command palette) and the toasts
import { useSyncExternalStore } from 'react';
import { go, startParams, type Page } from './route';

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

// Inici can open Reserves on a filter ("Per fer"); the page takes it once, when it opens
let bookingsFilter = '';
export function openBookings(filter: string) { bookingsFilter = filter; go('bookings', 'list'); }
export function takeBookingsFilter() { const f = bookingsFilter; bookingsFilter = ''; return f; }

// Calendari opens Restaurant on a day, and Inici on Cobrat on a day with tables to note; the page takes them once, when it opens
let restaurantDay = '', restaurantMenu = '';
export function openRestaurant(date: string, tab: 'tables' | 'paid' = 'tables') { restaurantDay = date; go('restaurant', tab); }
export function takeRestaurantDay() { const d = restaurantDay; restaurantDay = ''; return d; }
// Publicar opens a menu's post in Restaurant › Menús, where menus are made and changed
export function openRestaurantMenu(id: string) { restaurantMenu = id; go('restaurant', 'menus'); }
export function takeRestaurantMenu() { const m = restaurantMenu; restaurantMenu = ''; return m; }

// Preus (inside Allotjaments) can open on its own tab; it takes it once, when it opens
let pricesTab = '';
export function takePricesTab() { const t = pricesTab; pricesTab = ''; return t; }

// A page, the tab on it and the thing to open there, as Pregunta's proposals give them (lib/chat.js). The tab goes in the
// address (lib/route.ts); what to open there each page takes when it opens: Restaurant a day (Taules, Cobrat) or a menu
// (Menús); Reserves a filter or one booking (stay|id); Preus its own tab
export function openAt(page: Page | 'prices' | 'calendar', tab = '', item = '') {
  // Preus is a tab of Allotjaments, Calendari one of Reserves
  if (page === 'prices') { pricesTab = tab; return go('stays', 'prices'); }
  if (page === 'calendar') return go('bookings', 'calendar');
  if (page === 'restaurant') { if (tab === 'menus') return openRestaurantMenu(item); restaurantDay = item; }
  if (page === 'bookings') {
    if (item) openDetail(item);
    if (tab && tab !== 'calendar' && tab !== 'list') { bookingsFilter = tab; return go('bookings', 'list'); }
  }
  if (page === 'stays' && tab === 'prices') pricesTab = item;
  go(page, tab);
}

// Links from the weekly summary email (lib/weekly.js) open the thing to do: #/restaurant?paid=2026-10-31 (Cobrat on that day),
// #/bookings?open=<stay|id> (that booking), #/bookings/list?filter=todo and #/social/plan (the tab is lib/route.ts's)
{
  const q = startParams, paid = q.get('paid'), open = q.get('open'), filter = q.get('filter');
  if (paid) openRestaurant(paid, 'paid');
  if (open) openDetail(open);
  if (filter) openBookings(filter);
}
