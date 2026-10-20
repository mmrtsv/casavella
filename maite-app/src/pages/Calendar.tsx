// Calendar: one row per stay, one column per night, three weeks from two days before the chosen day.
// Tap the first night and then the last one to close dates or add a booking; tap a booking to open its file.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@heroui/react';
import { ChevronLeft, ChevronRight, Lock, Plus, X } from 'lucide-react';
import { addDays, day, nightsBetween, nitsTxt, parse, range, TODAY, euro } from '../lib/dates';
import { ensure, keyOf, shortName, useStore } from '../lib/store';
import { openBlock, openBook, openDetail } from '../lib/ui';
import { who } from '../lib/words';
import type { Booking } from '../lib/types';
import { toastError } from '../parts/toast';

const SPAN = 21, STEP = 14;
type Sel = { stay: string; a: string; b?: string } | null;

const tone: Record<string, string> = {
  paid: 'bg-[color-mix(in_oklab,var(--brand-sage)_26%,transparent)] text-foreground',
  settled: 'bg-[color-mix(in_oklab,var(--brand-sage)_26%,transparent)] text-foreground',
  pending: 'bg-warning/20 text-foreground', manual: 'bg-warning/20 text-foreground',
  block: 'bg-default text-muted', other: 'bg-[color-mix(in_oklab,var(--brand-cava)_22%,transparent)] text-foreground',
};
const bar: Record<string, string> = { paid: 'bg-accent', settled: 'bg-accent', pending: 'bg-warning', manual: 'bg-warning', block: 'bg-muted/60', other: 'bg-[var(--brand-cava)]' };

export function CalendarActions() {
  return (
    <>
      <Button variant="secondary" size="sm" onPress={() => openBlock()}><Lock size={15} />Tancar dates</Button>
      <Button size="sm" onPress={() => openBook()}><Plus size={16} />Nova reserva</Button>
    </>
  );
}

export function Calendar() {
  const stays = useStore(s => s.stays);
  const bookingsMap = useStore(s => s.bookings);
  const [from, setFrom] = useState(() => addDays(TODAY, -2));
  const [sel, setSel] = useState<Sel>(null);
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const to = addDays(from, SPAN), last = addDays(to, -1);
  const days = useMemo(() => Array.from({ length: SPAN }, (_, i) => addDays(from, i)), [from]);
  const bookings = useMemo(() => [...bookingsMap.values()].filter(b => b.blocks && b.first < to && b.until > from), [bookingsMap, from, to]);
  const busyNight = (stay: string, d: string) => bookings.some(b => b.stay === stay && b.first <= d && b.until > d);

  async function move(next: string) {
    setFrom(next); setSel(null); setBusy(true);
    try { await ensure(next, addDays(next, SPAN)); } catch (e) { toastError(e); }
    setBusy(false);
  }
  // Phones: open with today in view
  useEffect(() => {
    const el = scroller.current, col = el?.querySelector<HTMLElement>('[data-today]');
    if (el && col) el.scrollLeft = Math.max(0, col.offsetLeft - 120 - col.offsetWidth);
  }, [from, stays.length]);

  function pick(stay: string, d: string) {
    if (d < TODAY || busyNight(stay, d)) return;
    if (!sel || sel.stay !== stay || sel.b || d < sel.a) return setSel({ stay, a: d });
    let b = sel.a; // stop at the first taken night
    while (b < d && !busyNight(stay, addDays(b, 1))) b = addDays(b, 1);
    setSel({ ...sel, b });
  }
  const selUntil = sel ? addDays(sel.b || sel.a, 1) : '';
  const sameYear = from.slice(0, 4) === last.slice(0, 4);

  return (
    <div className="fade-in">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="mr-auto text-2xl font-semibold tracking-tight tnum sm:text-[28px]">
          {day(from, { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) })} – {day(last, { day: 'numeric', month: 'short', year: 'numeric' })}
        </h2>
        <div className="flex items-center gap-1 rounded-full bg-default/70 p-1">
          <Button isIconOnly size="sm" variant="ghost" aria-label="Dues setmanes enrere" onPress={() => move(addDays(from, -STEP))}><ChevronLeft size={18} /></Button>
          <Button size="sm" variant="ghost" onPress={() => move(addDays(TODAY, -2))}>Avui</Button>
          <Button isIconOnly size="sm" variant="ghost" aria-label="Dues setmanes endavant" onPress={() => move(addDays(from, STEP))}><ChevronRight size={18} /></Button>
        </div>
      </div>

      <div ref={scroller} className={`overflow-x-auto rounded-3xl border border-border bg-surface shadow-[var(--surface-shadow)] transition-opacity ${busy ? 'opacity-60' : ''}`}>
        <div role="grid" aria-label="Ocupació" className="grid min-w-max" style={{ gridTemplateColumns: `minmax(104px,140px) repeat(${SPAN}, minmax(48px, 1fr))` }}>
          <div role="row" className="contents">
            <div role="columnheader" className="sticky left-0 z-20 border-b border-separator bg-surface" />
            {days.map(d => {
              const dt = parse(d), we = dt.getDay() === 0 || dt.getDay() === 6, today = d === TODAY;
              return (
                <div key={d} role="columnheader" data-today={today || undefined} className={`border-b border-separator py-2.5 text-center ${we ? 'bg-default/40' : ''}`}>
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted">{dt.toLocaleDateString('ca-ES', { weekday: 'short' }).replace('.', '')}</div>
                  <div className={`mx-auto mt-1 grid size-7 place-items-center rounded-full text-sm font-semibold tnum ${today ? 'bg-accent text-accent-foreground' : ''}`}>{dt.getDate()}</div>
                </div>
              );
            })}
          </div>
          {stays.map((s, r) => (
            <div role="row" key={s.id} className="contents">
              <div role="rowheader" className="sticky left-0 z-10 flex items-center border-b border-separator bg-surface px-4 text-sm font-semibold" style={{ gridRow: r + 2, gridColumn: 1 }}>{shortName(s.id)}</div>
              {days.map((d, i) => {
                const dt = parse(d), we = dt.getDay() === 0 || dt.getDay() === 6, past = d < TODAY;
                const inSel = sel && sel.stay === s.id && d >= sel.a && d <= (sel.b || sel.a);
                return (
                  <div key={d} role="gridcell" aria-selected={!!inSel} style={{ gridRow: r + 2, gridColumn: i + 2 }}
                    tabIndex={past ? -1 : 0} aria-label={`${s.name}, ${day(d, { weekday: 'long', day: 'numeric', month: 'long' })}`}
                    onClick={() => pick(s.id, d)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(s.id, d); } }}
                    className={`h-[72px] border-b border-l border-separator outline-none transition-colors duration-100 focus-visible:bg-accent/15 ${past ? 'cursor-default bg-[repeating-linear-gradient(135deg,transparent_0_6px,var(--separator)_6px_7px)]' : 'cursor-pointer hover:bg-accent/10'} ${we && !past ? 'bg-default/40' : ''} ${inSel ? '!bg-accent/25' : ''}`} />
                );
              })}
              {bookings.filter(b => b.stay === s.id).map(b => <Bar key={keyOf(b)} b={b} row={r + 2} from={from} />)}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
        <Legend c="bg-accent" t="Pagada" /><Legend c="bg-warning" t="Pendent de cobrar" /><Legend c="bg-muted/60" t="Tancat" /><Legend c="bg-[var(--brand-cava)]" t="Altres (Google Calendar)" />
      </div>
      <p className="mt-2 text-xs text-muted">Toca la primera nit i després l'última per tancar dates o afegir una reserva. Toca una reserva per veure'n la fitxa.</p>

      {sel && (
        <div className="fixed inset-x-3 bottom-28 z-40 mx-auto max-w-xl lg:bottom-6 fade-in">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-overlay p-2 pl-4 shadow-[var(--overlay-shadow)] ring-1 ring-border">
            <span className="mr-auto text-sm"><b className="font-semibold">{shortName(sel.stay)}</b> <span className="text-muted">{range(sel.a, selUntil)}, {nitsTxt(nightsBetween(sel.a, selUntil))}</span></span>
            <Button isIconOnly size="sm" variant="ghost" aria-label="Desfés la selecció" onPress={() => setSel(null)}><X size={16} /></Button>
            <Button size="sm" variant="secondary" onPress={() => openBlock({ stays: [sel.stay], first: sel.a, until: selUntil })}>Tancar</Button>
            <Button size="sm" onPress={() => { openBook({ stay: sel.stay, first: sel.a, until: selUntil }); setSel(null); }}>Reserva</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Legend({ c, t }: { c: string; t: string }) {
  return <span className="inline-flex items-center gap-2"><span className={`size-2.5 rounded-full ${c}`} />{t}</span>;
}

function Bar({ b, row, from }: { b: Booking; row: number; from: string }) {
  const a = Math.max(0, nightsBetween(from, b.first)), z = Math.min(SPAN, nightsBetween(from, b.until));
  const k = b.kind === 'manual' && b.settled ? 'settled' : b.kind;
  const sub = b.kind === 'block' || b.kind === 'other' ? null : [b.guests && `${b.guests} pers.`, euro(b.amount)].filter(Boolean);
  return (
    <button type="button" onClick={() => openDetail(keyOf(b))} style={{ gridRow: row, gridColumn: `${a + 2} / ${z + 2}` }}
      className={`relative z-[5] mx-1 my-2.5 flex min-w-0 flex-col justify-center overflow-hidden rounded-xl py-1.5 pl-4 pr-2 text-left outline-none transition-transform duration-150 hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-focus ${tone[k] || tone.block}`}
      title={who(b)} aria-label={`${who(b)}, ${shortName(b.stay)}, ${range(b.first, b.until)}`}>
      <span className={`absolute left-1.5 top-2 bottom-2 w-1 rounded-full ${bar[k] || bar.block}`} aria-hidden="true" />
      <span className="truncate text-[13px] font-semibold">{who(b)}</span>
      {sub && <span className="flex gap-2 truncate text-[11.5px] text-muted tnum">{sub.map(x => <span key={String(x)}>{x}</span>)}</span>}
    </button>
  );
}
