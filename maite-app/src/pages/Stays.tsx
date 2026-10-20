// Allotjaments: what the web shows for each stay (type, name, description, capacity, features, photos), with a live preview
import { useEffect, useRef, useState } from 'react';
import { Button, Skeleton, Spinner, ToggleButton, ToggleButtonGroup, type Key } from '@heroui/react';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, ExternalLink, Images, Plus, Star, Trash2, Upload, X } from 'lucide-react';
import { api, uploadPhoto } from '../lib/api';
import { loadContent, setContent, setStays, getState, useStore } from '../lib/store';
import { Choice, Field } from '../parts/fields';
import { Dialog } from '../parts/Sheet';
import { done, toastError } from '../parts/toast';
import type { StayContent } from '../lib/types';
import { leave, useGuard } from '../lib/guard';

const photoUrl = (src: string) => (src.startsWith('/') ? src : '/' + src);
const Icon = ({ svg }: { svg: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: svg }} />
);

export default function Stays() {
  const content = useStore(s => s.content);
  const stays = useStore(s => s.stays);
  const [stay, setStay] = useState(stays[0]?.id || '');
  const [draft, setDraft] = useState<StayContent | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [iconsFor, setIconsFor] = useState<number | null>(null);
  const [library, setLibrary] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => { loadContent().catch(toastError); }, []);
  useEffect(() => { if (content && stay) { setDraft(structuredClone(content.stays[stay])); setDirty(false); setIconsFor(null); } }, [content, stay]);

  useGuard(dirty, save);
  if (!content || !draft) return <div><Skeleton className="mb-4 h-9 w-80 rounded-xl" /><Skeleton className="h-[520px] rounded-3xl" /></div>;
  const edit = (patch: Partial<StayContent>) => { setDraft(d => ({ ...d!, ...patch })); setDirty(true); };
  const feats = draft.feats, photos = draft.photos;
  const moveFeat = (i: number, j: number) => { const f = [...feats]; [f[i], f[j]] = [f[j], f[i]]; edit({ feats: f }); };
  const movePhoto = (from: number, to: number) => { const p = [...photos]; const [x] = p.splice(from, 1); p.splice(to, 0, x); edit({ photos: p }); };

  const switchTo = (id: string) => {
    if (id === stay) return;
    leave(() => setStay(id));
  };
  async function upload(files: FileList | null) {
    const list = [...(files || [])];
    setUploading(n => n + list.length);
    for (const f of list) {
      try { const src = await uploadPhoto(f); setDraft(d => ({ ...d!, photos: [...d!.photos, src] })); setDirty(true); }
      catch (e) { toastError(new Error(`${f.name}: ${(e as Error).message}`)); }
      setUploading(n => n - 1);
    }
  }
  async function save() {
    if (uploading) { toastError(new Error('Espera que acabin de pujar les fotos')); return false; }
    setBusy(true); let ok = false;
    try {
      const d = await api<{ stay: StayContent }>('stays', { method: 'PUT', body: { stay, ...draft, feats: draft!.feats.filter(x => x.text.trim()) } });
      setContent({ ...content!, stays: { ...content!.stays, [stay]: d.stay } });
      setStays(getState().stays.map(s => s.id === stay ? { ...s, name: `${d.stay.kind} ${d.stay.name}`, short: d.stay.name, max: d.stay.max } : s));
      setDirty(false); done('Allotjament desat'); ok = true;
    } catch (e) { toastError(e); }
    setBusy(false); return ok;
  }
  const site = `${location.protocol}//${location.hostname.replace(/^maite\./, '')}/#${stay}`;

  return (
    <div className="fade-in">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <ToggleButtonGroup aria-label="Allotjament" selectionMode="single" disallowEmptySelection selectedKeys={new Set([stay])}
          onSelectionChange={(k: Set<Key>) => { const [v] = k; if (v) switchTo(String(v)); }} size="sm" className="max-w-full overflow-x-auto">
          {stays.map(s => <ToggleButton key={s.id} id={s.id}>{content.stays[s.id]?.name || s.short}</ToggleButton>)}
        </ToggleButtonGroup>
        {dirty && <span className="status due">Canvis sense desar</span>}
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <section className="rounded-3xl bg-surface p-5 shadow-[var(--surface-shadow)] ring-1 ring-border sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tipus" value={draft.kind} onChange={v => edit({ kind: v })} help="Apartament, Habitació…" />
              <Field label="Nom" value={draft.name} onChange={v => edit({ name: v })} />
              <Choice label="Capacitat" value={String(draft.max)} onChange={v => edit({ max: +v })} items={Array.from({ length: 12 }, (_, i) => ({ id: String(i + 1), name: `${i + 1} ${i ? 'persones' : 'persona'}` }))} />
              <Field label="Descripció" value={draft.desc} onChange={v => edit({ desc: v })} area className="sm:col-span-2" />
            </div>
          </section>

          <section className="rounded-3xl bg-surface p-5 shadow-[var(--surface-shadow)] ring-1 ring-border sm:p-6">
            <h2 className="text-base font-semibold">Característiques</h2>
            <div className="mt-4 space-y-2">
              {feats.map((f, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2 rounded-2xl bg-default/50 p-2">
                    <Button isIconOnly variant="tertiary" size="sm" aria-label="Canvia la icona" aria-expanded={iconsFor === i} onPress={() => setIconsFor(iconsFor === i ? null : i)}>
                      <Icon svg={content.icons[f.icon] || content.icons.star} />
                    </Button>
                    <input value={f.text} maxLength={60} aria-label={`Característica ${i + 1}`} placeholder="Wifi gratuït…"
                      onChange={e => edit({ feats: feats.map((x, j) => j === i ? { ...x, text: e.target.value } : x) })}
                      className="h-9 min-w-0 flex-1 rounded-xl bg-field px-3 text-sm outline-none ring-1 ring-[var(--field-border)] focus-visible:ring-2 focus-visible:ring-focus" />
                    <Button isIconOnly size="sm" variant="ghost" aria-label="Puja" isDisabled={!i} onPress={() => moveFeat(i, i - 1)}><ChevronUp size={16} /></Button>
                    <Button isIconOnly size="sm" variant="ghost" aria-label="Baixa" isDisabled={i === feats.length - 1} onPress={() => moveFeat(i, i + 1)}><ChevronDown size={16} /></Button>
                    <Button isIconOnly size="sm" variant="ghost" aria-label="Treu" onPress={() => { edit({ feats: feats.filter((_, j) => j !== i) }); setIconsFor(null); }}><Trash2 size={16} /></Button>
                  </div>
                  {iconsFor === i && (
                    <div className="mt-1 flex flex-wrap gap-1 rounded-2xl bg-default/40 p-2 fade-in" role="radiogroup" aria-label="Icona">
                      {Object.keys(content.icons).map(k => (
                        <button key={k} type="button" role="radio" aria-checked={k === f.icon} onClick={() => { edit({ feats: feats.map((x, j) => j === i ? { ...x, icon: k } : x) }); setIconsFor(null); }}
                          className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs outline-none ring-1 focus-visible:ring-2 focus-visible:ring-focus ${k === f.icon ? 'bg-accent/15 ring-accent' : 'ring-transparent hover:bg-default'}`}>
                          <Icon svg={content.icons[k]} />{content.iconNames[k] || k}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Button variant="secondary" size="sm" className="mt-3" onPress={() => { edit({ feats: [...feats, { icon: 'star', text: '' }] }); setIconsFor(feats.length); }}><Plus size={15} />Afegeix una característica</Button>
          </section>

          <section className="rounded-3xl bg-surface p-5 shadow-[var(--surface-shadow)] ring-1 ring-border sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="mr-auto text-base font-semibold">Fotos</h2>
              {content.uploads && <Button size="sm" variant="secondary" onPress={() => file.current?.click()}><Upload size={15} />Puja fotos</Button>}
              <Button size="sm" variant="secondary" onPress={() => setLibrary(true)}><Images size={15} />Fotos de la web</Button>
              <input ref={file} type="file" accept="image/*" multiple hidden onChange={e => { upload(e.target.files); e.target.value = ''; }} />
            </div>
            <p className="mt-1 text-sm text-muted">La primera és la portada. Arrossega-les per canviar l'ordre, o fes servir les fletxes.{!content.uploads && " Per pujar fotos noves cal connectar l'emmagatzematge R2."}</p>
            <Photos photos={photos} move={movePhoto} remove={i => photos.length > 1 ? edit({ photos: photos.filter((_, j) => j !== i) }) : toastError(new Error('Cal almenys una foto'))} uploading={uploading} />
          </section>
        </div>

        <aside className="space-y-3 xl:sticky xl:top-24">
          <Preview draft={draft} icons={content.icons} />
          <div className="flex gap-2">
            <Button fullWidth isPending={busy} onPress={save}>{busy && <Spinner size="sm" color="current" />}Desa els canvis</Button>
            <a href={site} target="_blank" rel="noopener" className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium ring-1 ring-border hover:bg-default outline-none focus-visible:ring-2 focus-visible:ring-focus"><ExternalLink size={15} />Web</a>
          </div>
          <p className="text-xs text-muted">El rètol amb el nom que hi ha sobre la foto és una imatge: si canvies el nom, caldrà fer-ne un de nou.</p>
        </aside>
      </div>

      {dirty && (
        <div className="fixed inset-x-3 bottom-28 z-40 mx-auto flex max-w-md items-center gap-2 rounded-2xl bg-overlay p-2 pl-4 shadow-[var(--overlay-shadow)] ring-1 ring-border xl:hidden fade-in">
          <span className="mr-auto text-sm">Canvis sense desar</span>
          <Button size="sm" isPending={busy} onPress={save}>Desa</Button>
        </div>
      )}
      <Library open={library} onClose={() => setLibrary(false)} have={photos} library={content.library} add={srcs => edit({ photos: [...photos, ...srcs] })} />
    </div>
  );
}

function Photos({ photos, move, remove, uploading }: { photos: string[]; move: (a: number, b: number) => void; remove: (i: number) => void; uploading: number }) {
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const tool = 'grid size-8 place-items-center rounded-full bg-black/55 text-white backdrop-blur outline-none hover:bg-black/75 focus-visible:ring-2 focus-visible:ring-white disabled:opacity-30';
  return (
    <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {photos.map((src, i) => (
        <li key={src} draggable onDragStart={() => setDrag(i)} onDragEnd={() => { setDrag(null); setOver(null); }}
          onDragOver={e => { e.preventDefault(); setOver(i); }} onDrop={e => { e.preventDefault(); if (drag != null && drag !== i) move(drag, i); setDrag(null); setOver(null); }}
          className={`group relative aspect-[4/3] cursor-grab overflow-hidden rounded-2xl bg-default ring-1 ring-border ${drag === i ? 'opacity-40' : ''} ${over === i && drag !== i ? 'ring-2 ring-accent' : ''}`}>
          <img src={photoUrl(src)} alt="" loading="lazy" className="size-full object-cover" draggable={false} />
          {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">Portada</span>}
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 p-2">
            <button type="button" className={tool} aria-label="Mou a l'esquerra" disabled={!i} onClick={() => move(i, i - 1)}><ArrowLeft size={15} /></button>
            <button type="button" className={tool} aria-label="Mou a la dreta" disabled={i === photos.length - 1} onClick={() => move(i, i + 1)}><ArrowRight size={15} /></button>
            <span className="flex-1" />
            {i > 0 && <button type="button" className={tool} aria-label="Fes-la portada" onClick={() => move(i, 0)}><Star size={15} /></button>}
            <button type="button" className={tool} aria-label="Treu la foto" onClick={() => remove(i)}><X size={15} /></button>
          </div>
        </li>
      ))}
      {Array.from({ length: uploading }, (_, i) => <li key={'u' + i} className="grid aspect-[4/3] place-items-center rounded-2xl bg-default text-sm text-muted"><span className="inline-flex items-center gap-2"><Spinner size="sm" />Pujant…</span></li>)}
    </ul>
  );
}

function Library({ open, onClose, have, library, add }: { open: boolean; onClose: () => void; have: string[]; library: string[]; add: (s: string[]) => void }) {
  const [pick, setPick] = useState<string[]>([]);
  useEffect(() => { if (open) setPick([]); }, [open]);
  return (
    <Dialog isOpen={open} onClose={onClose} title="Fotos de la web" subtitle="Toca les que vulguis afegir." size="lg"
      footer={<><Button variant="ghost" onPress={onClose}>Cancel·la</Button><Button isDisabled={!pick.length} onPress={() => { add(pick); onClose(); }}>Afegeix{pick.length ? ` (${pick.length})` : ''}</Button></>}>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {library.map(src => {
          const there = have.includes(src), on = pick.includes(src);
          return (
            <li key={src}>
              <button type="button" disabled={there} aria-pressed={on} onClick={() => setPick(p => on ? p.filter(x => x !== src) : [...p, src])}
                className={`relative block aspect-[4/3] w-full overflow-hidden rounded-xl outline-none ring-offset-2 ring-offset-transparent focus-visible:ring-2 focus-visible:ring-focus ${there ? 'opacity-30' : ''} ${on ? 'ring-[3px] ring-accent' : ''}`}>
                <img src={photoUrl(src)} alt="" loading="lazy" className="size-full object-cover" />
              </button>
            </li>
          );
        })}
      </ul>
    </Dialog>
  );
}

function Preview({ draft, icons }: { draft: StayContent; icons: Record<string, string> }) {
  return (
    <div className="overflow-hidden rounded-3xl bg-surface shadow-[var(--surface-shadow)] ring-1 ring-border">
      <div className="px-5 pt-4 text-xs font-medium text-muted">Així es veu a la web</div>
      <div className="p-4">
        <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-default">{draft.photos[0] && <img src={photoUrl(draft.photos[0])} alt="" className="size-full object-cover" />}</div>
        <div className="mt-4 text-[11px] font-semibold uppercase tracking-[.18em] text-accent">{draft.kind}</div>
        <div className="mt-1 text-2xl font-semibold tracking-tight">{draft.name}</div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-muted">
          {draft.feats.filter(f => f.text.trim()).map((f, i) => <li key={i} className="flex items-center gap-1.5"><Icon svg={icons[f.icon] || icons.star} />{f.text}</li>)}
        </ul>
        <p className="mt-3 text-sm">{draft.desc}</p>
      </div>
    </div>
  );
}
