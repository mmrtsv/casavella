// Xarxes socials: the Instagram templates in the brand (posts, stories, highlight covers), the profile grid built from
// the posts confirmed here, their captions, and PNGs at full size. The posts and captions live in KV (/api/maite/social).
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Label, ListBox, Select, Skeleton, Spinner, Tabs, TextArea, TextField, type Key } from '@heroui/react';
import { Check, Copy as CopyIcon, Download, ImageUp, MessageSquareText, Plus, Shuffle, Sparkles, X } from 'lucide-react';
import { api, uploadPhoto } from '../lib/api';
import { Tag } from '../parts/Status';
import { done, toastError } from '../parts/toast';
import { Art, Wide } from '../social/Art';
import { byId, fileName, loadBrandFonts, onImage, photoAlt, png, save, variants } from '../social/paint';
import { COPIES, PROFILE_HEAD, TEMPLATES, type Kind, type Template } from '../social/templates';

type Post = { id: string; tpl: string; v: number; photo: string; at: string };
type Data = { posts: Post[]; copies: Record<string, string>; ai: boolean };
type Option = { caption: string; hashtags: string };
type Tab = 'posts' | 'stories' | 'highlights' | 'profile' | 'copies';

const TABS: { id: Tab; label: string }[] = [
  { id: 'posts', label: 'Posts' }, { id: 'stories', label: 'Stories i reels' }, { id: 'highlights', label: 'Destacats' },
  { id: 'profile', label: 'Perfil' }, { id: 'copies', label: 'Copies' },
];
const KIND_OF: Partial<Record<Tab, Kind>> = { posts: 'post', stories: 'story', highlights: 'highlight' };
const HELP: Partial<Record<Tab, string>> = {
  posts: '1080 × 1350 px. Només els colors de la marca. Confirma els que vulguis publicar i ordena\'ls a Perfil.',
  stories: '1080 × 1920 px. El text queda lluny de les franges de dalt i de baix, on Instagram posa els botons.',
  highlights: 'Puja-les com a story i tria-les com a portada de cada destacat. Instagram n\'agafa el cercle del centre.',
  copies: 'Escrits com ho fan Mas d\'en Bruno, Oller del Mas, Off Grid, La Vella Farga i Mas Grimosach.',
};
// Templates that can go in the grid: every post, and the reel cover
const inGrid = (t: Template) => t.kind === 'post' || t.id === 'StoryReel';
const joinCopy = (o: Option) => o.caption.trim() + (o.hashtags ? '\n\n' + o.hashtags.trim() : '');

async function download(t: Template, v: number, photo: string, n?: number) {
  save(await png(t, v, photo), fileName(t, n));
}

export default function Social() {
  const [tab, setTab] = useState<Tab>(() => { try { return (localStorage.getItem('maite-social-tab') as Tab) || 'posts'; } catch { return 'posts'; } });
  const [data, setData] = useState<Data | null>(null);
  useEffect(() => { loadBrandFonts(); api<Data>('social').then(setData).catch(toastError); }, []);
  const pick = (t: Tab) => { setTab(t); try { localStorage.setItem('maite-social-tab', t); } catch { /* private window */ } };
  const kind = KIND_OF[tab];

  return (
    <div className="fade-in">
      <Tabs selectedKey={tab} onSelectionChange={k => pick(k as Tab)} className="mb-5">
        <Tabs.ListContainer className="max-w-full overflow-x-auto"><Tabs.List aria-label="Xarxes socials" className="w-fit">
          {TABS.map(t => <Tabs.Tab key={t.id} id={t.id} className="whitespace-nowrap">{t.label}<Tabs.Indicator /></Tabs.Tab>)}
        </Tabs.List></Tabs.ListContainer>
      </Tabs>
      {HELP[tab] && <p className="mb-5 max-w-3xl text-sm text-muted">{HELP[tab]}</p>}
      {kind && (
        <ul className={`grid gap-5 ${kind === 'post' ? 'sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-5'}`}>
          {TEMPLATES.filter(t => t.kind === kind).map(t => <li key={t.id}><TemplateCard t={t} data={data} setData={setData} /></li>)}
        </ul>
      )}
      {tab === 'profile' && (data ? <Profile data={data} setData={setData} onEmpty={() => pick('posts')} /> : <Skeleton className="h-[640px] rounded-2xl" />)}
      {tab === 'copies' && <Library />}
    </div>
  );
}

function TemplateCard({ t, data, setData }: { t: Template; data: Data | null; setData: (d: Data) => void }) {
  const n = variants(t);
  const [v, setV] = useState(0);
  const [own, setOwn] = useState<{ file: File; url: string } | null>(null);
  const [busy, setBusy] = useState<'' | 'confirm' | 'png'>('');
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (own) URL.revokeObjectURL(own.url); }, [own]);
  const at = (data?.posts || []).map((p, i) => (p.tpl === t.id ? i + 1 : 0)).filter(Boolean);
  const choose = (f?: File) => { if (f) { setOwn({ file: f, url: URL.createObjectURL(f) }); } };

  async function confirm() {
    setBusy('confirm');
    try {
      const photo = own ? await uploadPhoto(own.file) : '';
      const d = await api<Data>('social', { method: 'POST', body: { tpl: t.id, v, photo } });
      setData(d); setOwn(null);
      done(`${t.title}: post ${d.posts.length} del perfil`);
    } catch (e) { toastError(e); }
    setBusy('');
  }
  async function exportPng() {
    setBusy('png');
    try { await download(t, v, own?.url || ''); } catch (e) { toastError(e); }
    setBusy('');
  }

  return (
    <article className="card overflow-hidden">
      <Art t={t} v={v} photo={own?.url} className="rounded-t-[var(--card-radius)]" />
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-base font-semibold tracking-tight">{t.title}</h2>
          {at.length > 0 && <Tag tone="paid">{at.length === 1 ? `Post ${at[0]} del perfil` : `Posts ${at.join(', ')} del perfil`}</Tag>}
        </div>
        <p className="text-sm text-muted">{t.desc}</p>
        <div className="flex flex-wrap items-center gap-2">
          {n > 0 && (
            <Button size="sm" variant="secondary" onPress={() => { setV((v + 1) % n); setOwn(null); }} aria-label={`Una altra opció (${v + 1} de ${n})`}>
              <Shuffle size={15} />Una altra opció<span className="tnum text-muted">{v + 1}/{n}</span>
            </Button>
          )}
          {t.photo && (
            <>
              <Button size="sm" variant="secondary" onPress={() => file.current?.click()}><ImageUp size={15} />{own ? 'Una altra foto' : 'La teva foto'}</Button>
              <input ref={file} type="file" accept="image/*" hidden onChange={e => { choose(e.target.files?.[0]); e.target.value = ''; }} />
            </>
          )}
          <Button size="sm" variant="ghost" isIconOnly aria-label={`Descarrega ${t.title} en PNG`} isPending={busy === 'png'} onPress={exportPng}>
            {busy === 'png' ? <Spinner size="sm" color="current" /> : <Download size={16} />}
          </Button>
          {inGrid(t) && data && (
            <Button size="sm" className="ml-auto" isPending={busy === 'confirm'} onPress={confirm}>
              {busy === 'confirm' ? <Spinner size="sm" color="current" /> : <Plus size={15} />}{at.length ? 'Confirma un altre' : 'Confirma'}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function Profile({ data, setData, onEmpty }: { data: Data; setData: (d: Data) => void; onEmpty: () => void }) {
  const posts = data.posts.filter(p => byId.has(p.tpl));
  const [open, setOpen] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  async function order(ids: string[], msg: string) {
    const before = data;
    setData({ ...data, posts: ids.map(id => data.posts.find(p => p.id === id)!).filter(Boolean) });
    try { setData(await api<Data>('social', { method: 'PUT', body: { order: ids } })); done(msg); }
    catch (e) { setData(before); toastError(e); }
  }
  const move = (p: Post, to: number) => {
    const ids = posts.map(x => x.id).filter(id => id !== p.id);
    ids.splice(to, 0, p.id);
    order(ids, `${byId.get(p.tpl)!.title} ara és el post ${to + 1}`);
  };
  async function downloadAll() {
    try {
      for (let i = 0; i < posts.length; i++) {
        setProgress(`${i + 1} de ${posts.length}`);
        const p = posts[i];
        await download(byId.get(p.tpl)!, p.v, p.photo, i + 1);
        await new Promise(r => setTimeout(r, 400));
      }
      done(posts.length === 1 ? '1 post descarregat' : `${posts.length} posts descarregats`);
    } catch (e) { toastError(e); }
    setProgress('');
  }

  if (!posts.length) return (
    <div className="card flex flex-wrap items-center gap-3 p-5">
      <p className="mr-auto text-sm">Encara no hi ha cap post confirmat.</p>
      <Button size="sm" variant="secondary" onPress={onEmpty}>Vés a Posts</Button>
    </div>
  );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
      <section className="card overflow-hidden lg:sticky lg:top-24" aria-label="Com es veurà el perfil">
        <Wide html={PROFILE_HEAD} />
        <div className="grid grid-cols-3 gap-0.5 bg-white">
          {[...posts].reverse().map(p => {
            const n = posts.indexOf(p) + 1;
            return (
              <div key={p.id} className="relative">
                <Art t={byId.get(p.tpl)!} v={p.v} photo={p.photo} fit="cover" className="aspect-[3/4]" />
                <span className="tnum absolute top-1.5 left-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#1a3f20]/85 px-1.5 text-xs font-semibold text-[#f3efe4]">{n}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card">
        <div className="flex flex-wrap items-center gap-3 border-b border-separator p-4 sm:px-5">
          <div className="mr-auto">
            <h2 className="text-base font-semibold">Ordre de publicació</h2>
            <p className="text-sm text-muted">El post 1 és el primer que publicaràs; a la graella queda a baix de tot.</p>
          </div>
          <Button size="sm" variant="secondary" isPending={!!progress} onPress={downloadAll}>
            {progress ? <><Spinner size="sm" color="current" />Descarregant {progress}</> : <><Download size={15} />Descarrega la graella</>}
          </Button>
        </div>
        <ol className="divide-y divide-separator">
          {posts.map((p, i) => {
            const t = byId.get(p.tpl)!, copy = data.copies[p.id];
            return (
              <li key={p.id} className="p-3 sm:px-5">
                <div className="flex items-center gap-3">
                  <Select aria-label={`Número de ${t.title}`} value={String(i + 1)} onChange={(k: Key | null) => { if (k != null && +k !== i + 1) move(p, +k - 1); }} className="w-20 shrink-0">
                    <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                    <Select.Popover>
                      <ListBox>{posts.map((_, k) => <ListBox.Item key={k} id={String(k + 1)} textValue={String(k + 1)}>{k + 1}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox>
                    </Select.Popover>
                  </Select>
                  <Art t={t} v={p.v} photo={p.photo} fit="cover" className="aspect-[3/4] w-11 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{t.title}</div>
                    <div className="truncate text-xs text-muted">{p.photo ? 'Amb la teva foto' : `Opció ${p.v + 1}`}</div>
                    <div className="truncate text-xs text-muted">{copy ? copy.split('\n')[0] : 'Sense copy'}</div>
                  </div>
                  <Button size="sm" variant={open === p.id ? 'secondary' : 'ghost'} isIconOnly aria-expanded={open === p.id} aria-label={`Copy del post ${i + 1}`} onPress={() => setOpen(open === p.id ? null : p.id)}><MessageSquareText size={16} /></Button>
                  <DownloadButton label={`Descarrega el post ${i + 1}`} run={() => download(t, p.v, p.photo, i + 1)} />
                  <Button size="sm" variant="ghost" isIconOnly aria-label={`Treu ${t.title} del perfil`} onPress={() => order(posts.filter(x => x !== p).map(x => x.id), `${t.title} tret del perfil`)}><X size={16} /></Button>
                </div>
                {open === p.id && <CopyPanel post={p} n={i + 1} data={data} setData={setData} posts={posts} />}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function DownloadButton({ label, run }: { label: string; run: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button size="sm" variant="ghost" isIconOnly aria-label={label} isPending={busy} onPress={async () => { setBusy(true); try { await run(); } catch (e) { toastError(e); } setBusy(false); }}>
      {busy ? <Spinner size="sm" color="current" /> : <Download size={16} />}
    </Button>
  );
}

// Library captions to start from when Claude is not available: the template's own first
function libraryFor(t: Template): Option[] {
  const all = COPIES.filter(c => c.hashtags), own = all.find(c => c.label === t.title);
  return (own ? [own, ...all.filter(c => c !== own)] : all).slice(0, 3);
}

function CopyPanel({ post, n, data, setData, posts }: { post: Post; n: number; data: Data; setData: (d: Data) => void; posts: Post[] }) {
  const t = byId.get(post.tpl)!;
  const [options, setOptions] = useState<Option[] | null>(null);
  const [text, setText] = useState(data.copies[post.id] || '');
  const [busy, setBusy] = useState<'' | 'gen' | 'save'>('');
  const saved = data.copies[post.id] || '';

  async function generate() {
    if (!data.ai) { setOptions(libraryFor(t)); return; }
    setBusy('gen');
    try {
      const used = posts.filter(p => p.id !== post.id && data.copies[p.id]).map(p => data.copies[p.id].split('\n')[0]);
      const d = await api<{ options: Option[] }>('social-copy', { method: 'POST', body: { title: t.title, onImage: onImage(t, post.v), photo: photoAlt(t, post.v, !!post.photo), n, used } });
      setOptions(d.options);
    } catch (e) { toastError(e); setOptions(libraryFor(t)); }
    setBusy('');
  }
  async function keep(value: string) {
    setBusy('save');
    try { setData(await api<Data>('social', { method: 'PUT', body: { copy: { id: post.id, text: value } } })); setText(value.trim()); done(`Copy del post ${n} desat`); }
    catch (e) { toastError(e); }
    setBusy('');
  }
  async function copy() {
    try { await navigator.clipboard.writeText(text); done('Copy copiat'); } catch { toastError(new Error('No s\'ha pogut copiar: selecciona el text i copia\'l a mà')); }
  }

  return (
    <div className="mt-3 space-y-3 rounded-2xl bg-default/50 p-3 sm:p-4 fade-in">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto text-sm text-muted">{data.ai ? 'Claude escriu tres opcions en català, castellà i anglès.' : 'Sense la clau de Claude, et proposo els copies de la pestanya Copies.'}</p>
        <Button size="sm" variant="secondary" isPending={busy === 'gen'} onPress={generate}>
          {busy === 'gen' ? <Spinner size="sm" color="current" /> : <Sparkles size={15} />}{options ? 'Altres opcions' : 'Proposa copies'}
        </Button>
      </div>
      {options && (
        <ul className="grid gap-2 xl:grid-cols-3">
          {options.map((o, k) => (
            <li key={k} className="flex flex-col gap-2 rounded-xl bg-surface p-3 ring-1 ring-border">
              <p className="flex-1 text-sm whitespace-pre-wrap">{joinCopy(o)}</p>
              <Button size="sm" variant="secondary" className="self-start" onPress={() => keep(joinCopy(o))}><Check size={15} />Fes servir aquesta</Button>
            </li>
          ))}
        </ul>
      )}
      <TextField value={text} onChange={setText} fullWidth>
        <Label>{saved ? 'Copy del post' : 'Copy del post (encara sense desar)'}</Label>
        <TextArea rows={9} />
      </TextField>
      <div className="flex gap-2">
        <Button size="sm" isPending={busy === 'save'} isDisabled={!text.trim() || text.trim() === saved} onPress={() => keep(text)}>Desa</Button>
        <Button size="sm" variant="secondary" isDisabled={!text.trim()} onPress={copy}><CopyIcon size={15} />Copia</Button>
      </div>
    </div>
  );
}

function Library() {
  const list = useMemo(() => COPIES, []);
  return (
    <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {list.map(c => {
        const full = c.caption + (c.hashtags ? '\n\n' + c.hashtags : '');
        return (
          <li key={c.label} className="card flex flex-col gap-3 p-5">
            <h2 className="text-base font-semibold">{c.label}</h2>
            <p className="flex-1 text-sm whitespace-pre-wrap">{full}</p>
            {c.note && <p className="text-xs text-muted">{c.note}</p>}
            <Button size="sm" variant="secondary" className="self-start"
              onPress={() => navigator.clipboard.writeText(full).then(() => done('Copy copiat'), () => toastError(new Error("No s'ha pogut copiar")))}>
              <CopyIcon size={15} />Copia
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
