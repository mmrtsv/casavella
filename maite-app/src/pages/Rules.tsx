// Normes: minimum and maximum stay, how far ahead guests can book, check-in and out times, and the cancellation policy
import { useState } from 'react';
import { Button, Spinner } from '@heroui/react';
import { api } from '../lib/api';
import { setSettings, useStore } from '../lib/store';
import { Choice, Field } from '../parts/fields';
import { done } from '../parts/toast';
import { policyText } from '../lib/words';
import { useGuard } from '../lib/guard';
import type { Policy, Settings } from '../lib/types';

const PRESETS: Record<string, Policy & { name: string }> = {
  flexible: { name: 'Flexible', fullDays: 1, partialDays: null, partialPct: 0 },
  moderate: { name: 'Moderada', fullDays: 7, partialDays: 2, partialPct: 50 },
  strict: { name: 'Estricta', fullDays: 30, partialDays: 14, partialPct: 50 },
  none: { name: 'No reemborsable', fullDays: null, partialDays: null, partialPct: 0 },
};
const same = (a: Policy, b: Policy) => (a.fullDays ?? null) === (b.fullDays ?? null) && (a.partialPct || 0) === (b.partialPct || 0) && (!a.partialPct || (a.partialDays ?? null) === (b.partialDays ?? null));
const ADVANCE = [{ id: '90', name: '3 mesos abans' }, { id: '180', name: '6 mesos abans' }, { id: '270', name: '9 mesos abans' }, { id: '365', name: '1 any abans' }, { id: '545', name: '18 mesos abans' }, { id: '730', name: '2 anys abans' }];

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-separator py-6 first:border-t-0 first:pt-0 md:grid-cols-[220px_1fr] md:gap-8">
      <div><h2 className="text-base font-semibold">{title}</h2>{hint && <p className="mt-1 text-sm text-muted">{hint}</p>}</div>
      <div>{children}</div>
    </section>
  );
}

export default function Rules() {
  const S = useStore(s => s.settings)!;
  const r = S.rules;
  const [f, setF] = useState({ minNights: String(r.minNights), maxNights: String(r.maxNights), minAdvance: String(r.minAdvance), maxAdvance: String(r.maxAdvance), checkin: r.checkin, checkout: r.checkout });
  const [c, setC] = useState({ fullDays: S.cancel.fullDays == null ? '' : String(S.cancel.fullDays), partialPct: String(S.cancel.partialPct || 0), partialDays: S.cancel.partialDays == null ? '' : String(S.cancel.partialDays) });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const set = (k: keyof typeof f) => (v: string) => setF(x => ({ ...x, [k]: v }));
  const setc = (k: keyof typeof c) => (v: string) => setC(x => ({ ...x, [k]: v }));
  const policy: Policy = { fullDays: c.fullDays === '' ? null : Number(c.fullDays), partialDays: c.partialDays === '' ? null : Number(c.partialDays), partialPct: Number(c.partialPct) || 0 };
  const advance = ADVANCE.some(a => a.id === f.maxAdvance) ? ADVANCE : [...ADVANCE, { id: f.maxAdvance, name: `${f.maxAdvance} dies abans` }];
  const choose = (p: Policy) => setC({ fullDays: p.fullDays == null ? '' : String(p.fullDays), partialPct: String(p.partialPct || 0), partialDays: p.partialDays == null ? '' : String(p.partialDays) });
  const custom = !Object.values(PRESETS).some(p => same(p, policy));
  const was = S.cancel;
  const dirty = f.minNights !== String(r.minNights) || f.maxNights !== String(r.maxNights) || f.minAdvance !== String(r.minAdvance) || f.maxAdvance !== String(r.maxAdvance)
    || f.checkin !== r.checkin || f.checkout !== r.checkout
    || (policy.fullDays ?? null) !== (was.fullDays ?? null) || policy.partialPct !== (was.partialPct || 0) || (policy.partialPct > 0 && (policy.partialDays ?? null) !== (was.partialDays ?? null));
  const save = async () => {
    setBusy(true); setErr(''); let ok = false;
    try { setSettings(await api<Settings>('settings', { method: 'PUT', body: { rules: f, cancel: policy } })); done('Normes desades'); ok = true; }
    catch (e) { setErr((e as Error).message); }
    setBusy(false); return ok;
  };
  useGuard(dirty, save);
  return (
    <div className="fade-in rounded-3xl bg-surface p-5 shadow-[var(--surface-shadow)] ring-1 ring-border sm:p-8">
      <Section title="Estada" hint="El mínim es pot canviar per a dies concrets (agost, ponts…) des de Preus.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mínim de nits" value={f.minNights} onChange={set('minNights')} inputMode="numeric" />
          <Field label="Màxim de nits" value={f.maxNights} onChange={set('maxNights')} inputMode="numeric" />
        </div>
      </Section>
      <Section title="Antelació" hint="0 vol dir que es pot reservar el mateix dia. Per telèfon o des de Maite sempre es pot.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Com a mínim, dies abans" value={f.minAdvance} onChange={set('minAdvance')} inputMode="numeric" />
          <Choice label="Com a molt" value={f.maxAdvance} onChange={set('maxAdvance')} items={advance} />
        </div>
      </Section>
      <Section title="Horari">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Entrada a partir de" type="time" value={f.checkin} onChange={set('checkin')} />
          <Field label="Sortida abans de" type="time" value={f.checkout} onChange={set('checkout')} />
        </div>
      </Section>
      <Section title="Política de cancel·lació" hint="Cada reserva de la web guarda la política que l'hoste va acceptar. En cancel·lar-la, Maite proposa el retorn segons aquella política.">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5" role="radiogroup" aria-label="Política">
          {[...Object.entries(PRESETS), ['custom', null] as const].map(([k, p]) => {
            const on = p ? same(p, policy) : custom;
            return (
              <button key={k} type="button" role="radio" aria-checked={on} onClick={() => p && choose(p)}
                className={`rounded-2xl p-3.5 text-left outline-none ring-1 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-focus ${on ? 'bg-accent/15 ring-accent' : 'bg-default/40 ring-border hover:bg-default/70'}`}>
                <div className="text-sm font-semibold">{p ? p.name : 'A mida'}</div>
                <div className="mt-1 text-xs leading-snug text-muted">{p ? policyText(p) : 'Tria els dies i el percentatge a sota.'}</div>
              </button>
            );
          })}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Retorn complet fins a" value={c.fullDays} onChange={setc('fullDays')} inputMode="numeric" placeholder="Mai" help="Dies abans de l'arribada" />
          <Field label="Després es retorna (%)" value={c.partialPct} onChange={setc('partialPct')} inputMode="numeric" />
          <Field label="Fins a" value={c.partialDays} onChange={setc('partialDays')} inputMode="numeric" help="Dies abans de l'arribada" />
        </div>
        <div className="mt-4 rounded-2xl bg-default/50 p-4">
          <div className="text-xs font-medium text-muted">El que veu l'hoste</div>
          <p className="mt-1 text-sm">{policyText(policy)}</p>
        </div>
      </Section>
      {err && <p role="alert" className="mb-3 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{err}</p>}
      <div className="flex justify-end border-t border-separator pt-5"><Button isPending={busy} onPress={save}>{busy && <Spinner size="sm" color="current" />}Desa les normes</Button></div>
    </div>
  );
}
