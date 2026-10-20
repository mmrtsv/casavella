// Descomptes: longer stays pay less; the highest discount that applies wins
import { useState } from 'react';
import { Button, Spinner } from '@heroui/react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { euro, nitsTxt } from '../lib/dates';
import { setSettings, useStore } from '../lib/store';
import { Field } from '../parts/fields';
import { Glass } from '../lib/glass';
import { done } from '../parts/toast';
import type { Settings } from '../lib/types';

type Tier = { nights: string; pct: string };

export default function Discounts() {
  const S = useStore(s => s.settings)!;
  const stays = useStore(s => s.stays);
  const [tiers, setTiers] = useState<Tier[]>(() => S.discounts.map(t => ({ nights: String(t.nights), pct: String(t.pct) })));
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const set = (i: number, k: keyof Tier) => (v: string) => setTiers(ts => ts.map((t, j) => j === i ? { ...t, [k]: v } : t));
  const add = () => setTiers(ts => { const last = ts[ts.length - 1]; return [...ts, { nights: String(last ? +last.nights + 4 : 2), pct: String(last ? Math.min(+last.pct + 5, 90) : 5) }]; });
  const save = async () => {
    setBusy(true); setErr('');
    try {
      const next = await api<Settings>('settings', { method: 'PUT', body: { discounts: tiers.map(t => ({ nights: Number(t.nights), pct: Number(t.pct) })) } });
      setSettings(next); setTiers(next.discounts.map(t => ({ nights: String(t.nights), pct: String(t.pct) }))); done('Descomptes desats');
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  const s = stays[0], base = s ? S.stays[s.id].base : 0;
  const pctFor = (n: number) => tiers.filter(t => n >= +t.nights).reduce((b, t) => Math.max(b, +t.pct || 0), 0);

  return (
    <div className="fade-in grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="rounded-3xl bg-surface p-5 shadow-[var(--surface-shadow)] ring-1 ring-border sm:p-6">
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
        <Glass lively radius={28} className="lg:sticky lg:top-24">
          <div className="p-5 sm:p-6">
            <div className="text-xs font-medium text-muted">Exemple</div>
            <div className="mt-1 text-base font-semibold">{s.name} a {euro(base * 100)} la nit</div>
            <table className="mt-4 w-full text-sm tnum">
              <tbody>
                {[1, 2, 3, 5, 7, 14].map(n => { const p = pctFor(n); return (
                  <tr key={n} className="border-t border-separator">
                    <td className="py-2.5">{nitsTxt(n)}</td>
                    <td className="py-2.5 text-right">{p ? <span className="status paid">−{p} %</span> : null}</td>
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
