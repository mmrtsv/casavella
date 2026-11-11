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
export function openBookings(filter: string) { bookingsFilter = filter; go('bookings'); }
export function takeBookingsFilter() { const f = bookingsFilter; bookingsFilter = ''; return f; }

// Calendari opens Restaurant on a day, and Inici on Cobrat on a day with tables to note; the page takes them once, when it opens
let restaurantDay = '', restaurantTab = '', restaurantMenu = '';
export function openRestaurant(date: string, tab: 'tables' | 'paid' = 'tables') { restaurantDay = date; restaurantTab = tab; go('restaurant'); }
export function takeRestaurantDay() { const d = restaurantDay; restaurantDay = ''; return d; }
export function takeRestaurantTab() { const t = restaurantTab; restaurantTab = ''; return t; }
// Publicar opens a menu's post in Restaurant › Menús, where menus are made and changed
export function openRestaurantMenu(id: string) { restaurantMenu = id; restaurantTab = 'menus'; go('restaurant'); }
export function takeRestaurantMenu() { const m = restaurantMenu; restaurantMenu = ''; return m; }

// Preus, Allotjaments and Analítica can open on a tab; the page takes it once, when it opens
let pricesTab = '', analyticsTab = '', staysTab = '';
export function takeStaysTab() { const t = staysTab; staysTab = ''; return t; }
export function takePricesTab() { const t = pricesTab; pricesTab = ''; return t; }
export function takeAnalyticsTab() { const t = analyticsTab; analyticsTab = ''; return t; }

// A page, the tab on it and the thing to open there, as Pregunta's proposals give them (lib/chat.js). The page opens fresh from
// Pregunta, so each page takes what it needs when it opens: Xarxes socials its tab; Restaurant its tab, and a day (Taules, Cobrat)
// or a menu (Menús); Reserves a filter or one booking (stay|id); Preus and Analítica their tab
export function openAt(page: Page, tab = '', item = '') {
  if (page === 'social' && tab) try { localStorage.setItem('maite-social-tab', tab); } catch { /* private window */ }
  if (page === 'restaurant') { if (tab === 'menus') return openRestaurantMenu(item); restaurantTab = tab; restaurantDay = item; }
  if (page === 'bookings') { if (tab) bookingsFilter = tab; if (item) openDetail(item); }
  if (page === 'prices') pricesTab = tab;
  if (page === 'stays') staysTab = tab;
  if (page === 'analytics') analyticsTab = tab;
  go(page);
}

// Links from the weekly summary email (lib/weekly.js) open the thing to do: #/restaurant?paid=2026-10-31 (Cobrat on that day),
// #/bookings?open=<stay|id> (that booking), #/bookings?filter=todo and #/social?tab=plan
{
  const q = startParams, paid = q.get('paid'), open = q.get('open'), filter = q.get('filter'), tab = q.get('tab');
  if (paid) openRestaurant(paid, 'paid');
  if (open) openDetail(open);
  if (filter) openBookings(filter);
  if (tab) try { localStorage.setItem('maite-social-tab', tab); } catch { /* private window */ }
}
