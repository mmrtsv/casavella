// Maite: loads the data once, shows the page in the frame, and keeps the windows (client file, forms, palette) mounted
import { lazy, Suspense, useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Shell } from './shell/Shell';
import { usePage, type Page } from './lib/route';
import { reload, useStore } from './lib/store';
import { setPalette, useUI, getPalette } from './lib/ui';
import { Calendar, CalendarActions } from './pages/Calendar';
import Home from './pages/Home';

const Bookings = lazy(() => import('./pages/Bookings'));
const Prices = lazy(() => import('./pages/Prices'));
const Discounts = lazy(() => import('./pages/Discounts'));
const Rules = lazy(() => import('./pages/Rules'));
const Stays = lazy(() => import('./pages/Stays'));
const Emails = lazy(() => import('./pages/Emails'));
const Windows = lazy(() => import('./windows/Windows'));
const Palette = lazy(() => import('./shell/Palette'));
const Toasts = lazy(() => import('./parts/Toasts'));

const TITLES: Record<Page, string> = { home: 'Inici', calendar: 'Calendari', bookings: 'Reserves', prices: 'Preus', discounts: 'Descomptes', rules: 'Normes', stays: 'Allotjaments', emails: 'Correus' };

// Placeholder with the page's final footprint, so nothing jumps when data arrives
function Loading() {
  return (
    <div aria-busy="true" aria-label="Carregant" className="animate-pulse motion-reduce:animate-none">
      <div className="mb-4 h-9 w-64 rounded-xl bg-default" />
      <div className="h-[380px] w-full rounded-2xl bg-default/70" />
    </div>
  );
}

export function App() {
  const page = usePage();
  const ready = useStore(s => s.ready);
  const error = useStore(s => s.error);
  const notice = useStore(s => s.notice);
  useEffect(() => { reload(); }, []);
  // Cmd/Ctrl+K opens the palette; the palette's code loads the first time it is needed
  const palette = useUI(u => u.palette);
  const [paletteUsed, setPaletteUsed] = useState(false);
  useEffect(() => { if (palette) setPaletteUsed(true); }, [palette]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette(!getPalette()); } };
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }, []);
  useEffect(() => { document.title = `${TITLES[page]} (Maite)`; }, [page]);
  return (
    <>
      <Shell title={TITLES[page]} actions={page === 'calendar' ? <CalendarActions /> : undefined} onSearch={() => setPalette(true)}>
        {(error || notice) && (
          <div role="alert" className={`mb-4 flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ring-1 ${error ? 'bg-danger/10 text-danger ring-danger/30' : 'bg-warning/10 ring-warning/30'}`}>
            <TriangleAlert size={18} className="mt-px shrink-0" aria-hidden="true" /><span>{error || notice}</span>
          </div>
        )}
        {!ready ? <Loading /> : (
          <Suspense fallback={<Loading />}>
            {page === 'home' && <Home />}
            {page === 'calendar' && <Calendar />}
            {page === 'bookings' && <Bookings />}
            {page === 'prices' && <Prices />}
            {page === 'discounts' && <Discounts />}
            {page === 'rules' && <Rules />}
            {page === 'stays' && <Stays />}
            {page === 'emails' && <Emails />}
          </Suspense>
        )}
      </Shell>
      {paletteUsed && <Suspense fallback={null}><Palette /></Suspense>}
      {ready && <Suspense fallback={null}><Windows /><Toasts /></Suspense>}
    </>
  );
}
