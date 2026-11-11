// Analítica: the P&L of a period (functions/api/maite/analytics.js, lib/pnl.js). What came in from the stays (by night) and the
// restaurant (Cobrat), what went out (the expenses sheet by category, and the Meta ads), and the gross profit. The same figures
// go in the Monday email. The expenses sheet is linked here.
import { useEffect, useState } from 'react';
import { Button, Skeleton, Spinner, ToggleButton, ToggleButtonGroup, type Key } from '@heroui/react';
import { ExternalLink } from 'lucide-react';
import { api } from '../lib/api';
import { TODAY, addDays, cap, day, euro, iso, parse } from '../lib/dates';
import { Field } from '../parts/fields';
import { done, toastError } from '../parts/toast';

type Line = { label: string; cents: number; auto?: boolean };
type Item = { date: string; concept: string; category: string; cents: number };
type Pnl = { from: string; to: string; income: Line[]; incomeTotal: number; expenses: Line[]; expensesTotal: number; profit: number; margin: number | null;
  items: Item[]; unpaidTables: number; sheet: { connected: boolean; url: string; error: string | null; share: string } };

type Span = 'week' | 'month' | 'last' | 'year';
const SPANS: { id: Span; label: string }[] = [{ id: 'week', label: 'Setmana passada' }, { id: 'month', label: 'Aquest mes' }, { id: 'last', label: 'Mes passat' }, { id: 'year', label: 'Aquest any' }];
function rangeOf(s: Span): [string, string] {
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
  const [from, to] = rangeOf(span);
  useEffect(() => { setData(null); api<Pnl>(`analytics?from=${from}&to=${to}`).then(setData).catch(toastError); }, [from, to, n]);
  const pick = (s: Span) => { setSpan(s); try { localStorage.setItem('maite-analytics-span', s); } catch { /* private window */ } };

  return (
    <div className="fade-in space-y-5">
      <ToggleButtonGroup aria-label="Període" selectionMode="single" disallowEmptySelection selectedKeys={new Set([span])}
        onSelectionChange={(k: Set<Key>) => { const [v] = k; if (v) pick(v as Span); }} size="sm">
        {SPANS.map(s => <ToggleButton key={s.id} id={s.id}>{s.label}</ToggleButton>)}
      </ToggleButtonGroup>
      {!data ? <Skeleton className="h-[480px] rounded-2xl" /> : (
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
          <Statement p={data} />
          <Sheet p={data} onChange={() => setN(n + 1)} />
        </div>
      )}
    </div>
  );
}

const Row = ({ label, cents, strong, note }: { label: string; cents: number; strong?: boolean; note?: string }) => (
  <div className={`flex items-baseline gap-3 border-b border-separator py-2.5 text-sm ${strong ? 'font-semibold' : ''}`}>
    <span className="min-w-0 flex-1">{label}{note && <span className="block text-xs font-normal text-muted">{note}</span>}</span>
    <span className="tnum">{euro(cents) || '0 €'}</span>
  </div>
);

// Income, expenses and the gross profit of the period
function Statement({ p }: { p: Pnl }) {
  const last = addDays(p.to, -1);
  return (
    <section className="card p-4 sm:p-6" aria-label="Pèrdues i guanys">
      <h2 className="text-base font-semibold">Pèrdues i guanys</h2>
      <p className="text-sm text-muted">{cap(day(p.from, { day: 'numeric', month: 'long' }))} a {day(last, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <div className="mt-4">
        {p.income.map(x => <Row key={x.label} label={x.label} cents={x.cents} />)}
        <Row label="Ingressos" cents={p.incomeTotal} strong />
        {p.unpaidTables > 0 && <p className="py-2 text-sm text-warning">{p.unpaidTables === 1 ? "1 taula del període no té l'import apuntat a Cobrat." : `${p.unpaidTables} taules del període no tenen l'import apuntat a Cobrat.`}</p>}
        <div className="mt-4">
          {p.expenses.map(x => <Row key={x.label} label={x.label} cents={x.cents} note={x.auto ? 'Del compte de Meta, no cal apuntar-ho al full' : undefined} />)}
          {!p.expenses.length && <p className="border-b border-separator py-2.5 text-sm text-muted">Cap despesa en aquest període.</p>}
          <Row label="Despeses" cents={p.expensesTotal} strong />
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

// The expenses sheet: linked, with the period's lines; or how to link it
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
        {p.sheet.connected && (p.items.length
          ? <ul className="mt-2 max-h-[60dvh] overflow-y-auto">{p.items.map((x, i) => (
              <li key={i} className="flex items-baseline gap-3 border-b border-separator py-2.5 text-sm">
                <div className="min-w-0 flex-1"><div className="truncate">{x.concept || x.category}</div><div className="text-xs text-muted">{cap(day(x.date, { day: 'numeric', month: 'short' }))}, {x.category}</div></div>
                <span className="tnum">{euro(x.cents)}</span>
              </li>))}</ul>
          : <p className="mt-2 text-sm text-muted">El full no té despeses en aquest període.</p>)}
        <div className="mt-3 flex justify-end gap-2">
          <Button size="sm" variant="ghost" isPending={busy} onPress={() => save('')}>Desconnecta</Button>
          <Button size="sm" variant="secondary" onPress={() => setEdit(true)}>Canvia el full</Button>
        </div>
      </>}
    </section>
  );
}
