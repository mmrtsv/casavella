// Restaurant: the tables booked for a day (web and phone), a new one, changing or cancelling one, what each table paid by day,
// and the openings (a day and a time each), seats and limits the web follows
import { useEffect, useMemo, useState } from 'react';
import { Button, Spinner, Tabs } from '@heroui/react';
import { ChevronLeft, ChevronRight, Pencil, Phone, Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { addDays, cap, day, euro, iso, longDay, parse, TODAY } from '../lib/dates';
import { setSettings, useStore } from '../lib/store';
import { atOf, putTable, seated, useTables } from '../lib/tables';
import { useGuard } from '../lib/guard';
import { ERRORS, SOURCE } from '../lib/words';
import { takeRestaurantDay } from '../lib/ui';
import { Dialog } from '../parts/Sheet';
import { Check, Choice, Field } from '../parts/fields';
import { done, toastError } from '../parts/toast';
import type { RestaurantSettings, Settings, Table } from '../lib/types';

type Tab = 'tables' | 'paid' | 'open';
const SOURCES = [{ id: 'phone', name: 'Telèfon' }, { id: 'whatsapp', name: 'WhatsApp' }, { id: 'email', name: 'Correu' }, { id: 'door', name: 'En persona' }, { id: 'other', name: 'Altres' }];
const persones = (n: number) => `${n} ${n === 1 ? 'persona' : 'persones'}`;
// '2026-12-31T21:00' as "Dijous, 31 de desembre, 21:00"
const atLabel = (at: string) => `${cap(longDay(at.slice(0, 10)))}, ${at.slice(11)}`;

export default function Restaurant() {
  const [tab, setTab] = useState<Tab>('tables');
  return (
    <div className="fade-in">
      <Tabs selectedKey={tab} onSelectionChange={k => setTab(k as Tab)} className="mb-5">
        <Tabs.ListContainer><Tabs.List aria-label="Restaurant" className="w-fit">
          <Tabs.Tab id="tables">Taules<Tabs.Indicator /></Tabs.Tab>
          <Tabs.Tab id="paid">Cobrat<Tabs.Indicator /></Tabs.Tab>
          <Tabs.Tab id="open">Dies oberts<Tabs.Indicator /></Tabs.Tab>
        </Tabs.List></Tabs.ListContainer>
      </Tabs>
      {tab === 'tables' ? <Tables /> : tab === 'paid' ? <Paid /> : <Openings />}
    </div>
  );
}

// ---------- Tables ----------
function Tables() {
  const R = useStore(s => s.settings)!.restaurant;
  const [date, setDate] = useState(() => takeRestaurantDay() || R.open.find(a => a.slice(0, 10) >= TODAY)?.slice(0, 10) || TODAY);
  const { tables, configured, error } = useTables(addDays(date, -7), addDays(date, 90));
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Table | null>(null);
  const [cancel, setCancel] = useState<Table | null>(null);
  const put = putTable;

  const all = useMemo(() => [...tables.values()].sort((a, b) => atOf(a).localeCompare(atOf(b))), [tables]);
  const ofDay = all.filter(t => t.date === date), live = ofDay.filter(t => !t.cancelled);
  const opens = R.open.filter(a => a.slice(0, 10) === date);
  const rest = live.filter(t => !opens.includes(atOf(t)));
  // The openings ahead and any other day that has tables, in order
  const upcoming = useMemo(() => {
    const by = new Map<string, Table[]>(R.open.filter(a => a.slice(0, 10) >= TODAY).map(a => [a.slice(0, 10), []]));
    for (const t of all) if (!t.cancelled && t.date >= TODAY) by.set(t.date, [...(by.get(t.date) || []), t]);
    return [...by.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [all, R.open]);

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="card p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button isIconOnly variant="ghost" size="sm" aria-label="Dia anterior" onPress={() => setDate(addDays(date, -1))}><ChevronLeft size={18} /></Button>
          <Button isIconOnly variant="ghost" size="sm" aria-label="Dia següent" onPress={() => setDate(addDays(date, 1))}><ChevronRight size={18} /></Button>
          <h2 className="mr-auto text-lg font-semibold tracking-tight">{cap(longDay(date))}</h2>
          {date !== TODAY && <Button variant="secondary" size="sm" onPress={() => setDate(TODAY)}>Avui</Button>}
          <Button size="sm" onPress={() => setAdding(true)}><Plus size={16} />Nova taula</Button>
        </div>
        {!configured && <p className="mt-4 rounded-xl bg-warning/10 px-3 py-2 text-sm">Falta connectar el calendari del restaurant (CAL_RESTAURANT). Fins llavors, la web remet al telèfon.</p>}
        {error && <p role="alert" className="mt-4 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
        {!opens.length && <p className="mt-5 text-sm text-muted">Aquest dia el restaurant no obre. Els dies s'obren a Dies oberts.</p>}
        {opens.map(at => {
          const list = live.filter(t => atOf(t) === at);
          return (
            <div key={at} className="mt-6">
              <div className="flex items-baseline gap-3 border-b border-separator pb-2">
                <h3 className="text-base font-semibold tnum">{at.slice(11)}</h3>
                <span className="text-sm text-muted tnum">{seated(list)} de {R.seats} places</span>
              </div>
              {list.length ? list.map(t => <Row key={t.id} t={t} onEdit={() => setEditing(t)} onCancel={() => setCancel(t)} />) : <p className="py-3 text-sm text-muted">Cap taula.</p>}
            </div>
          );
        })}
        {rest.length > 0 && (
          <div className="mt-6">
            <h3 className="border-b border-separator pb-2 text-base font-semibold">{opens.length ? 'A una altra hora' : 'Taules'}</h3>
            {rest.map(t => <Row key={t.id} t={t} onEdit={() => setEditing(t)} onCancel={() => setCancel(t)} />)}
          </div>
        )}
        {ofDay.some(t => t.cancelled) && (
          <div className="mt-6">
            <h3 className="border-b border-separator pb-2 text-base font-semibold text-muted">Cancel·lades</h3>
            {ofDay.filter(t => t.cancelled).map(t => <Row key={t.id} t={t} />)}
          </div>
        )}
      </section>
      <section className="card p-4 sm:p-5">
        <h2 className="text-base font-semibold">Pròxims dies</h2>
        {upcoming.length ? (
          <ul className="mt-2">
            {upcoming.map(([d, list]) => (
              <li key={d}>
                <button type="button" onClick={() => setDate(d)}
                  className={`flex w-full items-baseline gap-3 rounded-xl px-2 py-2 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-focus ${d === date ? 'bg-accent/15' : 'hover:bg-default/60'}`}>
                  <span className="flex-1">{cap(day(d))}</span>
                  <span className="text-muted tnum">{list.length} {list.length === 1 ? 'taula' : 'taules'}</span>
                  <span className="w-20 text-right tnum">{persones(seated(list))}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-muted">Cap dia obert.</p>}
      </section>
      <TableForm isOpen={adding || !!editing} t={editing} date={date} tables={all} onClose={() => { setAdding(false); setEditing(null); }} onSaved={t => { put(t); setDate(t.date); }} />
      <CancelTable t={cancel} onClose={() => setCancel(null)} onSaved={put} />
    </div>
  );
}

function Row({ t, onEdit, onCancel }: { t: Table; onEdit?: () => void; onCancel?: () => void }) {
  return (
    <div className={`grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-start gap-3 border-b border-separator py-3 text-sm ${t.cancelled ? 'text-muted' : ''}`}>
      <div className="font-semibold tnum">{t.time || 'Tot el dia'}</div>
      <div className="min-w-0">
        <div className="font-medium">{t.name || 'Sense nom'}{t.people ? <span className="font-normal text-muted"> ({persones(t.people)})</span> : null}</div>
        {t.phone && <a href={`tel:${t.phone.replace(/\s/g, '')}`} className="mt-0.5 inline-flex items-center gap-1.5 text-muted hover:text-foreground"><Phone size={13} aria-hidden="true" />{t.phone}</a>}
        {t.notes && <p className="mt-1 whitespace-pre-line">{t.notes}</p>}
        <div className="mt-1 text-xs text-muted">{SOURCE[t.source] || 'Maite'}</div>
        {t.paid != null && <div className="text-xs text-muted">Ha pagat {euro(t.paid)}</div>}
      </div>
      {onCancel && t.source !== 'calendar' && (
        <div className="flex gap-1">
          {onEdit && <Button variant="ghost" size="sm" onPress={onEdit}>Edita</Button>}
          <Button variant="ghost" size="sm" onPress={onCancel}>Cancel·la</Button>
        </div>
      )}
    </div>
  );
}

// A new table, or the one given (t) to change
export function TableForm({ isOpen, t, date, tables, onClose, onSaved }: { isOpen: boolean; t?: Table | null; date: string; tables: Table[]; onClose: () => void; onSaved: (t: Table) => void }) {
  const R = useStore(s => s.settings)!.restaurant;
  const empty = { date, time: '', people: '2', name: '', phone: '', email: '', notes: '', source: 'phone' };
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  useEffect(() => {
    if (!isOpen) return;
    setF(t ? { date: t.date, time: t.time, people: t.people ? String(t.people) : '', name: t.name, phone: t.phone, email: t.email, notes: t.notes, source: t.source }
      : { ...empty, date, time: R.open.find(a => a.slice(0, 10) === date)?.slice(11) || '21:00' });
    setErr('');
  }, [isOpen, t]);
  const set = (k: keyof typeof empty) => (v: string) => setF(x => ({ ...x, [k]: v }));
  // How full that opening already is, so the house can judge
  const at = `${f.date}T${f.time}`, isOpening = R.open.includes(at);
  const taken = seated(tables.filter(x => !x.cancelled && x.id !== t?.id && atOf(x) === at));
  const submit = async () => {
    setBusy(true); setErr('');
    try {
      const d = await api<{ table: Table }>('restaurant', t ? { method: 'PATCH', body: { id: t.id, ...f } } : { method: 'POST', body: f });
      onSaved(d.table); onClose(); done(t ? 'Taula canviada' : 'Taula desada');
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={t ? 'Canviar la taula' : 'Nova taula'}
      footer={<><Button variant="ghost" onPress={onClose}>Cancel·la</Button><Button isPending={busy} onPress={submit}>{busy && <Spinner size="sm" color="current" />}Desa la taula</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Dia" type="date" value={f.date} onChange={set('date')} />
        <Field label="Hora" type="time" value={f.time} onChange={set('time')} help={isOpening ? `${taken} de ${R.seats} places ocupades` : "No és cap dia obert"} />
        <Field label="Nom" value={f.name} onChange={set('name')} />
        <Field label="Persones" value={f.people} onChange={set('people')} inputMode="numeric" />
        <Field label="Telèfon" type="tel" value={f.phone} onChange={set('phone')} inputMode="tel" />
        <Field label="Correu" type="email" value={f.email} onChange={set('email')} inputMode="email" />
        <Choice label="Via" value={f.source} onChange={set('source')} items={f.source === 'web' ? [{ id: 'web', name: 'Web' }, ...SOURCES] : SOURCES} />
        <Field label="Comentaris" value={f.notes} onChange={set('notes')} area placeholder="Al·lèrgies, cadira per al nadó…" />
      </div>
      {err && <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{err}</p>}
    </Dialog>
  );
}

function CancelTable({ t, onClose, onSaved }: { t: Table | null; onClose: () => void; onSaved: (t: Table) => void }) {
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!t) return;
    setBusy(true);
    try { const d = await api<{ table: Table }>('restaurant', { method: 'PATCH', body: { id: t.id, cancelled: true } }); onSaved(d.table); onClose(); done('Taula cancel·lada'); }
    catch (e) { toastError(e); }
    setBusy(false);
  };
  return (
    <Dialog isOpen={!!t} onClose={onClose} size="sm" title="Cancel·lar la taula" subtitle={t ? `${t.name}, ${day(t.date)} a les ${t.time}${t.people ? `, ${persones(t.people)}` : ''}.` : ''}
      footer={<><Button variant="ghost" onPress={onClose}>No</Button><Button variant="danger" isPending={busy} onPress={submit}>{busy && <Spinner size="sm" color="current" />}Cancel·la la taula</Button></>}>
      <p className="text-sm">Queda al calendari com a cancel·lada i les places tornen a quedar lliures. L'hoste no rep cap correu: avisa'l si cal.</p>
    </Dialog>
  );
}

// ---------- What each table paid, by day ----------
const WEEK = ['dl', 'dt', 'dc', 'dj', 'dv', 'ds', 'dg'];
const total = (list: Table[]) => list.reduce((n, t) => n + (t.paid || 0), 0);

function Paid() {
  const R = useStore(s => s.settings)!.restaurant;
  const [month, setMonth] = useState(TODAY.slice(0, 8) + '01');
  const m = parse(month), end = iso(new Date(m.getFullYear(), m.getMonth() + 1, 1));
  const { tables } = useTables(month, end);
  const live = useMemo(() => [...tables.values()].filter(t => !t.cancelled && t.date >= month && t.date < end), [tables, month, end]);
  const byDay = (d: string) => live.filter(t => t.date === d).sort((a, b) => atOf(a).localeCompare(atOf(b)));
  const firstWithTables = live.map(t => t.date).sort()[0];
  const [sel, setSel] = useState<string>(TODAY);
  useEffect(() => { if (sel < month || sel >= end) setSel(month <= TODAY && TODAY < end ? TODAY : firstWithTables || month); }, [month, firstWithTables]);
  const days = Array.from({ length: Math.round((parse(end).getTime() - m.getTime()) / 864e5) }, (_, i) => addDays(month, i));
  const lead = (m.getDay() + 6) % 7;
  const missing = live.filter(t => t.paid == null && t.date <= TODAY).length;
  const shift = (n: number) => setMonth(iso(new Date(m.getFullYear(), m.getMonth() + n, 1)));
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="card p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button isIconOnly variant="ghost" size="sm" aria-label="Mes anterior" onPress={() => shift(-1)}><ChevronLeft size={18} /></Button>
          <Button isIconOnly variant="ghost" size="sm" aria-label="Mes següent" onPress={() => shift(1)}><ChevronRight size={18} /></Button>
          <h2 className="mr-auto text-lg font-semibold tracking-tight">{cap(m.toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' }))}</h2>
          <div className="text-right">
            <div className="text-xs text-muted">Cobrat al mes</div>
            <div className="text-lg font-semibold tnum">{euro(total(live)) || '0 €'}</div>
          </div>
        </div>
        {missing > 0 && <p className="mt-3 text-sm text-warning">{missing === 1 ? '1 taula ja servida no té import.' : `${missing} taules ja servides no tenen import.`}</p>}
        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-muted">{WEEK.map(w => <div key={w} className="py-1">{w}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: lead }, (_, i) => <div key={'x' + i} />)}
          {days.map(d => {
            const list = byDay(d), open = R.open.some(a => a.slice(0, 10) === d), owed = list.some(t => t.paid == null) && d <= TODAY;
            return (
              <button key={d} type="button" onClick={() => setSel(d)} aria-pressed={d === sel}
                className={`flex h-16 flex-col items-start justify-between rounded-xl p-1.5 text-left text-xs outline-none ring-1 transition-colors focus-visible:ring-2 focus-visible:ring-focus sm:h-20 sm:p-2
                  ${d === sel ? 'bg-accent/15 ring-accent' : list.length || open ? 'bg-default/60 ring-transparent hover:bg-default' : 'ring-transparent hover:bg-default/40'}`}>
                <span className={`tnum ${d === TODAY ? 'font-bold text-accent' : 'text-muted'}`}>{parse(d).getDate()}</span>
                {list.length > 0 && (d <= TODAY || list.some(t => t.paid != null)) && <span className={`w-full truncate font-semibold tnum ${owed ? 'text-warning' : ''}`}>{euro(total(list)) || '0 €'}</span>}
              </button>
            );
          })}
        </div>
      </section>
      <PaidDay date={sel} list={byDay(sel)} tables={live} />
    </div>
  );
}

// The day's tables, each with what it paid; amounts are in euros and saved one table at a time
function PaidDay({ date, list, tables }: { date: string; list: Table[]; tables: Table[] }) {
  const [edit, setEdit] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Table | null>(null);
  const [busy, setBusy] = useState('');
  useEffect(() => { setEdit({}); }, [date]);
  const shown = (t: Table) => t.paid == null ? '' : String(t.paid / 100).replace('.', ',');
  const value = (t: Table) => edit[t.id] ?? shown(t);
  const save = async (t: Table) => {
    const v = value(t).trim().replace(',', '.');
    if (v !== '' && !(Number(v) >= 0)) return toastError(new Error("L'import no és vàlid"));
    setBusy(t.id);
    try {
      const d = await api<{ table: Table }>('restaurant', { method: 'PATCH', body: { id: t.id, paid: v === '' ? null : Math.round(Number(v) * 100) } });
      putTable(d.table); setEdit(e => { const n = { ...e }; delete n[t.id]; return n; }); done('Import desat');
    } catch (e) { toastError(e); }
    setBusy('');
  };
  return (
    <section className="card p-4 sm:p-5 lg:sticky lg:top-24">
      <div className="flex items-baseline gap-3">
        <h2 className="flex-1 text-base font-semibold">{cap(longDay(date))}</h2>
        {list.length > 0 && <span className="text-base font-semibold tnum">{euro(total(list)) || '0 €'}</span>}
      </div>
      {list.length ? (
        <ul className="mt-2">
          {list.map(t => {
            const dirty = edit[t.id] !== undefined && value(t) !== shown(t);
            return (
              <li key={t.id} className="grid grid-cols-[minmax(0,1fr)_6.5rem_auto] items-end gap-2 border-b border-separator py-3">
                <div className="flex min-w-0 items-start gap-1 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{t.name || 'Sense nom'}</div>
                    <div className="text-xs text-muted tnum">{t.time}{t.people ? `, ${persones(t.people)}` : ''}</div>
                  </div>
                  {t.source !== 'calendar' && <Button isIconOnly variant="ghost" size="sm" aria-label={`Edita la taula de ${t.name}`} onPress={() => setEditing(t)}><Pencil size={15} /></Button>}
                </div>
                <Field label="Ha pagat (€)" value={value(t)} onChange={v => setEdit(e => ({ ...e, [t.id]: v }))} inputMode="decimal" placeholder="0" />
                <Button size="sm" variant={dirty ? 'primary' : 'secondary'} isDisabled={!dirty} isPending={busy === t.id} onPress={() => save(t)}>{busy === t.id && <Spinner size="sm" color="current" />}Desa</Button>
              </li>
            );
          })}
        </ul>
      ) : <p className="mt-2 text-sm text-muted">Cap taula aquest dia.</p>}
      <TableForm isOpen={!!editing} t={editing} date={date} tables={tables} onClose={() => setEditing(null)} onSaved={putTable} />
    </section>
  );
}

// ---------- Openings, seats and limits ----------
type Form = { online: boolean; maxParty: string; minHours: string; seats: string; open: string[] };
const toForm = (R: RestaurantSettings): Form => ({ online: R.online, maxParty: String(R.maxParty), minHours: String(R.minHours), seats: String(R.seats), open: [...R.open] });

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-separator py-6 first:border-t-0 first:pt-0 md:grid-cols-[220px_1fr] md:gap-8">
      <div><h2 className="text-base font-semibold">{title}</h2>{hint && <p className="mt-1 text-sm text-muted">{hint}</p>}</div>
      <div>{children}</div>
    </section>
  );
}

function Openings() {
  const R = useStore(s => s.settings)!.restaurant;
  const [f, setF] = useState<Form>(() => toForm(R));
  const [day0, setDay0] = useState(TODAY); const [time, setTime] = useState('21:00');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const add = () => { const at = `${day0}T${time}`; if (day0 >= TODAY && /^\d\d:\d\d$/.test(time) && !f.open.includes(at)) setF(x => ({ ...x, open: [...x.open, at].sort() })); };
  const dirty = JSON.stringify(f) !== JSON.stringify(toForm(R));
  const save = async () => {
    if (Number(f.maxParty) > Number(f.seats)) { setErr(ERRORS.max_party); return false; }
    setBusy(true); setErr(''); let ok = false;
    try {
      const next = await api<Settings>('settings', { method: 'PUT', body: { restaurant: { ...f, maxParty: Number(f.maxParty), minHours: Number(f.minHours), seats: Number(f.seats) } } });
      setSettings(next); setF(toForm(next.restaurant)); done('Dies oberts desats'); ok = true;
    } catch (e) { setErr((e as Error).message); }
    setBusy(false); return ok;
  };
  useGuard(dirty, save);
  const ahead = f.open.filter(a => a.slice(0, 10) >= TODAY);
  return (
    <div className="card p-5 sm:p-8">
      <Section title="Dies oberts" hint="El restaurant només obre aquests dies, a aquesta hora. La web no ofereix res més.">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Dia" type="date" value={day0} onChange={setDay0} className="w-44" />
          <Field label="Hora" type="time" value={time} onChange={setTime} className="w-32" />
          <Button variant="secondary" onPress={add}><Plus size={16} />Obre</Button>
        </div>
        {ahead.length ? (
          <ul className="mt-4">
            {ahead.map(a => (
              <li key={a} className="flex items-center gap-3 border-b border-separator py-1.5 text-sm">
                <span className="flex-1">{atLabel(a)}</span>
                <Button isIconOnly variant="ghost" size="sm" aria-label={`Tanca ${atLabel(a)}`} onPress={() => setF(x => ({ ...x, open: x.open.filter(o => o !== a) }))}><Trash2 size={15} /></Button>
              </li>
            ))}
          </ul>
        ) : <p className="mt-4 text-sm text-muted">Cap dia obert. La web diu que el restaurant obre en dates concretes i dona el telèfon.</p>}
      </Section>
      <Section title="Places" hint="Les persones que caben cada dia obert, sumant totes les taules.">
        <Field label="Places" value={f.seats} onChange={v => setF(x => ({ ...x, seats: v }))} inputMode="numeric" className="w-32" />
      </Section>
      <Section title="A la web" hint="Només per a la web. Des de Maite es pot apuntar qualsevol taula, qualsevol dia.">
        <Check isSelected={f.online} onChange={v => setF(x => ({ ...x, online: v }))}>Es pot reservar taula a la web</Check>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Persones per taula, com a molt" value={f.maxParty} onChange={v => setF(x => ({ ...x, maxParty: v }))} inputMode="numeric" help="Els grups més grans truquen" />
          <Field label="Hores d'antelació" value={f.minHours} onChange={v => setF(x => ({ ...x, minHours: v }))} inputMode="numeric" />
        </div>
      </Section>
      {err && <p role="alert" className="mb-3 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{err}</p>}
      <div className="flex justify-end border-t border-separator pt-5"><Button isPending={busy} onPress={save}>{busy && <Spinner size="sm" color="current" />}Desa</Button></div>
    </div>
  );
}
