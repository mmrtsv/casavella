// Client file: Resum (where the stay is at and the checklist), Reserva (dates, payment, policy), Client (contact, papers, other stays)
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button, Checkbox, ListBox, Select, Spinner, Tabs, TextArea, TextField, Label, Input, buttonVariants, type Key } from '@heroui/react';
import { Mail, Phone, MessageCircle, CreditCard, CalendarDays, Check, FolderOpen, Upload } from 'lucide-react';
import { SideSheet } from '../parts/Sheet';
import { Status } from '../parts/Status';
import { toastError, done } from '../parts/toast';
import { api, uploadDoc } from '../lib/api';
import { allBookings, keyOf, setBooking, shortName, stayName, reload, useStore } from '../lib/store';
import { closeDetail, openCancel, openDetail, useUI } from '../lib/ui';
import { day, euro, longDay, nightsBetween, nitsTxt, range, stamp, TODAY, cap } from '../lib/dates';
import { atHome, checklist, hasDocs, isBooking, METHOD, PAYTYPE, policyText, SOURCE, WALLET, who } from '../lib/words';
import type { Booking, Payment } from '../lib/types';

const btn = (variant: 'secondary' | 'tertiary' | 'ghost' = 'secondary') => buttonVariants({ variant, size: 'sm' }) as unknown as string;
const payments: Record<string, Payment> = {};

export function ClientFile() {
  const key = useUI(u => u.detail);
  const map = useStore(s => s.bookings);
  const b = key ? map.get(key) : undefined;
  const [tab, setTab] = useState<Key>('overview');
  useEffect(() => { setTab('overview'); }, [key]);
  if (!b) return <SideSheet isOpen={false} onClose={closeDetail} title=""><span /></SideSheet>;
  if (!isBooking(b)) return <OtherEntry b={b} />;
  const stage = b.checkout ? 'Ja ha marxat' : atHome(b) ? 'A casa' : b.first > TODAY ? `Arriba d'aquí a ${nightsBetween(TODAY, b.first) === 1 ? '1 dia' : nightsBetween(TODAY, b.first) + ' dies'}` : b.first === TODAY ? 'Arriba avui' : b.until < TODAY ? 'Estada acabada' : 'Hauria de ser a casa';
  return (
    <SideSheet isOpen onClose={closeDetail} title={who(b)}
      subtitle={<span className="flex flex-wrap items-center gap-x-3 gap-y-1"><Status b={b} /><span>{stage}</span><span>{shortName(b.stay)}</span><span className="tnum">{range(b.first, b.until)}</span></span>}>
      <Tabs selectedKey={tab} onSelectionChange={setTab} className="mt-2">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Fitxa">
            <Tabs.Tab id="overview">Resum<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="booking">Reserva<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="client">Client<Tabs.Indicator /></Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel id="overview" className="pt-5"><Overview b={b} toClient={() => setTab('client')} /></Tabs.Panel>
        <Tabs.Panel id="booking" className="pt-5"><BookingTab b={b} /></Tabs.Panel>
        <Tabs.Panel id="client" className="pt-5"><ClientTab b={b} /></Tabs.Panel>
      </Tabs>
    </SideSheet>
  );
}

// Saves a checklist change on the booking's calendar event and refreshes the row
async function save(b: Booking, set: Record<string, unknown>) {
  try { const d = await api<{ booking: Booking }>('check', { method: 'POST', body: { stay: b.stay, id: b.id, set } }); setBooking(d.booking); }
  catch (e) { toastError(e); }
}

function Row({ ok, title, sub, children, control }: { ok?: boolean; title: ReactNode; sub?: ReactNode; children?: ReactNode; control?: ReactNode }) {
  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5">
      {control ?? <span className={`grid size-[22px] shrink-0 place-items-center rounded-full ${ok ? 'bg-accent text-accent-foreground' : 'shadow-[inset_0_0_0_1.5px_color-mix(in_oklab,var(--foreground)_38%,transparent)]'}`} aria-hidden="true">{ok && <Check size={13} strokeWidth={3} />}</span>}
      <div className="min-w-0 flex-1"><div className="text-sm font-medium">{title}</div>{sub && <div className="mt-0.5 text-[13px] text-muted">{sub}</div>}</div>
      {children}
    </div>
  );
}
function Tick({ b, k, label }: { b: Booking; k: 'settled'; label: string }) {
  return (
    <Checkbox isSelected={!!b[k]} onChange={v => save(b, { [k]: v })} aria-label={label} className="shrink-0">
      <Checkbox.Content><Checkbox.Control className="!size-[22px] !rounded-full [&_svg]:!size-3"><Checkbox.Indicator /></Checkbox.Control></Checkbox.Content>
    </Checkbox>
  );
}
// ID documents: done only once photos or PDFs are uploaded to the booking's folder in Google Drive (no ticking by hand)
function Docs({ b }: { b: Booking }) {
  const input = useRef<HTMLInputElement>(null);
  const [left, setLeft] = useState(0);
  const upload = async (files: FileList | null) => {
    const list = [...(files || [])];
    if (!list.length) return;
    let ok = 0;
    for (const [i, f] of list.entries()) {
      setLeft(list.length - i);
      try { setBooking(await uploadDoc(b, f)); ok++; } catch (e) { toastError(e); }
    }
    setLeft(0); if (input.current) input.current.value = '';
    if (ok) done(ok === 1 ? 'Document desat a Drive' : `${ok} documents desats a Drive`);
  };
  return (
    <Row ok={hasDocs(b)} title="Documents d'identitat" sub={hasDocs(b) ? `A Google Drive${b.ref ? `, reserva ${b.ref}` : ''}` : 'Puja el DNI o passaport de tots els hostes adults.'}>
      <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
        {b.docsFolder && <a className={btn()} href={b.docsFolder} target="_blank" rel="noopener"><FolderOpen size={15} />Carpeta</a>}
        <Button size="sm" variant="secondary" isPending={left > 0} onPress={() => input.current?.click()}>
          {left > 0 ? <><Spinner size="sm" color="current" />Pujant{left > 1 ? ` (${left})` : ''}</> : <><Upload size={15} />Puja</>}
        </Button>
        <input ref={input} type="file" multiple accept="image/*,application/pdf" className="hidden" aria-label="Documents d'identitat" onChange={e => upload(e.target.files)} />
      </div>
    </Row>
  );
}
function Moment({ b, k, label, when }: { b: Booking; k: 'checkin' | 'checkout'; label: string; when: string }) {
  const [busy, setBusy] = useState(false);
  const run = async (v: boolean) => { setBusy(true); await save(b, { [k]: v }); setBusy(false); };
  return (
    <Row ok={!!b[k]} title={label} sub={b[k] ? `Fet ${stamp(b[k])}` : `Previst ${when}`}>
      {b[k]
        ? <Button size="sm" variant="ghost" isPending={busy} onPress={() => run(false)}>Desfés</Button>
        : <Button size="sm" isPending={busy} onPress={() => run(true)}>{busy && <Spinner size="sm" color="current" />}Marca {label.toLowerCase()}</Button>}
    </Row>
  );
}
function Memo({ b }: { b: Booking }) {
  const [v, setV] = useState(b.memo);
  useEffect(() => setV(b.memo), [b.memo]);
  return (
    <TextField value={v} onChange={setV} onBlur={() => { if (v !== b.memo) save(b, { memo: v }); }} fullWidth className="mt-5">
      <Label>Nota interna (només a Maite)</Label>
      <TextArea rows={2} placeholder="Claus, llit supletori, al·lèrgies…" />
    </TextField>
  );
}

function Overview({ b, toClient }: { b: Booking; toClient: () => void }) {
  const list = checklist(b), doneN = list.filter(c => c.ok).length;
  const rules = useStore(s => s.settings?.rules);
  const kpi = (label: string, value: ReactNode) => <div className="rounded-2xl bg-default/60 px-4 py-3"><div className="text-xs text-muted">{label}</div><div className="mt-1 text-xl font-semibold tnum">{value}</div></div>;
  return (
    <div className="fade-in">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {kpi('Nits', nightsBetween(b.first, b.until))}{kpi('Persones', b.guests || '–')}{kpi('Import', b.amount != null ? euro(b.amount) : '–')}
        <div className="rounded-2xl bg-default/60 px-4 py-3">
          <div className="text-xs text-muted">Llista</div>
          <div className="mt-1 flex items-center gap-2 text-xl font-semibold tnum">{doneN}/{list.length}
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-border" aria-hidden="true"><span className="block h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${doneN / list.length * 100}%` }} /></span>
          </div>
        </div>
      </div>
      {(b.arrival || b.notes) && (
        <div className="mt-4 rounded-2xl bg-default/60 px-4 py-3 text-sm">
          {b.arrival && <p><span className="text-muted">Arribada prevista:</span> {b.arrival}</p>}
          {b.notes && <p className="mt-1"><span className="text-muted">Comentaris de l'hoste:</span> {b.notes}</p>}
        </div>
      )}
      <div className="mt-4 divide-y divide-separator overflow-hidden card">
        {b.kind === 'paid' && <Row ok title="Pagada a la web" sub={`${euro(b.amount)}${b.refunded ? `, retornats ${euro(b.refunded)}` : ''}`} />}
        {b.kind === 'pending' && <Row ok={false} title="Pendent del banc" sub={`${euro(b.amount)}. Stripe encara no l'ha confirmat.`} />}
        {b.kind === 'manual' && <Row title="Cobrada" sub={`${b.amount != null ? euro(b.amount) : 'Sense import'}${b.method ? `, ${METHOD[b.method]}` : ''}`} control={<Tick b={b} k="settled" label="Cobrada" />} />}
        <Row ok={!!b.email} title="Correu" sub={b.email || 'Falta'}><Button size="sm" variant="ghost" onPress={toClient}>{b.email ? 'Canvia' : 'Afegeix'}</Button></Row>
        <Row ok={!!b.phone} title="Telèfon" sub={b.phone || 'Falta'}><Button size="sm" variant="ghost" onPress={toClient}>{b.phone ? 'Canvia' : 'Afegeix'}</Button></Row>
        <Docs b={b} />
        <Moment b={b} k="checkin" label="Entrada" when={`${day(b.first)}, a partir de les ${rules?.checkin || '15:00'}`} />
        <Moment b={b} k="checkout" label="Sortida" when={`${day(b.until)}, abans de les ${rules?.checkout || '11:00'}`} />
      </div>
      <Memo b={b} />
    </div>
  );
}

function Fact({ k, children }: { k: string; children: ReactNode }) {
  return <div className="grid gap-1 border-b border-separator py-3.5 sm:grid-cols-[150px_1fr] sm:gap-4"><dt className="text-[13px] text-muted">{k}</dt><dd className="text-sm">{children}</dd></div>;
}
function PaymentInfo({ b }: { b: Booking }) {
  const key = keyOf(b);
  const [p, setP] = useState<Payment | null>(payments[key] || null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    if (payments[key]) return;
    api<Payment>(`payment?stay=${b.stay}&id=${encodeURIComponent(b.id)}`).then(d => { payments[key] = d; setP(d); }).catch(() => setErr(true));
  }, [key]);
  if (err) return <span className="text-muted">No s'ha pogut consultar Stripe.</span>;
  if (!p) return <span className="inline-flex items-center gap-2 text-muted"><Spinner size="sm" />Consultant Stripe…</span>;
  const m = p.method;
  const what = m.type === 'card'
    ? `${m.brand ? cap(m.brand) : 'Targeta'}${m.last4 ? ` acabada en ${m.last4}` : ''}${m.wallet ? ` amb ${WALLET[m.wallet] || m.wallet}` : ''}`
    : (PAYTYPE[m.type] || m.type || 'Mètode desconegut') + (m.last4 ? ` acabada en ${m.last4}` : '') + (m.bank ? `, ${m.bank}` : '');
  const when = p.status === 'succeeded' ? `cobrat ${stamp(p.created * 1000)}` : p.status === 'processing' ? 'en procés' : p.status;
  return <span className="text-muted">{what}, {when}.{p.refunded ? ` Retornats ${euro(p.refunded)}.` : ''}{p.receipt && <> <a href={p.receipt} target="_blank" rel="noopener" className="text-link underline underline-offset-2">Veure el rebut</a></>}</span>;
}

function BookingTab({ b }: { b: Booking }) {
  const S = useStore(s => s.settings);
  const pol = b.policy || S?.cancel;
  const future = b.until >= TODAY;
  return (
    <div className="fade-in">
      <dl className="border-t border-separator">
        <Fact k="Allotjament">{stayName(b.stay)}</Fact>
        <Fact k="Arribada">{cap(longDay(b.first))}<div className="text-[13px] text-muted">A partir de les {S?.rules.checkin || '15:00'}{b.arrival ? `. L'hoste diu: ${b.arrival}` : ''}</div></Fact>
        <Fact k="Sortida">{cap(longDay(b.until))}<div className="text-[13px] text-muted">Abans de les {S?.rules.checkout || '11:00'}</div></Fact>
        <Fact k="Estada">{nitsTxt(nightsBetween(b.first, b.until))}{b.guests ? `, ${b.guests} ${b.guests === 1 ? 'persona' : 'persones'}` : ''}</Fact>
        <Fact k="Via">{SOURCE[b.source] || b.source || '–'}</Fact>
        <Fact k="Import"><span className="tnum">{b.amount != null ? euro(b.amount) : 'Sense import'}</span>{b.refunded ? <div className="text-[13px] text-muted">Retornats {euro(b.refunded)}</div> : null}</Fact>
        <Fact k="Pagament">
          {b.kind === 'manual' ? (
            <div className="flex flex-wrap items-center gap-3">
              <Checkbox isSelected={b.settled} onChange={v => save(b, { settled: v })}>
                <Checkbox.Content><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>Cobrada</Checkbox.Content>
              </Checkbox>
              <Select aria-label="Com s'ha cobrat" placeholder="Com s'ha cobrat?" value={b.method || null} onChange={v => save(b, { method: v ?? '' })} className="w-56">
                <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                <Select.Popover>
                  <ListBox items={Object.entries(METHOD).map(([id, name]) => ({ id, name }))}>
                    {it => <ListBox.Item id={it.id} textValue={it.name}>{it.name}<ListBox.ItemIndicator /></ListBox.Item>}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          ) : <>{b.kind === 'paid' ? 'Pagada a la web' : 'Pendent del banc'}<div className="mt-0.5 text-[13px]"><PaymentInfo b={b} /></div></>}
        </Fact>
        {pol && b.kind !== 'manual' && <Fact k="Cancel·lació">{policyText(pol)}<div className="text-[13px] text-muted">{b.policy ? "La que va acceptar l'hoste." : 'La política actual (aquesta reserva no en té cap de guardada).'}</div></Fact>}
        {b.notes && <Fact k="Comentaris">{b.notes}</Fact>}
      </dl>
      <div className="mt-5 flex flex-wrap gap-2">
        {b.stripe && <a className={btn()} href={b.stripe} target="_blank" rel="noopener"><CreditCard size={15} />Stripe</a>}
        {b.link && <a className={btn()} href={b.link} target="_blank" rel="noopener"><CalendarDays size={15} />Google Calendar</a>}
        {(b.kind === 'paid' || b.kind === 'manual') && future && <Button size="sm" variant="danger-soft" onPress={() => openCancel(keyOf(b))}>Cancel·la la reserva</Button>}
      </div>
    </div>
  );
}

function Contact({ b, k, label, type }: { b: Booking; k: 'email' | 'phone'; label: string; type: 'email' | 'tel' }) {
  const [v, setV] = useState(b[k]);
  useEffect(() => setV(b[k]), [b[k]]);
  const tel = b.phone.replace(/\s/g, ''), wa = b.phone.replace(/\D/g, '');
  return (
    <div className="flex flex-wrap items-end gap-2">
      <TextField type={type} value={v} onChange={setV} onBlur={() => { if (v !== b[k]) save(b, { [k]: v }); }} className="min-w-0 flex-1" fullWidth>
        <Label>{label}</Label><Input placeholder="Falta" autoComplete="off" />
      </TextField>
      {k === 'email' && b.email && <a className={btn()} href={`mailto:${b.email}`} aria-label="Escriu un correu"><Mail size={15} />Escriu</a>}
      {k === 'phone' && b.phone && <><a className={btn()} href={`tel:${tel}`} aria-label="Truca"><Phone size={15} />Truca</a><a className={btn()} href={`https://wa.me/${wa}`} target="_blank" rel="noopener"><MessageCircle size={15} />WhatsApp</a></>}
    </div>
  );
}

function ClientTab({ b }: { b: Booking }) {
  const wa = b.phone.replace(/\D/g, '');
  const history = allBookings().filter(x => keyOf(x) !== keyOf(b) && isBooking(x) && ((b.email && x.email && x.email.toLowerCase() === b.email.toLowerCase()) || (wa.length > 5 && x.phone && x.phone.replace(/\D/g, '') === wa)))
    .sort((x, y) => y.first.localeCompare(x.first));
  return (
    <div className="fade-in space-y-4">
      <Contact b={b} k="email" label="Correu" type="email" />
      <Contact b={b} k="phone" label="Telèfon" type="tel" />
      <div className="divide-y divide-separator overflow-hidden card">
        <Docs b={b} />
      </div>
      <h3 className="pt-2 text-base font-semibold">Altres estades</h3>
      {history.length ? (
        <div className="divide-y divide-separator overflow-hidden card">
          {history.map(x => (
            <button key={keyOf(x)} type="button" onClick={() => openDetail(keyOf(x))} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm outline-none hover:bg-[var(--row-hover)] focus-visible:bg-[var(--row-hover)]">
              <span className="flex-1 tnum">{range(x.first, x.until)}</span><span className="text-muted">{shortName(x.stay)}</span><span className="w-20 text-right tnum">{euro(x.amount)}</span><Status b={x} />
            </button>
          ))}
        </div>
      ) : <p className="text-sm text-muted">{b.email || b.phone ? 'Cap altra estada amb aquest correu o telèfon.' : 'Afegeix el correu o el telèfon per veure si ja ha estat a casa.'}</p>}
    </div>
  );
}

// Closed nights, cancelled bookings and entries made in Google Calendar
function OtherEntry({ b }: { b: Booking }) {
  const [busy, setBusy] = useState(false);
  const open = async () => {
    setBusy(true);
    try { await api('cancel', { method: 'POST', body: { stay: b.stay, id: b.id } }); closeDetail(); done('Nits obertes'); await reload(); }
    catch (e) { toastError(e); setBusy(false); }
  };
  return (
    <SideSheet isOpen onClose={closeDetail} title={who(b)}
      subtitle={<span className="flex flex-wrap items-center gap-x-3 gap-y-1"><Status b={b} /><span>{shortName(b.stay)}</span><span className="tnum">{range(b.first, b.until)}</span><span>{nitsTxt(nightsBetween(b.first, b.until))}</span></span>}>
      <div className="mt-4 space-y-4 text-sm">
        {b.amount != null && <p>Import: <span className="tnum">{euro(b.amount)}</span>{b.refunded ? ` (retornats ${euro(b.refunded)})` : ''}</p>}
        {b.kind === 'other' && <p className="text-muted">Aquesta entrada es va crear directament a Google Calendar. Es canvia des d'allà.</p>}
        <div className="flex flex-wrap gap-2">
          {b.stripe && <a className={btn()} href={b.stripe} target="_blank" rel="noopener"><CreditCard size={15} />Stripe</a>}
          {b.link && <a className={btn()} href={b.link} target="_blank" rel="noopener"><CalendarDays size={15} />Google Calendar</a>}
          {b.kind === 'block' && b.until >= TODAY && <Button size="sm" variant="danger-soft" isPending={busy} onPress={open}>Obre aquestes nits</Button>}
        </div>
      </div>
    </SideSheet>
  );
}
