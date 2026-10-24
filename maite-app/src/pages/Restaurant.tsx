// Restaurant: the tables booked for a day (web and phone), a new one, cancelling, and the services, seats and limits the web follows
import { useEffect, useMemo, useState } from 'react';
import { Button, Spinner, Tabs, ToggleButton, ToggleButtonGroup, type Key } from '@heroui/react';
import { ChevronLeft, ChevronRight, Phone, Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { addDays, cap, day, longDay, TODAY } from '../lib/dates';
import { setSettings, useStore } from '../lib/store';
import { useGuard } from '../lib/guard';
import { SOURCE } from '../lib/words';
import { Dialog } from '../parts/Sheet';
import { Check, Choice, Field } from '../parts/fields';
import { done, toastError } from '../parts/toast';
import type { RestaurantSettings, Service, Settings, Table } from '../lib/types';

type Tab = 'tables' | 'hours';
const SOURCES = [{ id: 'phone', name: 'Telèfon' }, { id: 'whatsapp', name: 'WhatsApp' }, { id: 'email', name: 'Correu' }, { id: 'door', name: 'En persona' }, { id: 'other', name: 'Altres' }];
const persones = (n: number) => `${n} ${n === 1 ? 'persona' : 'persones'}`;
const mins = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
// Closed unless that date is opened, as lib/restaurant.js
const servicesOn = (R: RestaurantSettings, d: string) => R.services.filter(s => (R.open[d] || []).includes(s.id));
const inService = (s: Service, t: Table) => t.service ? t.service === s.id : !!t.time && mins(t.time) >= mins(s.from) && mins(t.time) <= mins(s.to);
const seated = (list: Table[]) => list.reduce((n, t) => n + (t.people || 0), 0);

export default function Restaurant() {
  const [tab, setTab] = useState<Tab>('tables');
  return (
    <div className="fade-in">
      <Tabs selectedKey={tab} onSelectionChange={k => setTab(k as Tab)} className="mb-5">
        <Tabs.ListContainer><Tabs.List aria-label="Restaurant" className="w-fit">
          <Tabs.Tab id="tables">Taules<Tabs.Indicator /></Tabs.Tab>
          <Tabs.Tab id="hours">Horaris i places<Tabs.Indicator /></Tabs.Tab>
        </Tabs.List></Tabs.ListContainer>
      </Tabs>
      {tab === 'tables' ? <Tables /> : <Hours />}
    </div>
  );
}

// ---------- Tables ----------
function Tables() {
  const R = useStore(s => s.settings)!.restaurant;
  const [date, setDate] = useState(TODAY);
  const [tables, setTables] = useState<Map<string, Table>>(new Map());
  const [loaded, setLoaded] = useState<[string, string][]>([]);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [cancel, setCancel] = useState<Table | null>(null);

  // Loads a window around the day shown, once
  useEffect(() => {
    if (loaded.some(([a, b]) => a <= date && b > date)) return;
    const from = addDays(date, -7), to = addDays(date, 60);
    setLoaded(l => [...l, [from, to]]);
    api<{ configured: boolean; tables: Table[] }>(`restaurant?from=${from}&to=${to}`)
      .then(d => { setConfigured(d.configured); setTables(m => { const n = new Map(m); d.tables.forEach(t => n.set(t.id, t)); return n; }); setError(''); })
      .catch(e => { setError((e as Error).message); setLoaded(l => l.filter(([a]) => a !== from)); });
  }, [date]);
  const put = (t: Table) => setTables(m => new Map(m).set(t.id, t));

  const all = useMemo(() => [...tables.values()].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)), [tables]);
  const ofDay = all.filter(t => t.date === date), live = ofDay.filter(t => !t.cancelled);
  const services = servicesOn(R, date);
  const groups = services.map(s => ({ s, list: live.filter(t => inService(s, t)) }));
  const rest = live.filter(t => !services.some(s => inService(s, t)));
  // The open days ahead and any other day that has tables, in order
  const upcoming = useMemo(() => {
    const by = new Map<string, Table[]>(Object.keys(R.open).filter(d => d >= TODAY).map(d => [d, []]));
    for (const t of all) if (!t.cancelled && t.date >= TODAY && t.date < addDays(TODAY, 60)) by.set(t.date, [...(by.get(t.date) || []), t]);
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
        {!services.length && <p className="mt-5 text-sm text-muted">Aquest dia el restaurant no obre. Els dies s'obren a Horaris i places.</p>}
        {groups.map(({ s, list }) => (
          <div key={s.id} className="mt-6">
            <div className="flex items-baseline gap-3 border-b border-separator pb-2">
              <h3 className="text-base font-semibold">{s.name}</h3>
              <span className="text-sm text-muted tnum">{seated(list)} de {s.seats} places</span>
            </div>
            {list.length ? list.map(t => <Row key={t.id} t={t} onCancel={() => setCancel(t)} />) : <p className="py-3 text-sm text-muted">Cap taula.</p>}
          </div>
        ))}
        {rest.length > 0 && (
          <div className="mt-6">
            <h3 className="border-b border-separator pb-2 text-base font-semibold">Fora d'horari</h3>
            {rest.map(t => <Row key={t.id} t={t} onCancel={() => setCancel(t)} />)}
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
      <NewTable isOpen={adding} date={date} tables={all} onClose={() => setAdding(false)} onSaved={t => { put(t); setDate(t.date); }} />
      <CancelTable t={cancel} onClose={() => setCancel(null)} onSaved={put} />
    </div>
  );
}

function Row({ t, onCancel }: { t: Table; onCancel?: () => void }) {
  return (
    <div className={`grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-start gap-3 border-b border-separator py-3 text-sm ${t.cancelled ? 'text-muted' : ''}`}>
      <div className="font-semibold tnum">{t.time || 'Tot el dia'}</div>
      <div className="min-w-0">
        <div className="font-medium">{t.name || 'Sense nom'}{t.people ? <span className="font-normal text-muted"> ({persones(t.people)})</span> : null}</div>
        {t.phone && <a href={`tel:${t.phone.replace(/\s/g, '')}`} className="mt-0.5 inline-flex items-center gap-1.5 text-muted hover:text-foreground"><Phone size={13} aria-hidden="true" />{t.phone}</a>}
        {t.notes && <p className="mt-1 whitespace-pre-line">{t.notes}</p>}
        <div className="mt-1 text-xs text-muted">{SOURCE[t.source] || 'Maite'}</div>
      </div>
      {onCancel && t.source !== 'calendar' && <Button variant="ghost" size="sm" onPress={onCancel}>Cancel·la</Button>}
    </div>
  );
}

function NewTable({ isOpen, date, tables, onClose, onSaved }: { isOpen: boolean; date: string; tables: Table[]; onClose: () => void; onSaved: (t: Table) => void }) {
  const R = useStore(s => s.settings)!.restaurant;
  const empty = { date, time: '', people: '2', name: '', phone: '', email: '', notes: '', source: 'phone' };
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  useEffect(() => { if (isOpen) { setF({ ...empty, date, time: servicesOn(R, date)[0]?.from || '13:00' }); setErr(''); } }, [isOpen]);
  const set = (k: keyof typeof empty) => (v: string) => setF(x => ({ ...x, [k]: v }));
  // How full the service at that time already is, so the house can judge
  const s = servicesOn(R, f.date).find(x => f.time && mins(f.time) >= mins(x.from) && mins(f.time) <= mins(x.to));
  const taken = s ? seated(tables.filter(t => !t.cancelled && t.date === f.date && inService(s, t))) : 0;
  const submit = async () => {
    setBusy(true); setErr('');
    try { const d = await api<{ table: Table }>('restaurant', { method: 'POST', body: f }); onSaved(d.table); onClose(); done('Taula desada'); }
    catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Nova taula"
      footer={<><Button variant="ghost" onPress={onClose}>Cancel·la</Button><Button isPending={busy} onPress={submit}>{busy && <Spinner size="sm" color="current" />}Desa la taula</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Dia" type="date" value={f.date} onChange={set('date')} />
        <Field label="Hora" type="time" value={f.time} onChange={set('time')} help={s ? `${s.name}: ${taken} de ${s.seats} places ocupades` : 'Fora dels horaris del restaurant'} />
        <Field label="Nom" value={f.name} onChange={set('name')} />
        <Field label="Persones" value={f.people} onChange={set('people')} inputMode="numeric" />
        <Field label="Telèfon" type="tel" value={f.phone} onChange={set('phone')} inputMode="tel" />
        <Field label="Correu" type="email" value={f.email} onChange={set('email')} inputMode="email" />
        <Choice label="Via" value={f.source} onChange={set('source')} items={SOURCES} />
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

// ---------- Open days, services and limits ----------
type Form = { online: boolean; maxParty: string; minHours: string; open: Record<string, string[]>; services: (Omit<Service, 'seats'> & { seats: string })[] };
const toForm = (R: RestaurantSettings): Form => ({ online: R.online, maxParty: String(R.maxParty), minHours: String(R.minHours), open: { ...R.open }, services: R.services.map(s => ({ ...s, seats: String(s.seats) })) });

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-separator py-6 first:border-t-0 first:pt-0 md:grid-cols-[220px_1fr] md:gap-8">
      <div><h2 className="text-base font-semibold">{title}</h2>{hint && <p className="mt-1 text-sm text-muted">{hint}</p>}</div>
      <div>{children}</div>
    </section>
  );
}

function Hours() {
  const R = useStore(s => s.settings)!.restaurant;
  const [f, setF] = useState<Form>(() => toForm(R));
  const [first, setFirst] = useState(TODAY); const [last, setLast] = useState(TODAY);
  const [pick, setPick] = useState<string[]>(() => R.services.map(s => s.id));
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const setS = (i: number, patch: Partial<Form['services'][number]>) => setF(x => ({ ...x, services: x.services.map((s, j) => j === i ? { ...s, ...patch } : s) }));
  const setDay = (d: string, ids: string[]) => setF(x => { const open = { ...x.open }; if (ids.length) open[d] = ids; else delete open[d]; return { ...x, open }; });
  // Opens every date from the first to the last with the services picked (a single day when both are the same)
  const openRange = () => {
    if (!pick.length || first < TODAY || last < first) return;
    setF(x => { const open = { ...x.open }; for (let d = first; d <= last; d = addDays(d, 1)) open[d] = [...pick]; return { ...x, open }; });
  };
  const days = Object.keys(f.open).filter(d => d >= TODAY).sort();
  const dirty = JSON.stringify(f) !== JSON.stringify(toForm(R));
  const save = async () => {
    setBusy(true); setErr(''); let ok = false;
    try {
      const next = await api<Settings>('settings', { method: 'PUT', body: { restaurant: { ...f, maxParty: Number(f.maxParty), minHours: Number(f.minHours), services: f.services.map(s => ({ ...s, seats: Number(s.seats) })) } } });
      setSettings(next); setF(toForm(next.restaurant)); done('Horaris desats'); ok = true;
    } catch (e) { setErr((e as Error).message); }
    setBusy(false); return ok;
  };
  useGuard(dirty, save);
  return (
    <div className="card p-5 sm:p-8">
      <Section title="Dies oberts" hint="El restaurant només obre els dies que hi ha aquí, amb els serveis de cada dia. La resta de dies, la web no ofereix taula.">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Des del" type="date" value={first} onChange={v => { setFirst(v); if (last < v) setLast(v); }} className="w-44" />
          <Field label="Fins al" type="date" value={last} onChange={setLast} className="w-44" />
          <ToggleButtonGroup aria-label="Serveis" selectionMode="multiple" selectedKeys={new Set(pick)} size="sm" onSelectionChange={(k: Set<Key>) => setPick([...k].map(String))}>
            {f.services.map(s => <ToggleButton key={s.id} id={s.id}>{s.name || 'Servei'}</ToggleButton>)}
          </ToggleButtonGroup>
          <Button variant="secondary" onPress={openRange} isDisabled={!pick.length}><Plus size={16} />Obre</Button>
        </div>
        {days.length ? (
          <ul className="mt-4">
            {days.map(d => (
              <li key={d} className="flex flex-wrap items-center gap-3 border-b border-separator py-2 text-sm">
                <span className="min-w-48 flex-1">{cap(longDay(d))}</span>
                <ToggleButtonGroup aria-label={`Serveis del ${day(d)}`} selectionMode="multiple" selectedKeys={new Set(f.open[d])} size="sm"
                  onSelectionChange={(k: Set<Key>) => setDay(d, [...k].map(String))}>
                  {f.services.map(s => <ToggleButton key={s.id} id={s.id}>{s.name || 'Servei'}</ToggleButton>)}
                </ToggleButtonGroup>
                <Button isIconOnly variant="ghost" size="sm" aria-label={`Tanca ${day(d)}`} onPress={() => setDay(d, [])}><Trash2 size={15} /></Button>
              </li>
            ))}
          </ul>
        ) : <p className="mt-4 text-sm text-muted">Cap dia obert. La web diu que el restaurant obre en dates concretes i dona el telèfon.</p>}
      </Section>
      <Section title="Serveis" hint="Les hores són la primera i l'última d'arribada, cada mitja hora. Les places compten per a tot el servei.">
        <div className="space-y-2">
          {f.services.map((s, i) => (
            <div key={s.id} className="flex flex-wrap items-end gap-3 rounded-2xl bg-default/50 p-3">
              <Field label="Nom" value={s.name} onChange={v => setS(i, { name: v })} className="w-40" />
              <Field label="Primera hora" type="time" value={s.from} onChange={v => setS(i, { from: v })} className="w-32" />
              <Field label="Última hora" type="time" value={s.to} onChange={v => setS(i, { to: v })} className="w-32" />
              <Field label="Places" value={s.seats} onChange={v => setS(i, { seats: v })} inputMode="numeric" className="w-24" />
              <Button isIconOnly variant="ghost" aria-label={`Treu ${s.name || 'aquest servei'}`} className="ml-auto" onPress={() => setF(x => ({ ...x, services: x.services.filter((_, j) => j !== i) }))}><Trash2 size={16} /></Button>
            </div>
          ))}
        </div>
        {f.services.length < 6 && <Button variant="secondary" className="mt-3" onPress={() => setF(x => ({ ...x, services: [...x.services, { id: `s${Date.now().toString(36)}`, name: '', from: '13:00', to: '15:00', seats: '15' }] }))}><Plus size={16} />Afegeix un servei</Button>}
      </Section>
      <Section title="A la web" hint="Només per a la web. Des de Maite es pot apuntar qualsevol taula, qualsevol dia.">
        <Check isSelected={f.online} onChange={v => setF(x => ({ ...x, online: v }))}>Es pot reservar taula a la web</Check>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Persones per taula, com a molt" value={f.maxParty} onChange={v => setF(x => ({ ...x, maxParty: v }))} inputMode="numeric" help="Els grups més grans truquen" />
          <Field label="Hores d'antelació" value={f.minHours} onChange={v => setF(x => ({ ...x, minHours: v }))} inputMode="numeric" />
        </div>
      </Section>
      {err && <p role="alert" className="mb-3 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{err}</p>}
      <div className="flex justify-end border-t border-separator pt-5"><Button isPending={busy} onPress={save}>{busy && <Spinner size="sm" color="current" />}Desa els horaris</Button></div>
    </div>
  );
}
