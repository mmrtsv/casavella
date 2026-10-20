// Reserves: the next 30 days at a glance, then every booking in a sortable table (tap a row for the client file)
import { useMemo, useState, type ReactNode } from 'react';
import { SearchField, Table, ToggleButton, ToggleButtonGroup, type Key, type SortDescriptor } from '@heroui/react';
import { Glass } from '../lib/glass';
import { addDays, day, euro, nightsBetween, TODAY } from '../lib/dates';
import { keyOf, shortName, stayName, useStore } from '../lib/store';
import { openDetail, takeBookingsFilter } from '../lib/ui';
import { atHome, checklist, isBooking, KIND, missing, SOURCE, who } from '../lib/words';
import { Status, Tag } from '../parts/Status';
import type { Booking } from '../lib/types';

type Filter = 'today' | 'todo' | 'next' | 'past' | 'cancelled' | 'block';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'today', label: 'Avui' }, { id: 'todo', label: 'Per fer' }, { id: 'next', label: 'Properes' }, { id: 'past', label: 'Passades' }, { id: 'cancelled', label: 'Cancel·lades' }, { id: 'block', label: 'Tancaments' },
];
const short = (d: string) => day(d, { weekday: 'short', day: 'numeric', month: 'short' });

const SORT: Record<string, (b: Booking) => string | number> = {
  guest: b => who(b).toLowerCase(), stay: b => shortName(b.stay), first: b => b.first, until: b => b.until,
  nights: b => nightsBetween(b.first, b.until), guests: b => b.guests || 0, source: b => SOURCE[b.source] || '',
  amount: b => b.amount ?? -1, state: b => KIND[b.kind] + (b.settled ? 1 : 0), done: b => isBooking(b) ? checklist(b).filter(c => c.ok).length : -1,
};

export default function Bookings() {
  const map = useStore(s => s.bookings);
  const stays = useStore(s => s.stays);
  const [filter, setFilter] = useState<Filter>(() => (takeBookingsFilter() as Filter) || 'next');
  const in30 = addDays(TODAY, 30);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortDescriptor | null>(null);
  const all = useMemo(() => [...map.values()], [map]);

  const rows = useMemo(() => {
    let r = all.filter(b => {
      if (filter === 'today') return isBooking(b) && b.first <= TODAY && b.until >= TODAY;
      // The same bookings Inici counts under "Per fer": from now to 30 days out, with something missing
      if (filter === 'todo') return isBooking(b) && b.until >= TODAY && b.first < in30 && missing(b).length > 0;
      if (filter === 'next') return (isBooking(b) || (b.kind === 'other' && b.blocks)) && b.until >= TODAY;
      if (filter === 'past') return (isBooking(b) || (b.kind === 'other' && b.blocks)) && b.until < TODAY;
      if (filter === 'cancelled') return b.kind === 'cancelled' || b.kind === 'refunded';
      return b.kind === 'block' && b.until >= TODAY;
    });
    const t = q.trim().toLowerCase();
    if (t) r = r.filter(b => [b.name, b.phone, b.email, b.title, stayName(b.stay)].join(' ').toLowerCase().includes(t));
    const get = sort ? SORT[String(sort.column)] : (b: Booking) => b.first;
    const dir = sort ? (sort.direction === 'ascending' ? 1 : -1) : filter === 'past' || filter === 'cancelled' ? -1 : 1;
    return [...r].sort((a, b) => { const x = get(a), y = get(b); return (x < y ? -1 : x > y ? 1 : a.first.localeCompare(b.first)) * dir; });
  }, [all, filter, q, sort]);

  // The next 30 days at a glance
  const stats = useMemo(() => {
    const bk = all.filter(isBooking);
    const nights = bk.reduce((n, b) => n + Math.max(0, nightsBetween(b.first < TODAY ? TODAY : b.first, b.until > in30 ? in30 : b.until)), 0);
    return {
      today: bk.filter(b => b.first === TODAY).length,
      soon: bk.filter(b => b.first >= TODAY && b.first < in30).length,
      occ: Math.round(nights / (30 * (stays.length || 1)) * 100),
      due: bk.filter(b => b.kind === 'manual' && !b.settled && b.until >= TODAY).reduce((s, b) => s + (b.amount || 0), 0),
      todo: bk.filter(b => b.until >= TODAY && b.first < in30 && missing(b).length).length,
    };
  }, [all, stays.length]);

  return (
    <div className="fade-in space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Glass lively radius={18} className="col-span-2 md:col-span-1">
          <Stat label="Arribades avui" value={stats.today} accent />
        </Glass>
        <Card><Stat label="Arribades en 30 dies" value={stats.soon} /></Card>
        <Card><Stat label="Ocupació 30 dies" value={`${stats.occ} %`}><span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-border"><span className="block h-full rounded-full bg-accent" style={{ width: `${Math.min(100, stats.occ)}%` }} /></span></Stat></Card>
        <Card><Stat label="Pendent de cobrar" value={euro(stats.due) || '0 €'} /></Card>
        <Card><Stat label="Amb coses pendents" value={stats.todo} /></Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ToggleButtonGroup aria-label="Mostra" selectionMode="single" disallowEmptySelection selectedKeys={new Set([filter])}
          onSelectionChange={(k: Set<Key>) => { const [v] = k; if (v) setFilter(v as Filter); }} size="sm" className="max-w-full overflow-x-auto">
          {FILTERS.map(f => <ToggleButton key={f.id} id={f.id}>{f.label}</ToggleButton>)}
        </ToggleButtonGroup>
        <SearchField aria-label="Cerca" value={q} onChange={setQ} className="w-full sm:ml-auto sm:w-72">
          <SearchField.Group><SearchField.SearchIcon /><SearchField.Input placeholder="Nom, telèfon o correu" /><SearchField.ClearButton /></SearchField.Group>
        </SearchField>
      </div>

      {filter === 'today' ? <Today rows={rows} /> : <>
        <div className="hidden md:block"><BookingTable rows={rows} sort={sort} setSort={setSort} /></div>
        <PhoneList rows={rows} />
      </>}
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <div className="card">{children}</div>;
}
function Stat({ label, value, accent, children }: { label: string; value: ReactNode; accent?: boolean; children?: ReactNode }) {
  return (
    <div className="px-5 py-4">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className={`mt-1.5 text-[28px] leading-none font-semibold tracking-tight tnum ${accent ? 'text-accent' : ''}`}>{value}</div>
      {children}
    </div>
  );
}

function Progress({ b }: { b: Booking }) {
  if (!isBooking(b)) return null;
  const list = checklist(b), n = list.filter(c => c.ok).length;
  return (
    <span className="inline-flex items-center gap-2" title={`${n} de ${list.length} fet`}>
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-border" aria-hidden="true"><span className="block h-full rounded-full bg-accent" style={{ width: `${n / list.length * 100}%` }} /></span>
      <span className="text-xs tnum text-muted">{n}/{list.length}</span>
    </span>
  );
}

const COLS: { id: string; label: string; num?: boolean; row?: boolean; className?: string }[] = [
  { id: 'guest', label: 'Hoste', row: true, className: 'min-w-[220px]' }, { id: 'stay', label: 'Allotjament' }, { id: 'first', label: 'Arribada' },
  { id: 'until', label: 'Sortida' }, { id: 'nights', label: 'Nits', num: true }, { id: 'guests', label: 'Pers.', num: true },
  { id: 'source', label: 'Via' }, { id: 'amount', label: 'Import', num: true }, { id: 'state', label: 'Estat' }, { id: 'done', label: 'Llista' },
];

function BookingTable({ rows, sort, setSort }: { rows: Booking[]; sort: SortDescriptor | null; setSort: (s: SortDescriptor) => void }) {
  return (
    // The card always reaches the foot of the screen; below the last booking, empty ruled rows keep the table's shape
    <div className="flex min-h-[calc(100dvh-19.5rem)] flex-col overflow-hidden card">
      <Table variant="secondary" className="!rounded-none !bg-transparent !shadow-none">
        <Table.ScrollContainer className="overflow-x-auto">
          <Table.Content aria-label="Reserves" className="min-w-[1020px] [&_td]:whitespace-nowrap [&_td:first-child]:whitespace-normal" sortDescriptor={sort ?? undefined} onSortChange={setSort}
            onRowAction={k => openDetail(String(k))}>
            <Table.Header>
              {COLS.map(c => (
                <Table.Column key={c.id} id={c.id} isRowHeader={c.row} allowsSorting className={`${c.num ? 'text-right' : ''} ${c.className || ''}`}>
                  {({ sortDirection }) => <Table.SortableColumnHeader sortDirection={sortDirection}>{c.label}</Table.SortableColumnHeader>}
                </Table.Column>
              ))}
            </Table.Header>
            <Table.Body items={rows.map(b => ({ ...b, key: keyOf(b) }))} renderEmptyState={() => <p className="p-10 text-center text-sm text-muted">No hi ha res aquí.</p>}>
              {b => {
                const todo = isBooking(b) && b.until >= addDays(TODAY, -3) ? missing(b) : [];
                return (
                  <Table.Row id={b.key} className="cursor-pointer">
                    <Table.Cell>
                      <div className="flex items-center gap-2 font-medium">{who(b)}{isBooking(b) && atHome(b) && <Tag tone="paid">A casa</Tag>}</div>
                      {todo.length > 0 && <div className="mt-0.5 text-xs text-warning">Falta: {todo.map(c => c.label.toLowerCase()).join(', ')}</div>}
                    </Table.Cell>
                    <Table.Cell>{shortName(b.stay)}</Table.Cell>
                    <Table.Cell className="tnum text-muted">{short(b.first)}</Table.Cell>
                    <Table.Cell className="tnum text-muted">{short(b.until)}</Table.Cell>
                    <Table.Cell className="text-right tnum">{nightsBetween(b.first, b.until)}</Table.Cell>
                    <Table.Cell className="text-right tnum">{b.guests || ''}</Table.Cell>
                    <Table.Cell className="text-muted">{SOURCE[b.source] || b.source}</Table.Cell>
                    <Table.Cell className="text-right tnum">{euro(b.amount)}</Table.Cell>
                    <Table.Cell><Status b={b} /></Table.Cell>
                    <Table.Cell><Progress b={b} /></Table.Cell>
                  </Table.Row>
                );
              }}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
      <div aria-hidden="true" className="min-h-16 flex-1 bg-[repeating-linear-gradient(to_bottom,transparent_0_63px,var(--separator)_63px_64px)]" />
    </div>
  );
}

// Phones: one tappable row per booking, with what is still missing
function PhoneList({ rows }: { rows: Booking[] }) {
  if (!rows.length) return <p className="card p-8 text-center text-sm text-muted md:hidden">No hi ha res aquí.</p>;
  return (
    <ul className="divide-y divide-separator overflow-hidden card md:hidden">
      {rows.map(b => {
        const todo = isBooking(b) && b.until >= addDays(TODAY, -3) ? missing(b) : [];
        return (
          <li key={keyOf(b)}>
            <button type="button" onClick={() => openDetail(keyOf(b))} className="flex w-full items-start gap-3 px-4 py-3.5 text-left outline-none active:bg-[var(--row-hover)] focus-visible:bg-[var(--row-hover)]">
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2"><span className="truncate font-medium">{who(b)}</span>{isBooking(b) && atHome(b) && <Tag tone="paid">A casa</Tag>}</span>
                <span className="mt-0.5 block text-[13px] text-muted tnum">{shortName(b.stay)}, {short(b.first)} → {short(b.until)}</span>
                {todo.length > 0 && <span className="mt-0.5 block text-xs text-warning">Falta: {todo.map(c => c.label.toLowerCase()).join(', ')}</span>}
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1.5"><span className="text-sm font-medium tnum">{euro(b.amount)}</span><Status b={b} /><Progress b={b} /></span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// Today: who arrives, who is staying, who leaves, as large tappable rows (made for the phone)
function Today({ rows }: { rows: Booking[] }) {
  const groups: [string, Booking[]][] = [['Arriben avui', rows.filter(b => b.first === TODAY)], ['A casa', rows.filter(b => b.first < TODAY && b.until > TODAY)], ['Marxen avui', rows.filter(b => b.until === TODAY)]];
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {groups.map(([t, g]) => (
        <section key={t} className="card p-2">
          <h3 className="flex items-center justify-between px-3 pt-2 pb-1 text-sm font-semibold">{t}<span className="text-muted tnum">{g.length}</span></h3>
          {g.length ? g.map(b => {
            const todo = missing(b);
            return (
              <button key={keyOf(b)} type="button" onClick={() => openDetail(keyOf(b))}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left outline-none transition-colors hover:bg-[var(--row-hover)] focus-visible:ring-2 focus-visible:ring-focus">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{who(b)}</span>
                  <span className="block truncate text-xs text-muted">{shortName(b.stay)}{b.guests ? `, ${b.guests} ${b.guests === 1 ? 'persona' : 'persones'}` : ''}{todo.length ? `. Falta: ${todo.map(c => c.label.toLowerCase()).join(', ')}` : ''}</span>
                </span>
                <Progress b={b} />
              </button>
            );
          }) : <p className="px-3 pb-3 text-sm text-muted">Ningú.</p>}
        </section>
      ))}
    </div>
  );
}
