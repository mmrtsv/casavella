// Inici: a greeting that says what happens today, four numbers, what is still to do, this week's calendar and who is here or coming next
import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { Glass } from '../lib/glass';
import { addDays, day, euro, nightsBetween, parse, range, TODAY } from '../lib/dates';
import { go } from '../lib/route';
import { keyOf, shortName, useStore } from '../lib/store';
import { openBookings, openDetail } from '../lib/ui';
import { atHome, dueList, isBooking, missing, who } from '../lib/words';
import { Status } from '../parts/Status';
import { bar, tone } from './Calendar';
import type { Booking } from '../lib/types';

const DAYS = 7;
const Name = ({ b }: { b: Booking }) => <button type="button" onClick={() => openDetail(keyOf(b))} className="rounded font-medium text-accent outline-none hover:underline focus-visible:ring-2 focus-visible:ring-focus">{who(b)}</button>;

// The greeting writes itself in: each word rises out of a mask, 60 ms after the one before (as on the REVER home).
// The rest of the page waits for the last word. It plays in full once per session; with reduced motion it does not play.
type Seg = string | Booking;
const STEP = 60, RISE = 800;
// Words to animate; punctuation sticks to the word before it, so "Montserrat." rises as one
type Word = { w: string | Booking; after: string };
function words(segs: Seg[]): Word[] {
  const out: Word[] = [];
  for (const x of segs) for (const t of typeof x === 'string' ? x.split(' ').filter(Boolean) : [x]) {
    const p = typeof t === 'string' ? t.match(/^[.,;:]+/)?.[0] : undefined;
    if (p && out.length) { out[out.length - 1].after += p; if ((t as string).length > p.length) out.push({ w: (t as string).slice(p.length), after: '' }); }
    else out.push({ w: t, after: '' });
  }
  return out;
}
let played = false;
function Write({ segs, delay = 0, on }: { segs: Seg[]; delay?: number; on: boolean }) {
  return <>{words(segs).map((w, i) => (
    <Fragment key={i}>
      <span className="inline-block overflow-hidden pb-1 align-bottom">
        <span className="inline-block" style={on ? { animation: `home-rise ${RISE}ms ${delay + i * STEP}ms var(--ease-quick) both` } : undefined}>
          {typeof w.w === 'string' ? w.w : <Name b={w.w} />}{w.after}
        </span>
      </span>{' '}
    </Fragment>
  ))}</>;
}
const listOf = (bs: Booking[], each: (b: Booking) => Seg[]): Seg[] => {
  const parts = bs.map(each);
  return parts.flatMap((x, i) => i === 0 ? x : i === parts.length - 1 ? ['i', ...x] : [',', ...x]);
};

export default function Home() {
  const map = useStore(s => s.bookings);
  const stays = useStore(s => s.stays);
  const all = useMemo(() => [...map.values()].filter(isBooking).sort((a, b) => a.first.localeCompare(b.first)), [map]);
  const arrive = all.filter(b => b.first === TODAY), leave = all.filter(b => b.until === TODAY);
  const here = all.filter(b => b.first <= TODAY && b.until > TODAY);
  const next = all.find(b => b.first > TODAY);
  const in30 = addDays(TODAY, 30);
  const occ = Math.round(all.reduce((n, b) => n + Math.max(0, nightsBetween(b.first < TODAY ? TODAY : b.first, b.until > in30 ? in30 : b.until)), 0) / (30 * (stays.length || 1)) * 100);
  const due = all.filter(b => b.kind === 'manual' && !b.settled && b.until >= TODAY).reduce((s, b) => s + (b.amount || 0), 0);
  const h = new Date().getHours(), hello = h < 6 || h >= 21 ? 'Bona nit' : h < 14 ? 'Bon dia' : 'Bona tarda';
  const say: Seg[] = [
    ...(arrive.length ? [`Avui ${arrive.length === 1 ? 'arriba' : 'arriben'}`, ...listOf(arrive, b => [b, `a ${shortName(b.stay)}`]), '.'] : ['Avui no arriba ningú.']),
    ...(leave.length ? [leave.length === 1 ? 'Marxa' : 'Marxen', ...listOf(leave, b => [b]), '.'] : []),
    ...(!arrive.length && next ? ['El proper check-in és el de', next, `, ${day(next.first, { weekday: 'long', day: 'numeric', month: 'long' })}.`] : []),
  ];
  const [anim] = useState(() => !played && !matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => { played = true; }, []);
  const greet = [`${hello},`, 'Maite'], sayAt = greet.length * STEP + 300;
  const rest = anim ? sayAt + words(say).length * STEP + RISE - 200 : 0;
  const up = (n: number) => anim ? { className: 'home-up', style: { animationDelay: `${rest + n * 90}ms` } } : {};

  return (
    <div className="space-y-8">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Glass radius={18} className="min-h-[220px]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[18px] bg-[radial-gradient(120%_140%_at_0%_0%,color-mix(in_oklab,var(--brand-sage)_26%,transparent),transparent_62%)]" />
          <div className="relative flex h-full flex-col justify-between gap-8 p-6 sm:p-8">
            <h2 className="text-[32px] leading-tight font-semibold tracking-tight sm:text-[40px]"><Write segs={greet} on={anim} /></h2>
            <p className="max-w-[46ch] text-lg leading-relaxed text-muted sm:text-xl"><Write segs={say} delay={sayAt} on={anim} /></p>
          </div>
        </Glass>
        <div className="grid grid-cols-2 gap-4">
          <div {...up(0)}><Tile label="Arribades avui" value={arrive.length} hint={arrive.length ? arrive.map(b => shortName(b.stay)).join(', ') : 'Cap'} /></div>
          <div {...up(1)}><Tile label="A casa aquesta nit" value={`${new Set(here.map(b => b.stay)).size} de ${stays.length}`} hint="allotjaments ocupats" /></div>
          <div {...up(2)}><Tile label="Ocupació 30 dies" value={`${occ} %`}><span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-border"><span className="block h-full rounded-full bg-accent" style={{ width: `${Math.min(100, occ)}%` }} /></span></Tile></div>
          <div {...up(3)}><Tile label="Pendent de cobrar" value={euro(due) || '0 €'} hint="reserves fetes a mà" /></div>
        </div>
      </div>

      <div {...up(4)}><Todo all={all} /></div>
      <div {...up(5)}><Week /></div>
      <div {...up(6)}><Upcoming all={all} /></div>
    </div>
  );
}

function Tile({ label, value, hint, children }: { label: string; value: ReactNode; hint?: string; children?: ReactNode }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className="mt-2 text-[28px] leading-none font-semibold tracking-tight tnum">{value}</div>
      {hint && <div className="mt-2 truncate text-xs text-muted">{hint}</div>}
      {children}
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-3"><h2 className="mr-auto text-lg font-semibold tracking-tight">{title}</h2>{action}</div>
      {children}
    </section>
  );
}
const Open = ({ to, children }: { to: Parameters<typeof go>[0]; children: ReactNode }) => (
  <button type="button" onClick={() => go(to)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-accent outline-none hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-focus">{children}</button>
);

// What is still to do for stays from now to 30 days out, grouped by kind; the groups cover everything the count does
const TODO: { title: string; color: string; has: (k: string) => boolean }[] = [
  { title: 'per cobrar', color: 'bg-danger', has: k => k === 'pay' },
  { title: 'sense documents', color: 'bg-warning', has: k => k === 'docs' },
  { title: 'sense correu o telèfon', color: 'bg-[var(--brand-cava)]', has: k => k === 'email' || k === 'phone' },
  { title: 'sense el check-in fet', color: 'bg-accent', has: k => k === 'checkin' },
  { title: 'sense el check-out fet', color: 'bg-accent', has: k => k === 'checkout' },
];
function Todo({ all }: { all: Booking[] }) {
  const soon = all.filter(b => b.until >= TODAY && b.first < addDays(TODAY, 30));
  const groups = TODO.map(g => ({ ...g, list: soon.filter(b => missing(b).some(c => g.has(c.k))) })).filter(g => g.list.length);
  const open = soon.filter(b => missing(b).length).length, done = soon.length - open;
  const R = 34, C = 2 * Math.PI * R, pct = soon.length ? done / soon.length : 1;
  const ring = (
    <svg viewBox="0 0 80 80" className="size-20 shrink-0 -rotate-90" aria-hidden="true">
      <circle cx="40" cy="40" r={R} fill="none" stroke="var(--border)" strokeWidth="7" />
      {pct > 0 && <circle cx="40" cy="40" r={R} fill="none" stroke="var(--accent)" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${C * pct} ${C}`} />}
    </svg>
  );
  return (
    <Section title="Per fer" action={<Open to="bookings">Reserves</Open>}>
      {!open ? (
        <div className="flex items-center gap-5 card p-6">
          {ring}
          <div><div className="text-xl font-semibold tracking-tight">Tot al dia</div><div className="text-sm text-muted">{soon.length ? 'No falta res per a les reserves dels propers 30 dies.' : 'No hi ha reserves els propers 30 dies.'}</div></div>
        </div>
      ) : (
        <div className="grid overflow-hidden card md:grid-cols-[260px_minmax(0,1fr)]">
          <button type="button" onClick={() => openBookings('todo')} className="group flex items-center gap-5 bg-accent/8 p-6 text-left outline-none transition-colors hover:bg-accent/14 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus">
            {ring}
            <span className="min-w-0 flex-1">
              <span className="block text-4xl font-semibold tracking-tight tnum">{open}</span>
              <span className="block text-sm text-muted">{open === 1 ? 'reserva amb coses pendents' : 'reserves amb coses pendents'}</span>
              <span className="mt-1 flex items-center gap-1 text-xs font-medium text-accent">Veure-les</span>
            </span>
          </button>
          <ul className="divide-y divide-separator">
            {groups.map(g => (
              <li key={g.title}>
                <button type="button" onClick={() => openDetail(keyOf(g.list[0]))} className="flex w-full items-center gap-4 px-5 py-4 text-left outline-none hover:bg-[var(--row-hover)] focus-visible:bg-[var(--row-hover)]">
                  <span className={`h-9 w-1 shrink-0 rounded-full ${g.color}`} aria-hidden="true" />
                  <span className="w-8 text-xl font-semibold tnum">{g.list.length}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{g.list.length === 1 ? 'Reserva' : 'Reserves'} {g.title}</span>
                    <span className="block truncate text-xs text-muted">{g.list.length === 1 ? '' : 'La més propera: '}{who(g.list[0])}, {day(g.list[0].first)}</span>
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-muted" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
}

// The next seven nights for every stay, read only; tap a stay to open its file
function Week() {
  const stays = useStore(s => s.stays);
  const blocks = useStore(s => s.bookings);
  const days = Array.from({ length: DAYS }, (_, i) => addDays(TODAY, i)), end = addDays(TODAY, DAYS);
  const rows = [...blocks.values()].filter(b => b.blocks && b.first < end && b.until > TODAY);
  return (
    <Section title="Aquesta setmana" action={<Open to="calendar">Calendari</Open>}>
      <div className="overflow-x-auto card">
        <div className="grid min-w-[640px]" style={{ gridTemplateColumns: `120px repeat(${DAYS}, minmax(0, 1fr))` }}>
          <div className="border-b border-separator" />
          {days.map(d => (
            <div key={d} className="border-b border-separator py-2.5 text-center">
              <div className="text-xs font-medium text-muted">{parse(d).toLocaleDateString('ca-ES', { weekday: 'short' }).replace('.', '')}</div>
              <div className={`mx-auto mt-1 grid size-7 place-items-center rounded-full text-sm font-semibold tnum ${d === TODAY ? 'bg-accent text-accent-foreground' : ''}`}>{parse(d).getDate()}</div>
            </div>
          ))}
          {stays.map((s, r) => (
            <div key={s.id} className="contents">
              <div className="flex items-center border-b border-separator px-4 text-sm font-semibold last:border-b-0" style={{ gridRow: r + 2, gridColumn: 1 }}>{s.short}</div>
              {days.map((d, i) => <div key={d} className="h-14 border-b border-l border-separator" style={{ gridRow: r + 2, gridColumn: i + 2 }} />)}
              {rows.filter(b => b.stay === s.id).map(b => {
                const a = Math.max(0, nightsBetween(TODAY, b.first)), z = Math.min(DAYS, nightsBetween(TODAY, b.until));
                const k = b.kind === 'manual' && b.settled ? 'settled' : b.kind;
                return (
                  <button key={keyOf(b)} type="button" onClick={() => openDetail(keyOf(b))} style={{ gridRow: r + 2, gridColumn: `${a + 2} / ${z + 2}` }}
                    className={`relative z-[1] mx-1 my-2 flex min-w-0 items-center gap-1.5 overflow-hidden rounded-xl pl-3 pr-2 text-left text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-focus ${tone[k] || tone.block}`}>
                    <span className={`size-2 shrink-0 rounded-full ${bar[k] || bar.block}`} aria-hidden="true" />
                    <span className="truncate">{who(b)}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// Who is staying now and who comes next
function Upcoming({ all }: { all: Booking[] }) {
  const rows = all.filter(b => b.until >= TODAY).slice(0, 6);
  return (
    <Section title="Ara i properes" action={<Open to="bookings">Totes</Open>}>
      {rows.length ? (
        <ul className="divide-y divide-separator overflow-hidden card">
          {rows.map(b => {
            const list = dueList(b), done = list.filter(c => c.ok).length;
            return (
              <li key={keyOf(b)}>
                <button type="button" onClick={() => openDetail(keyOf(b))} className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 text-left outline-none hover:bg-[var(--row-hover)] focus-visible:bg-[var(--row-hover)]">
                  <span className="min-w-0 flex-1 basis-56">
                    <span className="flex items-center gap-2 text-sm font-semibold">{who(b)}</span>
                    <span className="block text-xs text-muted">{shortName(b.stay)}, {atHome(b) ? `a casa fins ${day(b.until)}` : range(b.first, b.until)}</span>
                  </span>
                  <Status b={b} />
                  <span className="flex w-24 items-center gap-2 text-xs text-muted tnum">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-border"><span className="block h-full rounded-full bg-accent" style={{ width: `${done / list.length * 100}%` }} /></span>{done}/{list.length}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : <p className="card p-8 text-center text-sm text-muted">No hi ha cap reserva a la vista.</p>}
    </Section>
  );
}
