// Analítica: the P&L of a period (functions/api/maite/analytics.js, lib/pnl.js). What came in from the stays (by night) and the
// restaurant (Cobrat), what went out (the expenses sheet by category, and the Meta ads), and the gross profit. The same figures
// go in the Monday email. The expenses sheet is linked here.
import { useEffect, useState } from 'react';
import { Button, Skeleton, Spinner, ToggleButton, ToggleButtonGroup, type Key } from '@heroui/react';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { api } from '../lib/api';
import { TODAY, addDays, cap, day, euro, iso, parse } from '../lib/dates';
import { DayPicker } from '../parts/DayPicker';
import { Field } from '../parts/fields';
import { done, toastError } from '../parts/toast';

// A line of the statement; lines opens it into the ones under it (an accommodation into its bookings, a category into its rows)
type Line = { label: string; sub?: string; cents: number; auto?: boolean; lines?: Line[] };
type Month = { month: string; label: string; income: number; expenses: number; profit: number };
type Pnl = { from: string; to: string; income: Line[]; incomeTotal: number; expenses: Line[]; expensesTotal: number; profit: number; margin: number | null;
  months: Month[] | null; unpaidTables: number; sheet: { connected: boolean; url: string; error: string | null; share: string } };

type Span = 'week' | 'month' | 'last' | 'year' | 'custom';
const SPANS: { id: Span; label: string }[] = [{ id: 'week', label: 'Setmana passada' }, { id: 'month', label: 'Aquest mes' }, { id: 'last', label: 'Mes passat' }, { id: 'year', label: 'Aquest any' }, { id: 'custom', label: 'Dates' }];
function rangeOf(s: Span | 'custom'): [string, string] {
  const t = parse(TODAY);
  if (s === 'week') { const mon = addDays(TODAY, -((t.getDay() + 6) % 7)); return [addDays(mon, -7), mon]; }
  if (s === 'month') return [TODAY.slice(0, 8) + '01', addDays(TODAY, 1)];
  if (s === 'last') return [iso(new Date(t.getFullYear(), t.getMonth() - 1, 1)), TODAY.slice(0, 8) + '01'];
  return [TODAY.slice(0, 5) + '01-01', addDays(TODAY, 1)];
}
const SHEET_ERRORS: Record<string, string> = {
  no_sheet: 'Encara no hi ha cap full de despeses connectat.',
  sheet_access: "Maite no pot llegir el full: comparteix-lo amb el compte de sota (només lectura).",
  sheet_columns: 'El full no té les columnes Data i Import a la primera pestanya.',
  sheet: "No s'ha pogut llegir el full. Torna-ho a provar més tard.",
};

export default function Analytics() {
  const [span, setSpan] = useState<Span>(() => { try { const v = localStorage.getItem('maite-analytics-span'); return SPANS.some(s => s.id === v) ? v as Span : 'month'; } catch { return 'month'; } });
  const [data, setData] = useState<Pnl | null>(null);
  const [n, setN] = useState(0);
  // Dates: from and the last day, both included; the API takes the day after
  const [own, setOwn] = useState<{ from: string; last: string }>(() => ({ from: TODAY.slice(0, 8) + '01', last: TODAY }));
  const [from, to] = span === 'custom' ? [own.from, own.last ? addDays(own.last, 1) : ''] : rangeOf(span);
  const ok = !!from && !!to && from < to;
  useEffect(() => { if (!ok) return; setData(null); api<Pnl>(`analytics?from=${from}&to=${to}`).then(setData).catch(toastError); }, [from, to, n]);
  const pick = (s: Span) => { setSpan(s); try { localStorage.setItem('maite-analytics-span', s); } catch { /* private window */ } };

  return (
    <div className="fade-in space-y-5">
      <ToggleButtonGroup aria-label="Període" selectionMode="single" disallowEmptySelection selectedKeys={new Set([span])}
        onSelectionChange={(k: Set<Key>) => { const [v] = k; if (v) pick(v as Span); }} size="sm">
        {SPANS.map(s => <ToggleButton key={s.id} id={s.id}>{s.label}</ToggleButton>)}
      </ToggleButtonGroup>
      {span === 'custom' && (
        <div className="flex flex-wrap items-end gap-3">
          <DayPicker label="Des de" value={own.from} past onChange={v => setOwn({ ...own, from: v })} />
          <DayPicker label="Fins a" value={own.last} past onChange={v => setOwn({ ...own, last: v })} />
          {!ok && <p className="text-sm text-warning">El primer dia ha de ser abans de l'últim.</p>}
        </div>
      )}
      {!data ? <Skeleton className="h-[480px] rounded-2xl" /> : (
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="space-y-5">
            <Statement p={data} />
            {data.months && <Months list={data.months} />}
          </div>
          <Sheet p={data} onChange={() => setN(n + 1)} />
        </div>
      )}
    </div>
  );
}

// A line of the statement; with lines under it, it opens and closes. depth indents the ones under
function Row({ line, depth = 0 }: { line: Line; depth?: number }) {
  const [open, setOpen] = useState(false), can = !!line.lines?.length;
  const body = (
    <>
      {can ? <ChevronRight size={15} aria-hidden className={`mt-0.5 shrink-0 text-muted transition-transform ${open ? 'rotate-90' : ''}`} /> : <span className="w-[15px] shrink-0" />}
      <span className="min-w-0 flex-1">{line.label}{line.sub && <span className="block text-xs text-muted">{line.sub}</span>}</span>
      <span className="tnum">{euro(line.cents) || '0 €'}</span>
    </>
  );
  return (
    <>
      {can ? <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} style={{ paddingLeft: depth * 20 }}
        className="flex w-full items-start gap-2 border-b border-separator py-2.5 text-left text-sm outline-none hover:bg-default/40 focus-visible:ring-2 focus-visible:ring-focus">{body}</button>
        : <div style={{ paddingLeft: depth * 20 }} className="flex items-start gap-2 border-b border-separator py-2.5 text-sm">{body}</div>}
      {open && line.lines!.map((l, k) => <Row key={k} line={l} depth={depth + 1} />)}
    </>
  );
}
const Total = ({ label, cents }: { label: string; cents: number }) => (
  <div className="flex items-baseline gap-2 border-b border-separator py-2.5 text-sm font-semibold"><span className="w-[15px] shrink-0" /><span className="flex-1">{label}</span><span className="tnum">{euro(cents) || '0 €'}</span></div>
);

// Income, expenses and the gross profit of the period
function Statement({ p }: { p: Pnl }) {
  const last = addDays(p.to, -1);
  return (
    <section className="card p-4 sm:p-6" aria-label="Pèrdues i guanys">
      <h2 className="text-base font-semibold">Pèrdues i guanys</h2>
      <p className="text-sm text-muted">{cap(day(p.from, { day: 'numeric', month: 'long' }))} a {day(last, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <div className="mt-4">
        {p.income.map(x => <Row key={x.label} line={x} />)}
        <Total label="Ingressos" cents={p.incomeTotal} />
        {p.unpaidTables > 0 && <p className="py-2 text-sm text-warning">{p.unpaidTables === 1 ? "1 taula del període no té l'import apuntat a Cobrat." : `${p.unpaidTables} taules del període no tenen l'import apuntat a Cobrat.`}</p>}
        <div className="mt-4">
          {p.expenses.map(x => <Row key={x.label} line={x} />)}
          {!p.expenses.length && <p className="border-b border-separator py-2.5 text-sm text-muted">Cap despesa en aquest període.</p>}
          <Total label="Despeses" cents={p.expensesTotal} />
        </div>
      </div>
      <div className="mt-5">
        <div className="text-sm text-muted">Benefici brut</div>
        <div className={`text-3xl font-semibold tracking-tight tnum ${p.profit < 0 ? 'text-danger' : ''}`}>{euro(p.profit) || '0 €'}</div>
        {p.margin != null && <div className="text-sm text-muted tnum">{p.margin} % dels ingressos</div>}
        {!p.sheet.connected && <p className="mt-2 text-sm text-warning">Sense el full de despeses, aquí només hi ha els anuncis.</p>}
      </div>
    </section>
  );
}

// Month by month, when the period has more than one
function Months({ list }: { list: Month[] }) {
  return (
    <section className="card p-4 sm:p-6" aria-label="Mes a mes">
      <h2 className="text-base font-semibold">Mes a mes</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-muted"><th className="py-2 font-normal">Mes</th><th className="py-2 text-right font-normal">Ingressos</th><th className="py-2 text-right font-normal">Despeses</th><th className="py-2 text-right font-normal">Benefici brut</th></tr></thead>
          <tbody>{list.map(m => (
            <tr key={m.month} className="border-t border-separator">
              <td className="py-2.5 pr-3">{m.label}</td>
              <td className="py-2.5 text-right tnum">{euro(m.income) || '0 €'}</td>
              <td className="py-2.5 text-right tnum">{euro(m.expenses) || '0 €'}</td>
              <td className={`py-2.5 text-right font-semibold tnum ${m.profit < 0 ? 'text-danger' : ''}`}>{euro(m.profit) || '0 €'}</td>
            </tr>))}</tbody>
        </table>
      </div>
    </section>
  );
}

// The expenses sheet: linked, or how to link it; its rows open under each category of the statement
function Sheet({ p, onChange }: { p: Pnl; onChange: () => void }) {
  const [link, setLink] = useState(''), [busy, setBusy] = useState(false), [edit, setEdit] = useState(false);
  async function save(sheet: string) {
    setBusy(true);
    try { await api('analytics', { method: 'PUT', body: { sheet } }); done(sheet ? 'Full de despeses connectat' : 'Full desconnectat'); setEdit(false); setLink(''); onChange(); }
    catch (e) { toastError(e); }
    setBusy(false);
  }
  const form = (
    <div className="mt-3 space-y-3">
      <p className="text-sm">La primera pestanya ha de tenir les columnes Data, Concepte, Categoria i Import. Comparteix el full amb <span className="break-all">{p.sheet.share || 'el compte de servei de Maite'}</span> (només lectura).</p>
      <Field label="Enllaç del full" value={link} onChange={setLink} placeholder="https://docs.google.com/spreadsheets/d/…" />
      <div className="flex justify-end gap-2">
        {edit && <Button size="sm" variant="ghost" onPress={() => setEdit(false)}>Cancel·la</Button>}
        <Button size="sm" isPending={busy} isDisabled={!link.trim()} onPress={() => save(link.trim())}>{busy && <Spinner size="sm" color="current" />}Connecta</Button>
      </div>
    </div>
  );
  return (
    <section className="card p-4 sm:p-5 lg:sticky lg:top-24" aria-label="Full de despeses">
      <div className="flex items-center gap-2">
        <h2 className="mr-auto text-base font-semibold">Full de despeses</h2>
        {p.sheet.url && <a href={p.sheet.url} target="_blank" rel="noopener" className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium outline-none hover:bg-default focus-visible:ring-2 focus-visible:ring-focus"><ExternalLink size={15} />Obre el full</a>}
      </div>
      {p.sheet.error && <p className={`mt-1 text-sm ${p.sheet.error === 'no_sheet' ? 'text-muted' : 'text-warning'}`}>{SHEET_ERRORS[p.sheet.error] || SHEET_ERRORS.sheet}</p>}
      {!p.sheet.url || edit ? form : <>
        {p.sheet.connected && <p className="mt-1 text-sm text-muted">Cada categoria de despeses s'obre amb els seus apunts.</p>}
        <div className="mt-3 flex justify-end gap-2">
          <Button size="sm" variant="ghost" isPending={busy} onPress={() => save('')}>Desconnecta</Button>
          <Button size="sm" variant="secondary" onPress={() => setEdit(true)}>Canvia el full</Button>
        </div>
      </>}
    </section>
  );
}
