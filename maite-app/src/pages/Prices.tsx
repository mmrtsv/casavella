// Preus: two tabs. Per nit is a month per stay: tap a day, or the first and last of a period, to give it a special price
// or a minimum stay. Descomptes: longer stays pay less; the highest discount that applies wins.
import { useEffect, useMemo, useState } from 'react';
import { Button, Spinner, Tabs, ToggleButton, ToggleButtonGroup, type Key } from '@heroui/react';
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from 'lucide-react';
import { api } from '../lib/api';
import { addDays, day, euro, iso, nightsBetween, nitsTxt, parse, TODAY, cap } from '../lib/dates';
import { ensure, setSettings, stayName, shortName, useStore } from '../lib/store';
import { Check, Choice, Field } from '../parts/fields';
import { Glass } from '../lib/glass';
import { done, toastError } from '../parts/toast';
import type { Settings } from '../lib/types';
import { leave, useGuard } from '../lib/guard';

type Sel = { a: string; b?: string; only?: number[] } | null;
type Tab = 'nights' | 'discounts';

export default function Prices() {
  const [tab, setTab] = useState<Tab>('nights');
  return (
    <div className="fade-in">
      <Tabs selectedKey={tab} onSelectionChange={k => leave(() => setTab(k as Tab))} className="mb-5">
        <Tabs.ListContainer><Tabs.List aria-label="Preus" className="w-fit">
          <Tabs.Tab id="nights">Per nit<Tabs.Indicator /></Tabs.Tab>
          <Tabs.Tab id="discounts">Descomptes<Tabs.Indicator /></Tabs.Tab>
        </Tabs.List></Tabs.ListContainer>
      </Tabs>
      {tab === 'nights' ? <Nights /> : <Discounts />}
    </div>
  );
}

// ---------- Per nit ----------
function Nights() {
  const stays = useStore(s => s.stays);
  const S = useStore(s => s.settings)!;
  const map = useStore(s => s.bookings);
  const [stay, setStay] = useState(stays[0]?.id || '');
  const [month, setMonth] = useState(TODAY.slice(0, 7) + '-01');
  const [sel, setSel] = useState<Sel>(null);

  const m = parse(month), end = iso(new Date(m.getFullYear(), m.getMonth() + 1, 1)), lead = (m.getDay() + 6) % 7;
  const nightOf = (d: string) => {
    const sp = S.days[stay]?.[d]?.price;
    if (sp != null) return { price: sp, special: true };
    const dow = parse(d).getDay(), st = S.stays[stay];
    return { price: (dow === 5 || dow === 6) && st.weekend != null ? st.weekend : st.base, special: false };
  };
  // The weekend quick pick keeps only Friday and Saturday nights
  const dates = useMemo(() => {
    if (!sel) return [] as string[];
    const out: string[] = [];
    for (let d = sel.a; d <= (sel.b || sel.a); d = addDays(d, 1)) if (!sel.only || sel.only.includes(parse(d).getDay())) out.push(d);
    return out;
  }, [sel]);
  const chosen = new Set(dates);
  const booked = (d: string) => [...map.values()].some(b => b.blocks && b.stay === stay && b.first <= d && b.until > d);
  const days = Array.from({ length: nightsBetween(month, end) }, (_, i) => addDays(month, i));

  async function moveMonth(n: number) {
    const next = iso(new Date(m.getFullYear(), m.getMonth() + n, 1));
    setMonth(next); setSel(null);
    try { await ensure(next, iso(new Date(m.getFullYear(), m.getMonth() + n + 1, 1))); } catch (e) { /* the grid still shows prices */ }
  }
  const tap = (d: string) => {
    if (d < TODAY) return;
    if (sel && !sel.b && !sel.only && d >= sel.a) setSel({ ...sel, b: d }); else setSel({ a: d });
  };
  const quick = (k: 'weekends' | 'month') => {
    const last = iso(new Date(m.getFullYear(), m.getMonth() + 1, 0)), first = month < TODAY ? TODAY : month;
    setSel(k === 'month' ? { a: first, b: last } : { a: first, b: last, only: [5, 6] });
  };
  const title = cap(m.toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' }));

  return (
    <div>
      <ToggleButtonGroup aria-label="Allotjament" selectionMode="single" disallowEmptySelection selectedKeys={new Set([stay])}
        onSelectionChange={(k: Set<Key>) => { const [v] = k; if (v) leave(() => { setStay(String(v)); setSel(null); }); }} size="sm" className="mb-5 max-w-full overflow-x-auto">
        {stays.map(s => <ToggleButton key={s.id} id={s.id}>{shortName(s.id)}</ToggleButton>)}
      </ToggleButtonGroup>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="card p-3 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="mr-auto text-xl font-semibold tracking-tight">{title}</h2>
            <Button isIconOnly size="sm" variant="ghost" aria-label="Mes anterior" isDisabled={month <= TODAY.slice(0, 7) + '-01'} onPress={() => moveMonth(-1)}><ChevronLeft size={18} /></Button>
            <Button isIconOnly size="sm" variant="ghost" aria-label="Mes següent" onPress={() => moveMonth(1)}><ChevronRight size={18} /></Button>
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5" role="grid" aria-label={`Preus de ${stayName(stay)}, ${title}`}>
            {['dl', 'dt', 'dc', 'dj', 'dv', 'ds', 'dg'].map(w => <div key={w} className="pb-1 text-center text-xs font-medium text-muted">{w}</div>)}
            {Array.from({ length: lead }, (_, i) => <div key={'b' + i} />)}
            {days.map(d => {
              const n = nightOf(d), min = S.days[stay]?.[d]?.min, past = d < TODAY, on = chosen.has(d), bk = booked(d);
              return (
                <button key={d} type="button" disabled={past} onClick={() => tap(d)} aria-pressed={on}
                  aria-label={`${day(d, { weekday: 'long', day: 'numeric', month: 'long' })}, ${euro(n.price * 100)}${min ? `, mínim ${nitsTxt(min)}` : ''}${bk ? ', ocupat' : ''}`}
                  className={`relative flex h-16 flex-col justify-between rounded-xl p-1.5 text-left outline-none transition-colors duration-100 focus-visible:ring-2 focus-visible:ring-focus sm:h-[78px] sm:rounded-xl sm:p-2.5
                    ${past ? 'cursor-default opacity-35' : 'hover:bg-[var(--row-hover)]'} ${on ? '!bg-accent/20 ring-2 ring-accent' : bk ? 'booked-night ring-1 ring-inset ring-accent/40' : n.special ? 'bg-[color-mix(in_oklab,var(--brand-cava)_20%,transparent)]' : 'bg-default/40'}`}>
                  <span className="flex items-start justify-between gap-1">
                    <span className="flex items-center gap-1.5">
                      <span className={`text-xs tnum ${d === TODAY ? 'font-bold text-accent' : 'text-muted'}`}>{parse(d).getDate()}</span>
                    </span>
                    {min ? <span className="rounded-md bg-foreground/10 px-1 text-xs font-semibold">{min}n</span> : null}
                  </span>
                  <span className={`text-[13px] tnum sm:text-base ${n.special ? 'font-semibold' : ''}`}>{n.price.toLocaleString('ca-ES')} €</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
            <span className="inline-flex items-center gap-2"><span className="size-3.5 rounded-[4px] bg-[color-mix(in_oklab,var(--brand-cava)_45%,transparent)]" />Preu especial</span>
            <span className="inline-flex items-center gap-2"><span className="rounded bg-foreground/10 px-1 text-xs font-semibold text-foreground">3n</span>Estada mínima</span>
            <span className="inline-flex items-center gap-2"><span className="booked-night size-3.5 rounded-[4px] ring-1 ring-inset ring-accent/40" />Ocupat</span>
            <span className="ml-auto flex gap-2">
              <Button size="sm" variant="tertiary" onPress={() => quick('weekends')}>Caps de setmana</Button>
              <Button size="sm" variant="tertiary" onPress={() => quick('month')}>Tot el mes</Button>
            </span>
          </div>
        </section>

        <aside className="xl:sticky xl:top-24">
          {sel && dates.length ? <DaysPanel key={[sel.a, sel.b, sel.only, stay].join('|')} stay={stay} dates={dates} sel={sel} S={S} nightOf={nightOf} onDone={() => setSel(null)} />
            : <NormalPanel key={stay} stay={stay} S={S} />}
        </aside>
      </div>
    </div>
  );
}

function Panel({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 fade-in">
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function NormalPanel({ stay, S }: { stay: string; S: Settings }) {
  const st = S.stays[stay];
  const [base, setBase] = useState(String(st.base)); const [weekend, setWeekend] = useState(st.weekend == null ? '' : String(st.weekend));
  const [busy, setBusy] = useState(false);
  const dirty = base !== String(st.base) || weekend !== (st.weekend == null ? '' : String(st.weekend));
  const save = async () => {
    setBusy(true); let ok = false;
    try { setSettings(await api<Settings>('settings', { method: 'PUT', body: { stays: { [stay]: { base, weekend: weekend === '' ? null : weekend } } } })); done('Preu desat'); ok = true; }
    catch (e) { toastError(e); }
    setBusy(false); return ok;
  };
  useGuard(dirty, save);
  return (
    <Panel title="Preu normal" sub={stayName(stay)}>
      <Field label="Preu per nit (€)" value={base} onChange={setBase} inputMode="decimal" />
      <Field label="Divendres i dissabte (€)" value={weekend} onChange={setWeekend} inputMode="decimal" placeholder="El mateix" />
      <Button fullWidth isPending={busy} onPress={save}>{busy && <Spinner size="sm" color="current" />}Desa</Button>
      <p className="text-xs text-muted">Toca un dia del calendari, o el primer i l'últim d'un període, per posar-hi un preu especial o una estada mínima.</p>
    </Panel>
  );
}

function DaysPanel({ stay, dates, sel, S, nightOf, onDone }: { stay: string; dates: string[]; sel: NonNullable<Sel>; S: Settings; nightOf: (d: string) => { price: number }; onDone: () => void }) {
  const stays = useStore(s => s.stays);
  const specials = [...new Set(dates.map(d => S.days[stay]?.[d]?.price ?? null))];
  const mins = [...new Set(dates.map(d => S.days[stay]?.[d]?.min ?? null))];
  const prices = [...new Set(dates.map(d => nightOf(d).price))];
  const price0 = specials.length === 1 && specials[0] != null ? String(specials[0]) : '', min0 = mins.length === 1 && mins[0] ? String(mins[0]) : 'normal';
  const [price, setPrice] = useState(price0);
  const [min, setMin] = useState(min0);
  const [also, setAlso] = useState<string[]>([]);
  const [busy, setBusy] = useState<'' | 'save' | 'reset'>('');
  useEffect(() => { setAlso([]); }, [stay]);
  const a = dates[0], z = dates[dates.length - 1];
  const title = sel.only ? `Divendres i dissabtes (${dates.length} nits)` : dates.length === 1 ? cap(day(a, { weekday: 'long', day: 'numeric', month: 'long' })) : `${day(a, { day: 'numeric', month: 'short' })} – ${day(z, { day: 'numeric', month: 'short' })} (${dates.length} dies)`;
  const now = `${stayName(stay)}. Ara: ${prices.length === 1 ? euro(prices[0] * 100) : `entre ${euro(Math.min(...prices) * 100)} i ${euro(Math.max(...prices) * 100)}`} la nit${mins.length === 1 && mins[0] ? `, mínim ${nitsTxt(mins[0])}` : ''}.`;
  const send = async (body: { price: string | null; min: string | null }, kind: 'save' | 'reset', msg: string) => {
    setBusy(kind); let ok = false;
    try { const r = await api<{ days: Settings['days'] }>('days', { method: 'POST', body: { stays: [stay, ...also], dates, ...body } }); setSettings({ ...S, days: r.days }); done(msg); ok = true; onDone(); }
    catch (e) { toastError(e); }
    setBusy(''); return ok;
  };
  const apply = () => send({ price: price === '' ? null : price, min: min === 'normal' ? null : min }, 'save', 'Dies actualitzats');
  useGuard(price !== price0 || min !== min0, apply);
  return (
    <Panel title={title} sub={now}>
      <Field label="Preu per nit (€)" value={price} onChange={setPrice} inputMode="decimal" placeholder="Preu normal" />
      <Choice label="Estada mínima si s'arriba aquests dies" value={min} onChange={setMin}
        items={[{ id: 'normal', name: `Normal (${nitsTxt(S.rules.minNights)})` }, ...Array.from({ length: 14 }, (_, i) => ({ id: String(i + 1), name: nitsTxt(i + 1) }))]} />
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted">Aplica-ho també a</div>
        {stays.filter(s => s.id !== stay).map(s => <Check key={s.id} isSelected={also.includes(s.id)} onChange={v => setAlso(x => v ? [...x, s.id] : x.filter(y => y !== s.id))}>{s.name}</Check>)}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button isPending={busy === 'save'} onPress={apply}>{busy === 'save' && <Spinner size="sm" color="current" />}Aplica</Button>
        <Button variant="secondary" isPending={busy === 'reset'} onPress={() => send({ price: null, min: null }, 'reset', 'Dies tornats al preu normal')}>Torna al normal</Button>
        <Button variant="ghost" onPress={onDone}><X size={15} />Desfés la selecció</Button>
      </div>
    </Panel>
  );
}

// ---------- Descomptes ----------
type Tier = { nights: string; pct: string };

function Discounts() {
  const S = useStore(s => s.settings)!;
  const stays = useStore(s => s.stays);
  const [tiers, setTiers] = useState<Tier[]>(() => S.discounts.map(t => ({ nights: String(t.nights), pct: String(t.pct) })));
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const set = (i: number, k: keyof Tier) => (v: string) => setTiers(ts => ts.map((t, j) => j === i ? { ...t, [k]: v } : t));
  const add = () => setTiers(ts => { const last = ts[ts.length - 1]; return [...ts, { nights: String(last ? +last.nights + 4 : 2), pct: String(last ? Math.min(+last.pct + 5, 90) : 5) }]; });
  const dirty = JSON.stringify(tiers) !== JSON.stringify(S.discounts.map(t => ({ nights: String(t.nights), pct: String(t.pct) })));
  const save = async () => {
    setBusy(true); setErr(''); let ok = false;
    try {
      const next = await api<Settings>('settings', { method: 'PUT', body: { discounts: tiers.map(t => ({ nights: Number(t.nights), pct: Number(t.pct) })) } });
      setSettings(next); setTiers(next.discounts.map(t => ({ nights: String(t.nights), pct: String(t.pct) }))); done('Descomptes desats'); ok = true;
    } catch (e) { setErr((e as Error).message); }
    setBusy(false); return ok;
  };
  useGuard(dirty, save);
  const s = stays[0], base = s ? S.stays[s.id].base : 0;
  const pctFor = (n: number) => tiers.filter(t => n >= +t.nights).reduce((b, t) => Math.max(b, +t.pct || 0), 0);

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">Descomptes per estada llarga</h2>
        <p className="mt-1 text-sm text-muted">Com més nits, més descompte. S'aplica el més alt que toqui. A la web, els textos que en parlen s'actualitzen sols.</p>
        <div className="mt-5 space-y-2">
          {tiers.length ? tiers.map((t, i) => (
            <div key={i} className="flex flex-wrap items-end gap-3 rounded-2xl bg-default/50 p-3">
              <Field label="A partir de (nits)" value={t.nights} onChange={set(i, 'nights')} inputMode="numeric" className="w-36" />
              <Field label="Descompte (%)" value={t.pct} onChange={set(i, 'pct')} inputMode="numeric" className="w-36" />
              <Button isIconOnly variant="ghost" aria-label="Treu aquest descompte" className="ml-auto" onPress={() => setTiers(ts => ts.filter((_, j) => j !== i))}><Trash2 size={16} /></Button>
            </div>
          )) : <p className="rounded-2xl bg-default/50 p-4 text-sm text-muted">Sense descomptes: totes les estades paguen el preu per nit.</p>}
        </div>
        {err && <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{err}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="secondary" onPress={add}><Plus size={16} />Afegeix un descompte</Button>
          <Button isPending={busy} onPress={save}>{busy && <Spinner size="sm" color="current" />}Desa els descomptes</Button>
        </div>
      </section>
      {s && (
        <Glass lively radius={18} className="lg:sticky lg:top-24">
          <div className="p-5 sm:p-6">
            <div className="text-xs font-medium text-muted">Exemple</div>
            <div className="mt-1 text-base font-semibold">{s.name} a {euro(base * 100)} la nit</div>
            <table className="mt-4 w-full text-sm tnum">
              <tbody>
                {[1, 2, 3, 5, 7, 14].map(n => { const p = pctFor(n); return (
                  <tr key={n} className="border-t border-separator">
                    <td className="py-2.5">{nitsTxt(n)}</td>
                    <td className="py-2.5 text-right">{p ? <span className="text-sm text-muted tnum">−{p} %</span> : null}</td>
                    <td className="py-2.5 text-right font-semibold">{euro(Math.round(base * n * (100 - p)))}</td>
                  </tr>
                ); })}
              </tbody>
            </table>
          </div>
        </Glass>
      )}
    </div>
  );
}
