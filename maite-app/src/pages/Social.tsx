// Xarxes socials: a new post (from a description, or from a template with its variation, photo and words), the Instagram
// templates in the brand (posts, stories, highlight covers) and the words changed on them, the profile grid built from the
// posts made here, their captions, and PNGs at full size. The posts, captions and template words live in KV (/api/maite/social).
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Calendar, DateField, DatePicker, I18nProvider, Label, ListBox, Select, Skeleton, Spinner, Tabs, TextArea, TextField, TimeField, ToggleButton, ToggleButtonGroup, type Key } from '@heroui/react';
import { getLocalTimeZone, parseDate, parseTime, today as todayIn, type DateValue, type Time } from '@internationalized/date';
import { BookOpen, Check, ChevronLeft, ChevronRight, Clock, Copy as CopyIcon, Download, ExternalLink, GalleryHorizontalEnd, ImageUp, MessageSquareText, Pencil, Plus, Send, Shuffle, Sparkles, X } from 'lucide-react';
import { api, uploadPhoto } from '../lib/api';
import { Check as CheckField, Choice, Field } from '../parts/fields';
import { Dialog } from '../parts/Sheet';
import { Tag } from '../parts/Status';
import { done, toastError } from '../parts/toast';
import { Art, Wide } from '../social/Art';
import { CAROUSELS, LIBRARY, MENU_DISHES, MENU_EXAMPLE, STYLES, inLibrary, menuCaption, menuSlides, type Menu, type Slide } from '../social/catalog';
import { byId, changed, fields, fileName, loadBrandFonts, onImage, photoAlt, png, save, variants, type Texts } from '../social/paint';
import { COPIES, PROFILE_HEAD, TEMPLATES, type Kind, type Template } from '../social/templates';

// story: a story (never in the grid); menu: made in Menús, which lists it
type Post = Slide & { id: string; slides?: Slide[]; story?: boolean; menu?: boolean; at: string; date?: string; published?: { at: string; url: string; media?: string }; schedule?: Schedule };
// A program: when the post goes out on its own (the cron in cron/), with its JPEGs already uploaded (images, for a carousel);
// error, if it failed
type Schedule = { at: string; image: string; images?: string[]; error?: string; started?: string };
type Insta = { connected: boolean; username?: string; detail?: string; media?: Live[] };
// A post on the Instagram account, published from Maite or from the app
type Live = { id: string; at: string; url: string; image: string; caption: string };
// templates: the words changed on each template, which new posts start from
type Data = { posts: Post[]; copies: Record<string, string>; templates: Record<string, Texts>; ai: boolean };
type Option = { caption: string; hashtags: string };
// A post or story Claude made from a description: the template, its photo and words, and the caption
type Made = Option & { tpl: string; photo: string; texts: string[]; slides?: Slide[] };
// Destacats (the highlight covers) is out of the tabs for now; its templates stay
type Tab = 'new' | 'posts' | 'stories' | 'menus' | 'profile' | 'calendar';
// A post being made or changed: the variation, the photo (an upload, or one just picked and not yet uploaded) and the words
type Own = { file: File; url: string };
type Draft = { v: number; photo: string; own: Own | null; texts: Texts };

const TABS: { id: Tab; label: string }[] = [
  { id: 'new', label: 'Nova publicació' }, { id: 'posts', label: 'Posts' }, { id: 'stories', label: 'Stories i reels' },
  { id: 'menus', label: 'Menús' }, { id: 'profile', label: 'Perfil' }, { id: 'calendar', label: 'Calendari' },
];
const KIND_OF: Partial<Record<Tab, Kind>> = { posts: 'post', stories: 'story' };
const HELP: Partial<Record<Tab, string>> = {
  new: 'Descriu-la i Claude la proposa, o fes-la tu des d\'una plantilla. Abans d\'afegir-la al perfil en pots canviar el text i la foto.',
  posts: '1080 × 1350 px. Només els colors de la marca. Edita una plantilla per canviar el text de les publicacions que en facis.',
  stories: '1080 × 1920 px. El text queda lluny de les franges de dalt i de baix, on Instagram posa els botons.',
};
// Templates that can go in the grid: every post, and the reel cover
const inGrid = (t: Template) => t.kind === 'post' || t.id === 'StoryReel';
const joinCopy = (o: Option) => o.caption.trim() + (o.hashtags ? '\n\n' + o.hashtags.trim() : '');

async function download(t: Template, v: number, photo: string, texts?: Texts, n?: number, slide?: number) {
  save(await png(t, v, photo, texts), fileName(t, n, slide));
}
// Every image of a post: the post itself, then the slides of a carousel
const imagesOf = (p: Slide & { slides?: Slide[] }) => [p, ...(p.slides || [])].filter(x => byId.has(x.tpl));
// A post's images one after the other, numbered when there are more than one
async function downloadPost(p: Slide & { slides?: Slide[] }, n?: number) {
  const list = imagesOf(p);
  for (const [k, x] of list.entries()) {
    await download(byId.get(x.tpl)!, x.v, x.photo, x.texts, n, list.length > 1 ? k + 1 : undefined);
    if (k < list.length - 1) await new Promise(r => setTimeout(r, 400));
  }
}
// The slides that follow a template in a carousel, as they are before Claude or the owner change them
const nextSlides = (t: Template): Slide[] => (CAROUSELS[t.id] || []).map(tpl => ({ tpl, v: 0, photo: '' }));

export default function Social() {
  const [tab, setTab] = useState<Tab>(() => {
    try { const t = localStorage.getItem('maite-social-tab'); return TABS.some(x => x.id === t) ? t as Tab : 'new'; } catch { return 'new'; }
  });
  const [data, setData] = useState<Data | null>(null);
  // What Crea'n un post on a template card hands to Nova publicació
  const [start, setStart] = useState<{ id: string; v: number; own: Own | null; n: number } | null>(null);
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
      {tab === 'new' && (data ? <NewPost key={start?.n || 0} data={data} setData={setData} start={start} /> : <Skeleton className="h-[640px] rounded-2xl" />)}
      {kind && (
        <ul className={`grid gap-5 ${kind === 'post' ? 'sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-5'}`}>
          {TEMPLATES.filter(t => t.kind === kind).map(t => <li key={t.id}><TemplateCard t={t} data={data} setData={setData} onCreate={(v, own) => { setStart({ id: t.id, v, own, n: (start?.n || 0) + 1 }); pick('new'); }} /></li>)}
        </ul>
      )}
      {tab === 'calendar' && (data ? <Planner data={data} setData={setData} onEmpty={() => pick('posts')} /> : <Skeleton className="h-[640px] rounded-2xl" />)}
      {tab === 'profile' && (data ? <Profile data={data} setData={setData} onEmpty={() => pick('posts')} /> : <Skeleton className="h-[640px] rounded-2xl" />)}
      {tab === 'menus' && (data ? <Menus data={data} setData={setData} /> : <Skeleton className="h-[640px] rounded-2xl" />)}
    </div>
  );
}

// A template with its words as changed: its variations and a photo to try, a PNG, and Crea'n un post, which takes them to
// Nova publicació
function TemplateCard({ t, data, setData, onCreate }: { t: Template; data: Data | null; setData: (d: Data) => void; onCreate: (v: number, own: Own | null) => void }) {
  const n = variants(t);
  const [v, setV] = useState(0);
  const [own, setOwn] = useState<Own | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const texts = data?.templates[t.id];
  const at = (data?.posts || []).filter(p => !p.published).map((p, i) => (p.tpl === t.id ? i + 1 : 0)).filter(Boolean);
  const choose = (f?: File) => { if (f) { if (own) URL.revokeObjectURL(own.url); setOwn({ file: f, url: URL.createObjectURL(f) }); } };

  async function exportPng() {
    setBusy(true);
    try { await download(t, v, own?.url || '', texts); } catch (e) { toastError(e); }
    setBusy(false);
  }

  return (
    <article className="card overflow-hidden">
      <Art t={t} v={v} photo={own?.url} texts={texts} className="rounded-t-[var(--card-radius)]" />
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-base font-semibold tracking-tight">{t.title}</h2>
          {at.length > 0 && <Tag tone="paid">{at.length === 1 ? `Post ${at[0]} del perfil` : `Posts ${at.join(', ')} del perfil`}</Tag>}
        </div>
        <p className="text-sm text-muted">{t.desc}</p>
        <div className="flex flex-wrap items-center gap-2">
          {n > 0 && (
            <Button size="sm" variant="secondary" onPress={() => { setV((v + 1) % n); if (own) URL.revokeObjectURL(own.url); setOwn(null); }} aria-label={`Una altra opció (${v + 1} de ${n})`}>
              <Shuffle size={15} />Una altra opció<span className="tnum text-muted">{v + 1}/{n}</span>
            </Button>
          )}
          {t.photo && (
            <>
              <Button size="sm" variant="secondary" onPress={() => file.current?.click()}><ImageUp size={15} />{own ? 'Una altra foto' : 'La teva foto'}</Button>
              <input ref={file} type="file" accept="image/*" hidden onChange={e => { choose(e.target.files?.[0]); e.target.value = ''; }} />
            </>
          )}
          <Button size="sm" variant="ghost" isIconOnly aria-label={`Descarrega ${t.title} en PNG`} isPending={busy} onPress={exportPng}>
            {busy ? <Spinner size="sm" color="current" /> : <Download size={16} />}
          </Button>
          {data && <Button size="sm" variant="ghost" isIconOnly aria-label={`Edita la plantilla ${t.title}`} onPress={() => setEditing(true)}><Pencil size={16} /></Button>}
          {inGrid(t) && data && (
            <Button size="sm" className="ml-auto" onPress={() => { onCreate(v, own); setOwn(null); }}><Plus size={15} />Crea'n un post</Button>
          )}
        </div>
      </div>
      {editing && data && <TemplateEditor t={t} data={data} setData={setData} onClose={() => setEditing(false)} />}
    </article>
  );
}

// The words with one changed, the others as they were (null keeps the template's)
const setWord = (texts: Texts, i: number, s: string): Texts => Array.from({ length: Math.max(texts.length, i + 1) }, (_, k) => (k === i ? s : texts[k] ?? null));

// The template drawn as the draft has it, and what can be changed on it: the variation and the photo (look), and its words
function Editor({ t, draft, set, look = true }: { t: Template; draft: Draft; set: (d: Draft) => void; look?: boolean }) {
  const n = variants(t), own = useMemo(() => fields(t, draft.v), [t, draft.v]);
  const file = useRef<HTMLInputElement>(null);
  const photo = draft.own?.url || draft.photo;
  const drop = () => { if (draft.own) URL.revokeObjectURL(draft.own.url); };
  const choose = (f?: File) => { if (f) { drop(); set({ ...draft, own: { file: f, url: URL.createObjectURL(f) } }); } };
  return (
    <div className="grid items-start gap-5 md:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
      <Art t={t} v={draft.v} photo={photo} texts={draft.texts} className="rounded-xl" />
      <div className="space-y-4">
        {look && (n > 0 || t.photo) && (
          <div className="flex flex-wrap gap-2">
            {n > 0 && (
              <Button size="sm" variant="secondary" onPress={() => { drop(); set({ ...draft, v: (draft.v + 1) % n, own: null, photo: '' }); }} aria-label={`Una altra opció (${draft.v + 1} de ${n})`}>
                <Shuffle size={15} />Una altra opció<span className="tnum text-muted">{draft.v + 1}/{n}</span>
              </Button>
            )}
            {t.photo && (
              <>
                <Button size="sm" variant="secondary" onPress={() => file.current?.click()}><ImageUp size={15} />{photo ? 'Una altra foto' : 'La teva foto'}</Button>
                <input ref={file} type="file" accept="image/*" hidden onChange={e => { choose(e.target.files?.[0]); e.target.value = ''; }} />
                {photo && <Button size="sm" variant="ghost" onPress={() => { drop(); set({ ...draft, own: null, photo: '' }); }}>La foto de la plantilla</Button>}
              </>
            )}
          </div>
        )}
        {own.length ? own.map((d, i) => {
          const value = draft.texts[i] ?? d;
          return <Field key={`${t.id}-${i}`} label={`Text ${i + 1}`} value={value} area={Math.max(d.length, value.length) > 40}
            onChange={s => set({ ...draft, texts: setWord(draft.texts, i, s) })} />;
        }) : <p className="text-sm text-muted">Aquesta plantilla no porta text.</p>}
      </div>
    </div>
  );
}

// Nova publicació: from a description (Claude proposes it) or from a template, changed, added to the end of the profile
function NewPost({ data, setData, start }: { data: Data; setData: (d: Data) => void; start: { id: string; v: number; own: Own | null } | null }) {
  const [how, setHow] = useState<'prompt' | 'template'>(start || !data.ai ? 'template' : 'prompt');
  return (
    <>
      {data.ai && (
        <ToggleButtonGroup aria-label="Com la vols fer" selectionMode="single" disallowEmptySelection selectedKeys={new Set([how])}
          onSelectionChange={(k: Set<Key>) => { const [v] = k; if (v) setHow(v as typeof how); }} size="sm" className="mb-5">
          <ToggleButton id="prompt">Amb una descripció</ToggleButton>
          <ToggleButton id="template">Des d'una plantilla</ToggleButton>
        </ToggleButtonGroup>
      )}
      {how === 'prompt' && data.ai ? <Maker start="post" setData={setData} /> : <Composer data={data} setData={setData} start={start} />}
    </>
  );
}

function Composer({ data, setData, start }: { data: Data; setData: (d: Data) => void; start: { id: string; v: number; own: Own | null } | null }) {
  const list = TEMPLATES.filter(inGrid);
  const blank = (id: string, v = 0, own: Own | null = null): Draft => ({ v, photo: '', own, texts: [...(data.templates[id] || [])] });
  const [id, setId] = useState(start && byId.has(start.id) ? start.id : list[0].id);
  const [draft, setDraft] = useState<Draft>(() => blank(id, start?.v, start?.own));
  const [busy, setBusy] = useState<'' | 'add' | 'png'>('');
  const t = byId.get(id)!;
  // The announcement can open a carousel, with the menu after it
  const next = nextSlides(t), [carousel, setCarousel] = useState(false), slides = carousel && next.length ? next : undefined;
  const choose = (x: string) => { if (draft.own) URL.revokeObjectURL(draft.own.url); setId(x); setDraft(blank(x)); setCarousel(false); };

  async function add() {
    setBusy('add');
    try {
      const photo = draft.own ? await uploadPhoto(draft.own.file) : draft.photo;
      const d = await api<Data>('social', { method: 'POST', body: { tpl: t.id, v: draft.v, photo, texts: changed(t, draft.v, draft.texts), slides } });
      setData(d); setDraft(blank(id));
      done(`${t.title}: post ${d.posts.filter(p => !p.published && !p.story).length} del perfil`);
    } catch (e) { toastError(e); }
    setBusy('');
  }
  async function exportPng() {
    setBusy('png');
    try { await downloadPost({ tpl: t.id, v: draft.v, photo: draft.own?.url || draft.photo, texts: draft.texts, slides }); } catch (e) { toastError(e); }
    setBusy('');
  }

  return (
    <div className="space-y-5">
      <section className="card p-4 sm:p-5" aria-label="Plantilla">
        <h2 className="mb-3 text-base font-semibold">Plantilla</h2>
        <ul className="flex gap-3 overflow-x-auto pb-1">
          {list.map(x => (
            <li key={x.id} className="w-24 shrink-0">
              <button type="button" onClick={() => choose(x.id)} aria-pressed={x.id === id}
                className={`block w-full overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-focus ${x.id === id ? 'ring-2 ring-accent' : 'opacity-80 hover:opacity-100'}`}>
                <Art t={x} texts={data.templates[x.id]} fit="cover" className="pointer-events-none aspect-[4/5]" />
              </button>
              <span className={`mt-1.5 block truncate text-xs ${x.id === id ? 'font-semibold' : 'text-muted'}`}>{x.title}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="card p-4 sm:p-5" aria-label={t.title}>
        <h2 className="text-base font-semibold">{t.title}</h2>
        <p className="mb-4 text-sm text-muted">{t.desc}</p>
        <Editor t={t} draft={draft} set={setDraft} />
        {next.length > 0 && (
          <div className="mt-5 space-y-3">
            <SingleOrCarousel carousel={carousel} onChange={setCarousel} />
            {slides && <div className="flex gap-3">{slides.map((x, k) => <Art key={k} t={byId.get(x.tpl)!} v={x.v} photo={x.photo} texts={x.texts} className="w-28 rounded-lg" />)}</div>}
          </div>
        )}
        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-separator pt-4">
          <Button variant="secondary" isPending={busy === 'png'} onPress={exportPng}>{busy === 'png' ? <Spinner size="sm" color="current" /> : <Download size={15} />}Descarrega</Button>
          <Button isPending={busy === 'add'} isDisabled={busy === 'png'} onPress={add}>{busy === 'add' ? <Spinner size="sm" color="current" /> : <Plus size={15} />}Afegeix al perfil</Button>
        </div>
      </section>
    </div>
  );
}

// The words of a template, for the posts made from it from now on; the ones already made keep theirs
function TemplateEditor({ t, data, setData, onClose }: { t: Template; data: Data; setData: (d: Data) => void; onClose: () => void }) {
  const saved = data.templates[t.id] || [];
  const [draft, setDraft] = useState<Draft>({ v: 0, photo: '', own: null, texts: [...saved] });
  const [busy, setBusy] = useState<'' | 'save' | 'reset'>('');
  async function keep(texts: Texts, b: 'save' | 'reset') {
    setBusy(b);
    try {
      setData(await api<Data>('social', { method: 'PUT', body: { template: { id: t.id, texts } } }));
      done(b === 'save' ? `Plantilla ${t.title} desada` : `${t.title} torna a tenir el text original`); onClose();
    } catch (e) { toastError(e); }
    setBusy('');
  }
  return (
    <Dialog isOpen onClose={onClose} title="Edita la plantilla" subtitle={t.title} size="lg"
      footer={<>
        <Button variant="ghost" onPress={onClose} isDisabled={!!busy}>Cancel·la</Button>
        {saved.length > 0 && <Button variant="secondary" isPending={busy === 'reset'} isDisabled={busy === 'save'} onPress={() => keep([], 'reset')}>Torna a l'original</Button>}
        <Button isPending={busy === 'save'} isDisabled={busy === 'reset'} onPress={() => keep(changed(t, 0, draft.texts), 'save')}>{busy === 'save' && <Spinner size="sm" color="current" />}Desa la plantilla</Button>
      </>}>
      <p className="mb-4 text-sm text-muted">Les publicacions noves en surten amb aquest text. Les que ja has fet no canvien.</p>
      <Editor t={t} draft={draft} set={setDraft} look={false} />
    </Dialog>
  );
}

// A post not yet published, changed; a programmed one gets its new image for the program
function PostEditor({ post, n, setData, onClose }: { post: Post; n: number; setData: (d: Data) => void; onClose: () => void }) {
  const t = byId.get(post.tpl)!;
  const [draft, setDraft] = useState<Draft>({ v: post.v, photo: post.photo, own: null, texts: [...(post.texts || [])] });
  const [busy, setBusy] = useState(false);
  async function keep() {
    setBusy(true);
    try {
      const photo = draft.own ? await uploadPhoto(draft.own.file) : draft.photo, texts = changed(t, draft.v, draft.texts);
      // A programmed post gets its new JPEGs: the first as changed, the slides of a carousel as they are
      const images: string[] = [];
      if (post.schedule) for (const x of imagesOf({ ...post, v: draft.v, photo, texts })) images.push(await uploadPhoto(new File([await png(byId.get(x.tpl)!, x.v, x.photo, x.texts)], 'post.png', { type: 'image/png' })));
      setData(await api<Data>('social', { method: 'PUT', body: { edit: { id: post.id, v: draft.v, photo, texts, images: post.schedule ? images : undefined } } }));
      done(`Post ${n} desat`); onClose();
    } catch (e) { toastError(e); }
    setBusy(false);
  }
  return (
    <Dialog isOpen onClose={onClose} title="Edita el post" subtitle={`Post ${n}: ${t.title}`} size="lg"
      footer={<>
        <Button variant="ghost" onPress={onClose} isDisabled={busy}>Cancel·la</Button>
        <Button isPending={busy} onPress={keep}>{busy && <Spinner size="sm" color="current" />}Desa els canvis</Button>
      </>}>
      {post.schedule && <p className="mb-4 text-sm text-muted">Està programat: es publicarà amb aquests canvis.</p>}
      <Editor t={t} draft={draft} set={setDraft} />
    </Dialog>
  );
}

// A post or story from a description, with the owner's photo or without, on one of the templates or on the one Claude picks:
// Claude writes the words on it and the caption (and picks a photo from the library, when there isn't one)
function Maker({ start, setData }: { start: 'post' | 'story'; setData: (d: Data) => void }) {
  const [kind, setKind] = useState(start);
  const [style, setStyle] = useState('general');
  const [tpl, setTpl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [own, setOwn] = useState<{ file: File; url: string } | null>(null);
  const uploaded = useRef('');
  const [busy, setBusy] = useState(false);
  const [made, setMade] = useState<{ kind: 'post' | 'story'; options: Made[] } | null>(null);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (own) URL.revokeObjectURL(own.url); }, [own]);
  const ready = !!(prompt.trim() || own) && !busy;
  const choose = (f?: File) => { if (f) { uploaded.current = ''; setOwn({ file: f, url: URL.createObjectURL(f) }); } };
  // The kinds of post and the templates to choose from; with the owner's photo, only those that have one
  const usable = (t: Template) => t.kind === kind && (!own || !!t.photo);
  const styles = STYLES.filter(st => st.kind === kind && st.tpls.some(id => usable(byId.get(id)!)));
  const look = styles.find(st => st.id === style);
  const fits = TEMPLATES.filter(t => usable(t) && (!look || look.tpls.includes(t.id)));
  const chosen = fits.some(t => t.id === tpl) ? tpl : '';

  async function make() {
    setBusy(true);
    try {
      // The photo goes up once; asking again with the same one reuses it
      if (own && !uploaded.current) uploaded.current = await uploadPhoto(own.file);
      const d = await api<{ options: Made[] }>('social-make', { method: 'POST', body: { prompt, kind, photo: own ? uploaded.current : '', style: look?.id || '', tpl: chosen } });
      setMade({ kind, options: d.options.filter(o => byId.has(o.tpl)) });
    } catch (e) { toastError(e); }
    setBusy(false);
  }
  return (
    <div className="mb-8 space-y-5">
      <section className="card space-y-4 p-4 sm:p-5">
        <ToggleButtonGroup aria-label="Què vols fer" selectionMode="single" disallowEmptySelection selectedKeys={new Set([kind])}
          onSelectionChange={(k: Set<Key>) => { const [v] = k; if (v) setKind(v as typeof kind); }} size="sm">
          <ToggleButton id="post">Post</ToggleButton>
          <ToggleButton id="story">Story</ToggleButton>
        </ToggleButtonGroup>
        <div className="max-w-full overflow-x-auto">
          <ToggleButtonGroup aria-label="Tema" selectionMode="single" disallowEmptySelection selectedKeys={new Set([look?.id || 'general'])}
            onSelectionChange={(k: Set<Key>) => { const [v] = k; if (v) { setStyle(String(v)); setTpl(''); } }} size="sm" className="w-fit">
            {styles.map(st => <ToggleButton key={st.id} id={st.id} className="whitespace-nowrap">{st.label}</ToggleButton>)}
          </ToggleButtonGroup>
        </div>
        {fits.length > 1 && <Select value={chosen || 'auto'} onChange={(k: Key | null) => setTpl(k == null || k === 'auto' ? '' : String(k))} className="w-full sm:w-72">
          <Label>Plantilla</Label>
          <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="auto" textValue="La tria Claude">La tria Claude<ListBox.ItemIndicator /></ListBox.Item>
              {fits.map(t => <ListBox.Item key={t.id} id={t.id} textValue={t.title}>{t.title}<ListBox.ItemIndicator /></ListBox.Item>)}
            </ListBox>
          </Select.Popover>
        </Select>}
        <TextField value={prompt} onChange={setPrompt} fullWidth>
          <Label>{own ? 'Què vols dir amb aquesta foto (opcional)' : kind === 'post' ? 'Què vols publicar' : 'Què vols explicar a la story'}</Label>
          <TextArea rows={2} placeholder={kind === 'post' ? "El sopar de Cap d'Any al restaurant, 31 de desembre, 65 € per persona" : 'Aquest cap de setmana encara queda lliure Les Vinyes'}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && ready) make(); }} />
        </TextField>
        <div className="flex flex-wrap items-center gap-3">
          {own && <img src={own.url} alt="La teva foto" className="h-16 w-16 rounded-lg object-cover" />}
          <Button size="sm" variant="secondary" onPress={() => file.current?.click()}><ImageUp size={15} />{own ? 'Una altra foto' : 'Afegeix una foto'}</Button>
          {own && <Button size="sm" variant="ghost" onPress={() => { setOwn(null); uploaded.current = ''; }}><X size={15} />Treu la foto</Button>}
          <input ref={file} type="file" accept="image/*" hidden onChange={e => { choose(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="mr-auto text-sm text-muted">{own ? `Claude fa ${kind === 'post' ? 'el post' : 'la story'} amb la teva foto i n'escriu el text i el copy.` : chosen ? 'Claude tria la foto i escriu el text de la imatge i el copy.' : 'Claude tria la plantilla i la foto, i escriu el text de la imatge i el copy.'}</p>
          <Button size="sm" isPending={busy} isDisabled={!ready} onPress={make}>
            {busy ? <Spinner size="sm" color="current" /> : <Sparkles size={15} />}{made ? 'Altres propostes' : 'Proposa'}
          </Button>
        </div>
      </section>
      {made && made.options.length > 0 && (
        <ul className={`grid gap-5 ${made.kind === 'post' ? 'sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'sm:grid-cols-2 xl:grid-cols-3'}`}>
          {made.options.map((o, k) => <li key={k + o.tpl + o.texts.join()}><MadeCard o={o} setData={setData} /></li>)}
        </ul>
      )}
    </div>
  );
}

// A proposal from Claude, with Edita to change its words, photo and caption before it goes to the profile
function MadeCard({ o, setData }: { o: Made; setData: (d: Data) => void }) {
  const t = byId.get(o.tpl)!;
  const [draft, setDraft] = useState<Draft>({ v: 0, photo: o.photo, own: null, texts: o.texts });
  const [caption, setCaption] = useState(joinCopy(o));
  const [busy, setBusy] = useState<'' | 'confirm' | 'png'>('');
  const [kept, setKept] = useState(0);
  const [editing, setEditing] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const photo = draft.own?.url || draft.photo;
  const choose = (f?: File) => { if (f) { if (draft.own) URL.revokeObjectURL(draft.own.url); setDraft({ ...draft, own: { file: f, url: URL.createObjectURL(f) } }); } };
  // A carousel when Claude filled the slides after it (the menu after the announcement); the owner can still post it alone
  const next = o.slides || [], [carousel, setCarousel] = useState(next.length > 0);
  const slides = carousel && next.length ? next : undefined;

  async function confirm() {
    setBusy('confirm');
    try {
      const d = await api<Data>('social', { method: 'POST', body: { tpl: t.id, v: draft.v, photo: draft.own ? await uploadPhoto(draft.own.file) : draft.photo, texts: draft.texts, slides, copy: inGrid(t) ? caption : '' } });
      const added = d.posts[d.posts.length - 1], n = d.posts.filter(p => !p.published && !p.story).indexOf(added) + 1;
      setData(d); setKept(n);
      done(`${t.title}: post ${n} del perfil`);
    } catch (e) { toastError(e); }
    setBusy('');
  }
  async function exportPng() {
    setBusy('png');
    try { await downloadPost({ tpl: t.id, v: draft.v, photo, texts: draft.texts, slides }); } catch (e) { toastError(e); }
    setBusy('');
  }

  return (
    <article className="card overflow-hidden">
      <Carousel list={[{ tpl: t.id, v: draft.v, photo, texts: draft.texts }, ...(slides || [])]} className="rounded-t-[var(--card-radius)]" />
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-base font-semibold tracking-tight">{t.title}</h2>
          {kept > 0 && <Tag tone="paid">Post {kept} del perfil</Tag>}
        </div>
        {next.length > 0 && !kept && <SingleOrCarousel carousel={carousel} onChange={setCarousel} />}
        <p className="text-sm whitespace-pre-wrap">{caption}</p>
        <div className="flex flex-wrap items-center gap-2">
          {!kept && <Button size="sm" variant="secondary" onPress={() => setEditing(true)}><Pencil size={15} />Edita</Button>}
          {t.photo && !kept && (
            <>
              <Button size="sm" variant="secondary" onPress={() => file.current?.click()}><ImageUp size={15} />{draft.own ? 'Una altra foto' : 'La teva foto'}</Button>
              <input ref={file} type="file" accept="image/*" hidden onChange={e => { choose(e.target.files?.[0]); e.target.value = ''; }} />
            </>
          )}
          <Button size="sm" variant="ghost" isIconOnly aria-label="Copia el copy"
            onPress={() => navigator.clipboard.writeText(caption).then(() => done('Copy copiat'), () => toastError(new Error("No s'ha pogut copiar")))}><CopyIcon size={16} /></Button>
          <Button size="sm" variant="ghost" isIconOnly aria-label={`Descarrega ${t.title} en PNG`} isPending={busy === 'png'} onPress={exportPng}>
            {busy === 'png' ? <Spinner size="sm" color="current" /> : <Download size={16} />}
          </Button>
          {inGrid(t) && !kept && (
            <Button size="sm" className="ml-auto" isPending={busy === 'confirm'} onPress={confirm}>
              {busy === 'confirm' ? <Spinner size="sm" color="current" /> : <Plus size={15} />}Confirma
            </Button>
          )}
        </div>
      </div>
      {editing && <MadeEditor t={t} draft={draft} caption={caption} onDone={(d, c) => { setDraft(d); setCaption(c); setEditing(false); }} onClose={() => setEditing(false)} />}
    </article>
  );
}

// Menús: a menu in three steps (the cover, the menu, when it goes out). It becomes the announcement with the menu after it, as
// a carousel post in the grid, and the same cover as a story; each goes out now, at a programmed time or later, from here.
// The menus made here are listed under the form, with when each goes out
type Out = 'later' | 'now' | 'save';
const OUT: { id: Out; label: string }[] = [{ id: 'later', label: 'Programa' }, { id: 'now', label: 'Ara' }, { id: 'save', label: 'Més endavant' }];

function Menus({ data, setData }: { data: Data; setData: (d: Data) => void }) {
  const [step, setStep] = useState<'cover' | 'menu' | 'out'>('cover');
  const [m, setM] = useState<Menu>(MENU_EXAMPLE);
  const [own, setOwn] = useState<{ file: File; url: string } | null>(null);
  const [copy, setCopy] = useState<string | null>(null);
  const [insta, setInsta] = useState<Insta | null>(null);
  const tomorrow = ymd(new Date(Date.now() + 864e5));
  const [post, setPost] = useState<{ when: Out; date: string; time: string }>({ when: 'later', date: tomorrow, time: '19:00' });
  const [story, setStory] = useState<{ on: boolean; when: Out; date: string; time: string }>({ on: true, when: 'later', date: tomorrow, time: '12:00' });
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState<Post | null>(null);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => { api<Insta>('instagram').then(setInsta).catch(() => setInsta({ connected: false })); }, []);
  useEffect(() => () => { if (own) URL.revokeObjectURL(own.url); }, [own]);
  const set = (k: keyof Menu) => (v: string) => setM({ ...m, [k]: v });
  const dish = (i: number) => (v: string) => { const dishes = [...m.dishes]; dishes[i] = v; setM({ ...m, dishes }); };
  const shown = { ...m, photo: own?.url || m.photo }, made = menuSlides(shown);
  const caption = copy ?? menuCaption(m);
  const live = !!insta?.connected;
  const atOf = (x: { date: string; time: string }) => new Date(`${x.date}T${x.time}`);
  const late = (x: { when: Out; date: string; time: string }) => live && x.when === 'later' && !(atOf(x).getTime() > Date.now() + 60e3);
  const ready = !!(m.title.trim() && m.name.trim() && m.price.trim() && m.dishes.some(d => d.trim())) && !late(post) && !(story.on && late(story));

  async function save() {
    setBusy(true);
    try {
      const photo = own ? await uploadPhoto(own.file) : m.photo, { post: p, story: st } = menuSlides({ ...m, photo });
      let d = await api<Data>('social', { method: 'POST', body: { ...p, menu: true, copy: caption } });
      const madePost = d.posts[d.posts.length - 1];
      let madeStory: Post | null = null;
      if (story.on) { d = await api<Data>('social', { method: 'POST', body: { ...st, story: true, menu: true } }); madeStory = d.posts[d.posts.length - 1]; }
      setData(d);
      const out: string[] = [];
      for (const [x, w] of [[madePost, post], [madeStory, story]] as const) {
        if (!x || !live || w.when === 'save') continue;
        d = await sendOut(x, w.when === 'now' ? undefined : atOf(w)); setData(d);
        out.push(`${x.story ? 'la story' : 'el post'} ${w.when === 'now' ? (x.story ? 'publicada' : 'publicat') : programmed({ at: atOf(w).toISOString(), image: '' })}`);
      }
      done(out.length ? `Menú desat: ${out.join(' i ')}` : 'Menú desat');
      setStep('cover'); setOwn(null); setCopy(null);
    } catch (e) { toastError(e); }
    setBusy(false);
  }

  const whenFields = (label: string, x: { when: Out; date: string; time: string }, change: (x: { when: Out; date: string; time: string }) => void) => (
    <div className="space-y-2">
      <ToggleButtonGroup aria-label={label} selectionMode="single" disallowEmptySelection selectedKeys={new Set([x.when])}
        onSelectionChange={(k: Set<Key>) => { const [v] = k; if (v) change({ ...x, when: v as Out }); }} size="sm">
        {OUT.map(w => <ToggleButton key={w.id} id={w.id}>{w.label}</ToggleButton>)}
      </ToggleButtonGroup>
      {x.when === 'later' && (
        <div className="flex flex-wrap items-end gap-3">
          <DayPicker label="Dia" value={x.date} onChange={date => change({ ...x, date })} />
          <HourField label="Hora" value={x.time} onChange={time => change({ ...x, time })} />
        </div>
      )}
      {late(x) && <p className="text-xs text-warning">Aquesta hora ja ha passat.</p>}
      {x.when === 'save' && <p className="text-xs text-muted">Es desa i el pots publicar o programar quan vulguis, des d'aquí sota.</p>}
    </div>
  );

  // The menus made here, newest first: the post and its story
  const list = data.posts.filter(p => p.menu && byId.has(p.tpl)).sort((a, b) => b.at.localeCompare(a.at));
  const grid = data.posts.filter(p => !p.published && !p.story);
  async function remove(p: Post) {
    try { setData(await api<Data>('social', { method: 'PUT', body: { remove: p.id } })); done(p.story ? 'Story treta' : 'Post tret del perfil'); }
    catch (e) { toastError(e); }
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <section className="card space-y-4 p-4 sm:p-5" aria-label="Nou menú">
          <ToggleButtonGroup aria-label="Pas" selectionMode="single" disallowEmptySelection selectedKeys={new Set([step])}
            onSelectionChange={(k: Set<Key>) => { const [v] = k; if (v) setStep(v as typeof step); }} size="sm">
            <ToggleButton id="cover">Portada</ToggleButton>
            <ToggleButton id="menu">Menú</ToggleButton>
            <ToggleButton id="out">Publica</ToggleButton>
          </ToggleButtonGroup>
          {step === 'cover' && <>
            <div className="flex flex-wrap items-end gap-3">
              {own ? <img src={own.url} alt="La teva foto" className="h-16 w-16 rounded-lg object-cover" />
                : <Choice label="Foto de la portada" value={m.photo} onChange={set('photo')} items={LIBRARY.map(p => ({ id: p.src, name: p.alt }))} className="sm:max-w-sm" />}
              <Button size="sm" variant="secondary" onPress={() => file.current?.click()}><ImageUp size={15} />{own ? 'Una altra foto' : 'La teva foto'}</Button>
              {own && <Button size="sm" variant="ghost" onPress={() => setOwn(null)}><X size={15} />Treu la foto</Button>}
              <input ref={file} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) setOwn({ file: f, url: URL.createObjectURL(f) }); e.target.value = ''; }} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Damunt del títol" value={m.kicker} onChange={set('kicker')} placeholder="Torna la" />
              <Field label="Títol" value={m.title} onChange={set('title')} placeholder="Calçotada" />
              <Field label="Sota el títol" value={m.subtitle} onChange={set('subtitle')} placeholder="A la terrassa, cada diumenge" />
              <Field label="Dates" value={m.dates} onChange={set('dates')} placeholder="Del 18 de gener al 29 de març" />
            </div>
            <div className="flex justify-end"><Button size="sm" onPress={() => setStep('menu')}>Següent</Button></div>
          </>}
          {step === 'menu' && <>
            <Field label="Nom del menú" value={m.name} onChange={set('name')} placeholder="Menú de calçotada" />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: MENU_DISHES }, (_, i) => <Field key={i} label={`Plat ${i + 1}`} value={m.dishes[i] || ''} onChange={dish(i)} />)}
            </div>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
              <Field label="Begudes" value={m.drinks} onChange={set('drinks')} placeholder="Vi del Penedès, aigua, cafè" />
              <Field label="Preu per persona (€)" value={m.price} onChange={v => set('price')(v.replace(/[^\d,.]/g, ''))} inputMode="decimal" />
            </div>
            <div className="flex justify-between"><Button size="sm" variant="ghost" onPress={() => setStep('cover')}>Enrere</Button><Button size="sm" onPress={() => setStep('out')}>Següent</Button></div>
          </>}
          {step === 'out' && <>
            {!live && insta && <p className="text-sm text-muted">Per publicar o programar des d'aquí cal connectar el compte d'Instagram. El menú es desa i el pots descarregar.</p>}
            <TextField value={caption} onChange={setCopy} fullWidth>
              <Label>Copy del post</Label>
              <TextArea rows={6} />
            </TextField>
            {live && <>
              <div className="space-y-2"><h3 className="text-sm font-semibold">Post, carrusel amb el menú</h3>{whenFields('Quan surt el post', post, setPost)}</div>
              <div className="space-y-2">
                <CheckField isSelected={story.on} onChange={on => setStory({ ...story, on })}>També com a story</CheckField>
                {story.on && whenFields('Quan surt la story', story, x => setStory({ ...story, ...x }))}
              </div>
            </>}
            {!live && <CheckField isSelected={story.on} onChange={on => setStory({ ...story, on })}>També com a story</CheckField>}
            {story.on && <Field label="Adreça a la story" value={m.link} onChange={set('link')} help="Surt escrita a la story. Instagram no deixa posar-hi l'enllaç des d'aquí." />}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button size="sm" variant="ghost" onPress={() => setStep('menu')}>Enrere</Button>
              <Button size="sm" isPending={busy} isDisabled={!ready || busy} onPress={save}>{busy ? <Spinner size="sm" color="current" /> : <Check size={15} />}Desa el menú</Button>
            </div>
            {!ready && <p className="text-xs text-muted">Cal el títol, el nom del menú, un plat i el preu.</p>}
          </>}
        </section>
        <section className="space-y-3 lg:sticky lg:top-24" aria-label="Com quedarà">
          <Carousel list={[made.post, ...made.post.slides]} className="card overflow-hidden" />
          {story.on && <div className="flex items-start gap-3"><Art t={byId.get('StoryPoster')!} v={0} photo={made.story.photo} texts={made.story.texts} className="w-28 shrink-0 rounded-xl" /><p className="text-sm text-muted">La story</p></div>}
        </section>
      </div>

      {list.length > 0 && (
        <section className="card" aria-label="Menús fets">
          <h2 className="border-b border-separator p-4 text-base font-semibold sm:px-5">Menús fets</h2>
          <ol className="divide-y divide-separator">
            {list.map(p => {
              const t = byId.get(p.tpl)!, title = [p.texts?.[1], p.texts?.[2]].filter(Boolean).join(' ') || t.title;
              return (
                <li key={p.id} className="flex items-center gap-3 p-3 sm:px-5">
                  <Art t={t} v={p.v} photo={p.photo} texts={p.texts} fit="cover" className={`${p.story ? 'aspect-[9/16]' : 'aspect-[3/4]'} w-11 shrink-0 rounded-md`} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{title}</div>
                    <div className="truncate text-xs text-muted">{p.story ? 'Story' : p.slides?.length ? `Post, carrusel de ${p.slides.length + 1} imatges` : 'Post'}</div>
                    {p.published ? <div className="truncate text-xs text-muted">Publicat el {day(p.published.at)}</div> : p.schedule ? <When s={p.schedule} /> : <div className="truncate text-xs text-muted">Per publicar</div>}
                  </div>
                  {p.published?.url && <a href={p.published.url} target="_blank" rel="noopener" aria-label="Obre a Instagram" className="grid size-8 shrink-0 place-items-center rounded-full outline-none hover:bg-default focus-visible:ring-2 focus-visible:ring-focus"><ExternalLink size={16} /></a>}
                  {live && !p.published && <Button size="sm" variant="ghost" isIconOnly aria-label={p.schedule ? 'Canvia la programació' : 'Publica o programa'} onPress={() => setPublishing(p)}>{p.schedule ? <Clock size={16} /> : <Send size={16} />}</Button>}
                  <DownloadButton label={`Descarrega ${title}`} run={() => downloadPost(p)} />
                  {!p.published && <Button size="sm" variant="ghost" isIconOnly aria-label={`Treu ${title}`} onPress={() => remove(p)}><X size={16} /></Button>}
                </li>
              );
            })}
          </ol>
        </section>
      )}
      {publishing && <Publish later post={publishing} n={grid.indexOf(publishing) + 1} caption={data.copies[publishing.id] || ''} onClose={() => setPublishing(null)} setData={setData} />}
    </div>
  );
}

// A post alone or as a carousel, for templates that can open one (the announcement, with the menu after it)
function SingleOrCarousel({ carousel, onChange }: { carousel: boolean; onChange: (c: boolean) => void }) {
  return (
    <ToggleButtonGroup aria-label="Format" selectionMode="single" disallowEmptySelection selectedKeys={new Set([carousel ? 'carousel' : 'single'])}
      onSelectionChange={(k: Set<Key>) => { const [v] = k; if (v) onChange(v === 'carousel'); }} size="sm">
      <ToggleButton id="single">Una imatge</ToggleButton>
      <ToggleButton id="carousel">Carrusel</ToggleButton>
    </ToggleButtonGroup>
  );
}

// The images of a post one at a time, as Instagram shows a carousel; a single image is just the image
function Carousel({ list, className = '' }: { list: Slide[]; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const go = (k: number) => { const el = box.current; if (el) el.scrollTo({ left: k * el.clientWidth, behavior: 'smooth' }); };
  useEffect(() => { if (at >= list.length) { setAt(0); box.current?.scrollTo({ left: 0 }); } }, [list.length, at]);
  if (list.length < 2) { const x = list[0]; return <Art t={byId.get(x.tpl)!} v={x.v} photo={x.photo} texts={x.texts} className={className} />; }
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div ref={box} onScroll={e => setAt(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {list.map((x, k) => <Art key={k + x.tpl} t={byId.get(x.tpl)!} v={x.v} photo={x.photo} texts={x.texts} className="w-full shrink-0 snap-start" />)}
      </div>
      <span className="tnum absolute top-2 right-2 rounded-full bg-[#1a3f20]/85 px-2 py-0.5 text-xs font-semibold text-[#f3efe4]">{at + 1}/{list.length}</span>
      {at > 0 && <Button size="sm" variant="secondary" isIconOnly aria-label="Imatge anterior" className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full" onPress={() => go(at - 1)}><ChevronLeft size={16} /></Button>}
      {at < list.length - 1 && <Button size="sm" variant="secondary" isIconOnly aria-label="Imatge següent" className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full" onPress={() => go(at + 1)}><ChevronRight size={16} /></Button>}
    </div>
  );
}

// Changing a proposal before it is confirmed: the template's words and photo, and the caption
function MadeEditor({ t, draft: start, caption: was, onDone, onClose }: { t: Template; draft: Draft; caption: string; onDone: (d: Draft, caption: string) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(start);
  const [caption, setCaption] = useState(was);
  return (
    <Dialog isOpen onClose={onClose} title="Edita la proposta" subtitle={t.title} size="lg"
      footer={<>
        <Button variant="ghost" onPress={onClose}>Cancel·la</Button>
        <Button onPress={() => onDone(draft, caption.trim())}>Fet</Button>
      </>}>
      <Editor t={t} draft={draft} set={setDraft} />
      {inGrid(t) && <Field label="Copy" value={caption} onChange={setCaption} area className="mt-5" />}
    </Dialog>
  );
}

function Profile({ data, setData, onEmpty }: { data: Data; setData: (d: Data) => void; onEmpty: () => void }) {
  // Published posts leave the plan; the preview shows them below it, marked, and Publicats lists them, newest first
  const all = data.posts.filter(p => byId.has(p.tpl) && !p.story);
  const posts = all.filter(p => !p.published), published = all.filter(p => p.published).sort((a, b) => b.published!.at.localeCompare(a.published!.at));
  const [show, setShow] = useState<'planned' | 'published'>('planned');
  const [open, setOpen] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [insta, setInsta] = useState<Insta | null>(null);
  const [publishing, setPublishing] = useState<Post | null>(null);
  const [editing, setEditing] = useState<Post | null>(null);
  const [drag, setDrag] = useState<string | null>(null), [over, setOver] = useState<string | null>(null);
  useEffect(() => { api<Insta>('instagram?media=1').then(setInsta).catch(() => setInsta({ connected: false })); }, []);
  // Below the plan the grid goes on with what is already on Instagram, newest first, whoever published it
  const ours = new Set(published.map(p => p.published!.media).filter(Boolean));
  const live = [
    ...published.map(p => ({ id: p.id, at: p.published!.at, url: p.published!.url, post: p })),
    ...(insta?.media || []).filter(m => !ours.has(m.id)).map(m => ({ id: m.id, at: m.at, url: m.url, image: m.image })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  // The order only lists planned posts; published ones are kept at the end so they are never removed by it
  async function order(planned: string[], msg: string) {
    const ids = [...planned, ...published.map(p => p.id)], before = data;
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
        await downloadPost(p, i + 1);
        await new Promise(r => setTimeout(r, 400));
      }
      done(posts.length === 1 ? '1 post descarregat' : `${posts.length} posts descarregats`);
    } catch (e) { toastError(e); }
    setProgress('');
  }

  const nothing = (text: string) => (
    <div className="card flex flex-wrap items-center gap-3 p-5">
      <p className="mr-auto text-sm">{text}</p>
      <Button size="sm" variant="secondary" onPress={onEmpty}>Vés a Posts</Button>
    </div>
  );
  if (!all.length) return nothing('Encara no hi ha cap post confirmat.');
  const filter = published.length > 0 && (
    <ToggleButtonGroup aria-label="Posts" selectionMode="single" disallowEmptySelection selectedKeys={new Set([show])}
      onSelectionChange={(k: Set<Key>) => { const [v] = k; if (v) setShow(v as typeof show); }} size="sm" className="mb-5">
      <ToggleButton id="planned">Per publicar</ToggleButton>
      <ToggleButton id="published">Publicats</ToggleButton>
    </ToggleButtonGroup>
  );
  if (show === 'published' && published.length) return <>{filter}<Published posts={published} copies={data.copies} /></>;
  if (!posts.length) return <>{filter}{nothing('No queda cap post per publicar.')}</>;

  return (
    <>{filter}
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
      {/* Stuck beside the list on wide screens, so it scrolls inside itself, like the phone, once the published posts make it taller than the window */}
      <section className="card overflow-hidden lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto" aria-label="Com es veurà el perfil">
        <Wide html={PROFILE_HEAD} />
        <div className="grid grid-cols-3 gap-0.5 bg-white">
          {[...posts].reverse().map(p => {
            const n = posts.indexOf(p) + 1;
            // Dragging a tile onto another gives it that one's number
            return (
              <div key={p.id} draggable onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setDrag(p.id); }} onDragEnd={() => { setDrag(null); setOver(null); }}
                onDragOver={e => { if (drag) { e.preventDefault(); setOver(p.id); } }} onDragLeave={() => setOver(o => o === p.id ? null : o)}
                onDrop={e => { e.preventDefault(); const from = posts.find(x => x.id === drag); if (from && from !== p) move(from, n - 1); setDrag(null); setOver(null); }}
                title={p.schedule ? `Post ${n}, ${programmed(p.schedule)}` : `Post ${n}`}
                className={`relative cursor-grab ${drag === p.id ? 'opacity-40' : ''} ${over === p.id && drag !== p.id ? 'ring-2 ring-accent ring-inset' : ''}`}>
                <Art t={byId.get(p.tpl)!} v={p.v} photo={p.photo} texts={p.texts} fit="cover" className="pointer-events-none aspect-[3/4]" />
                {p.slides?.length ? <GalleryHorizontalEnd size={16} aria-label="Carrusel" className="absolute top-1.5 right-1.5 text-[#f3efe4] drop-shadow" /> : null}
                <span className="tnum absolute top-1.5 left-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#1a3f20]/85 px-1.5 text-xs font-semibold text-[#f3efe4]">{n}</span>
                {p.schedule && (
                  <span className={`tnum absolute bottom-1.5 left-1.5 inline-flex h-5 items-center gap-1 rounded-full px-1.5 text-xs font-medium ${p.schedule.error ? 'bg-danger text-danger-foreground' : 'bg-[#f3efe4]/90 text-[#1a3f20]'}`}>
                    <Clock size={12} strokeWidth={2.5} aria-hidden />{p.schedule.error ? 'No publicat' : short(p.schedule.at)}
                  </span>
                )}
              </div>
            );
          })}
          {live.map(m => {
            const art = 'post' in m
              ? <Art t={byId.get(m.post.tpl)!} v={m.post.v} photo={m.post.photo} texts={m.post.texts} fit="cover" className="aspect-[3/4]" />
              : m.image ? <img src={m.image} alt="" loading="lazy" className="aspect-[3/4] w-full bg-default object-cover" /> : <div className="aspect-[3/4] bg-default" />;
            const mark = <span className="absolute top-1.5 left-1.5 grid size-5 place-items-center rounded-full bg-[#f3efe4]/90 text-[#1a3f20]"><Check size={13} strokeWidth={2.5} aria-hidden /></span>;
            const label = `Publicat el ${day(m.at)}`;
            return m.url
              ? <a key={m.id} href={m.url} target="_blank" rel="noopener" title={label} aria-label={`${label}: obre a Instagram`} className="relative block outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset">{art}{mark}</a>
              : <div key={m.id} title={label} className="relative">{art}{mark}<span className="sr-only">{label}</span></div>;
          })}
        </div>
      </section>

      <section className="card">
        <div className="flex flex-wrap items-center gap-3 border-b border-separator p-4 sm:px-5">
          <div className="mr-auto">
            <h2 className="text-base font-semibold">Ordre de publicació</h2>
            <p className="text-sm text-muted">El post 1 és el primer que publicaràs; a la graella queda just a sobre dels ja publicats, que porten una marca. Arrossega'ls a la graella per canviar-ne l'ordre.</p>
            {insta && <p className="text-sm text-muted">{insta.connected ? `Es publica a @${insta.username}.` : "Per publicar des d'aquí cal connectar el compte d'Instagram."}</p>}
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
                  <Art t={t} v={p.v} photo={p.photo} texts={p.texts} fit="cover" className="aspect-[3/4] w-11 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{t.title}</div>
                    <div className="truncate text-xs text-muted">{p.slides?.length ? `Carrusel de ${p.slides.length + 1} imatges` : p.photo && !inLibrary(p.photo) ? 'Amb la teva foto' : p.texts ? 'Amb text propi' : `Opció ${p.v + 1}`}</div>
                    <div className="truncate text-xs text-muted">{copy ? copy.split('\n')[0] : 'Sense copy'}</div>
                    {p.schedule && <When s={p.schedule} />}
                  </div>
                  <Button size="sm" variant="ghost" isIconOnly aria-label={`Edita el post ${i + 1}`} onPress={() => setEditing(p)}><Pencil size={16} /></Button>
                  <Button size="sm" variant={open === p.id ? 'secondary' : 'ghost'} isIconOnly aria-expanded={open === p.id} aria-label={`Copy del post ${i + 1}`} onPress={() => setOpen(open === p.id ? null : p.id)}><MessageSquareText size={16} /></Button>
                  {insta?.connected && t.kind === 'post' && <Button size="sm" variant="ghost" isIconOnly aria-label={p.schedule ? `Programa o publica el post ${i + 1}` : `Publica o programa el post ${i + 1}`} onPress={() => setPublishing(p)}><Send size={16} /></Button>}
                  <DownloadButton label={`Descarrega el post ${i + 1}`} run={() => downloadPost(p, i + 1)} />
                  <Button size="sm" variant="ghost" isIconOnly aria-label={`Treu ${t.title} del perfil`} onPress={() => order(posts.filter(x => x !== p).map(x => x.id), `${t.title} tret del perfil`)}><X size={16} /></Button>
                </div>
                {open === p.id && <CopyPanel post={p} n={i + 1} data={data} setData={setData} posts={all} />}
              </li>
            );
          })}
        </ol>
      </section>
      {editing && <PostEditor post={editing} n={posts.indexOf(editing) + 1} setData={setData} onClose={() => setEditing(null)} />}
      {publishing && <Publish post={publishing} n={posts.indexOf(publishing) + 1} caption={data.copies[publishing.id] || ''} onClose={() => { setPublishing(null); }} setData={setData} />}
    </div>
    </>
  );
}

const day = (iso: string) => new Date(iso).toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' });
const hour = (iso: string) => new Date(iso).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
const programmed = (s: Schedule) => `es publica el ${new Date(s.at).toLocaleDateString('ca-ES', { day: 'numeric', month: 'long' })} a les ${hour(s.at)}`;
// On a grid tile: 28 oct. 19:00
const short = (iso: string) => `${new Date(iso).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })} ${hour(iso)}`;

// The program of a post; next to a day picker the day is already there, so only the hour
function When({ s, hourOnly }: { s: Schedule; hourOnly?: boolean }) {
  if (s.error) return <div className="truncate text-xs text-danger" title={s.error}>No s'ha pogut publicar: {s.error}</div>;
  return <div className="truncate text-xs text-accent" title={programmed(s)}>{hourOnly ? `Programat a les ${hour(s.at)}` : `Programat: ${short(s.at)}`}</div>;
}

function Published({ posts, copies }: { posts: Post[]; copies: Record<string, string> }) {
  return (
    <section className="card" aria-label="Posts publicats">
      <ol className="divide-y divide-separator">
        {posts.map(p => {
          const t = byId.get(p.tpl)!, copy = copies[p.id];
          return (
            <li key={p.id} className="flex items-center gap-3 p-3 sm:px-5">
              <Art t={t} v={p.v} photo={p.photo} texts={p.texts} fit="cover" className="aspect-[3/4] w-11 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{t.title}</div>
                <div className="truncate text-xs text-muted">Publicat el {day(p.published!.at)}</div>
                <div className="truncate text-xs text-muted">{copy ? copy.split('\n')[0] : 'Sense copy'}</div>
              </div>
              {p.published!.url && (
                <a href={p.published!.url} target="_blank" rel="noopener" className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium outline-none hover:bg-default focus-visible:ring-2 focus-visible:ring-focus">
                  <ExternalLink size={15} />Obre a Instagram
                </a>
              )}
              <DownloadButton label={`Descarrega ${t.title}`} run={() => downloadPost(p)} />
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// Calendari: the day each planned post is meant to go out, on a month, and what was published on each day. Planned posts
// can be dragged onto a day (or back to the list, to take the day away) and programmed to go out on their own
const WEEK = ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'];
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function Planner({ data, setData, onEmpty }: { data: Data; setData: (d: Data) => void; onEmpty: () => void }) {
  const all = data.posts.filter(p => byId.has(p.tpl) && !p.story), planned = all.filter(p => !p.published);
  const today = ymd(new Date());
  const [month, setMonth] = useState(() => { const first = planned.find(p => p.date)?.date; const d = first && first > today ? new Date(first + 'T12:00') : new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const days = useMemo(() => {
    const lead = (month.getDay() + 6) % 7, count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return Array.from({ length: Math.ceil((lead + count) / 7) * 7 }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i - lead + 1));
  }, [month]);
  const on = (day: string) => all.filter(p => (p.published ? ymd(new Date(p.published.at)) : p.date) === day);
  // What is on Instagram, whoever published it; posts Maite published are already shown from the grid
  const [insta, setInsta] = useState<Insta | null>(null);
  useEffect(() => { api<Insta>('instagram?media=1').then(setInsta).catch(() => setInsta({ connected: false })); }, []);
  const ours = new Set(all.map(p => p.published?.media).filter(Boolean));
  const liveOn = (day: string) => (insta?.media || []).filter(m => !ours.has(m.id) && ymd(new Date(m.at)) === day);
  const [drag, setDrag] = useState<string | null>(null), [over, setOver] = useState<string | null>(null);
  const [programming, setProgramming] = useState<Post | null>(null);

  // A programmed post that moves to another day keeps its hour there
  async function plan(p: Post, date: string) {
    if (date === (p.date || '')) return;
    const before = data;
    if (p.schedule && date) {
      const at = new Date(`${date}T${hour(p.schedule.at)}`);
      if (at.getTime() < Date.now() + 60e3) { toastError(new Error(`A les ${hour(p.schedule.at)} d'aquell dia ja ha passat: tria una altra hora a Programa`)); return; }
      setData({ ...data, posts: data.posts.map(x => x.id === p.id ? { ...x, date, schedule: { ...p.schedule!, at: at.toISOString() } } : x) });
      try { setData(await api<Data>('social', { method: 'PUT', body: { schedule: { id: p.id, at: at.toISOString(), images: p.schedule.images || [p.schedule.image] } } })); }
      catch (e) { setData(before); toastError(e); }
      return;
    }
    setData({ ...data, posts: data.posts.map(x => x.id === p.id ? { ...x, date: date || undefined, schedule: date ? x.schedule : undefined } : x) });
    try { setData(await api<Data>('social', { method: 'PUT', body: { date: { id: p.id, date } } })); }
    catch (e) { setData(before); toastError(e); }
  }
  const dragged = () => planned.find(p => p.id === drag);
  const dragProps = (p: Post) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', p.id); setDrag(p.id); },
    onDragEnd: () => { setDrag(null); setOver(null); },
  });

  if (!all.length) return (
    <div className="card flex flex-wrap items-center gap-3 p-5">
      <p className="mr-auto text-sm">Encara no hi ha cap post confirmat.</p>
      <Button size="sm" variant="secondary" onPress={onEmpty}>Vés a Posts</Button>
    </div>
  );
  const label = month.toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="card overflow-hidden" aria-label={`Calendari de ${label}`}>
        <div className="flex items-center gap-2 border-b border-separator p-3 sm:px-5">
          <h2 className="mr-auto text-base font-semibold first-letter:uppercase">{label}</h2>
          <Button size="sm" variant="ghost" onPress={() => { const d = new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); }}>Avui</Button>
          <Button size="sm" variant="ghost" isIconOnly aria-label="Mes anterior" onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={16} /></Button>
          <Button size="sm" variant="ghost" isIconOnly aria-label="Mes següent" onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={16} /></Button>
        </div>
        <div className="grid grid-cols-7 border-b border-separator text-center text-xs text-muted">{WEEK.map(w => <div key={w} className="py-2">{w}</div>)}</div>
        <div className="grid grid-cols-7">
          {days.map(d => {
            const key = ymd(d), inMonth = d.getMonth() === month.getMonth(), list = on(key), open = key >= today;
            return (
              <div key={key} onDragOver={e => { if (drag && open) { e.preventDefault(); setOver(key); } }} onDragLeave={() => setOver(o => o === key ? null : o)}
                onDrop={e => { e.preventDefault(); const p = dragged(); setDrag(null); setOver(null); if (p && open) plan(p, key); }}
                className={`min-h-24 border-r border-b border-separator p-1 sm:p-1.5 [&:nth-child(7n)]:border-r-0 ${over === key ? 'bg-accent/10 ring-2 ring-accent ring-inset' : inMonth ? '' : 'bg-default/40'}`}>
                <div className={`tnum mb-1 grid size-6 place-items-center rounded-full text-xs ${key === today ? 'bg-accent font-semibold text-accent-foreground' : inMonth ? '' : 'text-muted'}`}>{d.getDate()}</div>
                <div className="grid gap-1 sm:grid-cols-2">
                  {list.map(p => {
                    const t = byId.get(p.tpl)!;
                    const art = <Art t={t} v={p.v} photo={p.photo} texts={p.texts} fit="cover" className="aspect-[3/4] w-full rounded-md" />;
                    if (p.published) return p.published.url
                      ? <a key={p.id} href={p.published.url} target="_blank" rel="noopener" title={`${t.title}, publicat`} aria-label={`${t.title}, publicat: obre a Instagram`} className="block rounded-md opacity-60 outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-focus">{art}</a>
                      : <div key={p.id} title={t.title} className="opacity-60">{art}<span className="sr-only">{t.title}</span></div>;
                    const label = p.schedule ? `${t.title}, ${programmed(p.schedule)}` : t.title;
                    return (
                      <div key={p.id} {...dragProps(p)} title={label} className={`relative cursor-grab ${drag === p.id ? 'opacity-40' : ''}`}>
                        {art}<span className="sr-only">{label}</span>
                        {p.schedule && <span className={`tnum absolute inset-x-0.5 bottom-0.5 inline-flex h-4 items-center justify-center gap-0.5 overflow-hidden rounded-full text-xs font-medium ${p.schedule.error ? 'bg-danger text-danger-foreground' : 'bg-[#f3efe4]/90 text-[#1a3f20]'}`}><Clock size={10} strokeWidth={2.5} aria-hidden />{hour(p.schedule.at)}</span>}
                      </div>
                    );
                  })}
                  {liveOn(key).map(m => (
                    <a key={m.id} href={m.url} target="_blank" rel="noopener" title={m.caption.split('\n')[0] || 'Publicat a Instagram'} aria-label="Publicat a Instagram: obre el post"
                      className="block rounded-md opacity-60 outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-focus">
                      {m.image ? <img src={m.image} alt="" loading="lazy" className="aspect-[3/4] w-full rounded-md object-cover" /> : <div className="aspect-[3/4] w-full rounded-md bg-default" />}
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-label="Dates dels posts" onDragOver={e => { if (dragged()?.date) { e.preventDefault(); setOver('list'); } }} onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(o => o === 'list' ? null : o); }}
        onDrop={e => { e.preventDefault(); const p = dragged(); setDrag(null); setOver(null); if (p?.date) plan(p, ''); }}
        className={`card ${over === 'list' ? 'ring-2 ring-accent' : ''}`}>
        <div className="border-b border-separator p-4 sm:px-5">
          <h2 className="text-base font-semibold">Per publicar</h2>
          <p className="text-sm text-muted">Tria el dia de cada post o arrossega'l al calendari; per treure'l del calendari, torna'l aquí. Els posts amb data passen davant, per ordre de dia.</p>
          {insta && <p className="text-sm text-muted">{insta.connected ? 'Programa un post perquè es publiqui sol a una hora.' : "Per programar-los cal connectar el compte d'Instagram."}</p>}
        </div>
        {planned.length ? (
          <ol className="divide-y divide-separator">
            {planned.map((p, i) => {
              const t = byId.get(p.tpl)!;
              return (
                <li key={p.id} className={`flex items-center gap-3 p-3 sm:px-5 ${drag === p.id ? 'opacity-40' : ''}`}>
                  <div {...dragProps(p)} className="shrink-0 cursor-grab" title={`Arrossega ${t.title} a un dia`}>
                    <Art t={t} v={p.v} photo={p.photo} texts={p.texts} fit="cover" className="pointer-events-none aspect-[3/4] w-9 rounded-md" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold"><span className="tnum text-muted">{i + 1}</span> {t.title}</div>
                    {p.schedule ? <When s={p.schedule} hourOnly /> : p.date && p.date < today && <div className="text-xs text-warning">Aquest dia ja ha passat</div>}
                  </div>
                  <DayPicker label={`Dia del post ${i + 1}, ${t.title}`} hideLabel clearable value={p.date || ''} onChange={v => plan(p, v)} />
                  {insta?.connected && t.kind === 'post' && <Button size="sm" variant={p.schedule ? 'secondary' : 'ghost'} isIconOnly aria-label={`Programa el post ${i + 1}`} onPress={() => setProgramming(p)}><Clock size={16} /></Button>}
                </li>
              );
            })}
          </ol>
        ) : <p className="p-5 text-sm">No queda cap post per publicar.</p>}
      </section>
      {programming && <Publish later post={programming} n={planned.indexOf(programming) + 1} caption={data.copies[programming.id] || ''} onClose={() => setProgramming(null)} setData={setData} />}
    </div>
  );
}

// Publishing: the post as a full-size JPEG (one per image, for a carousel) on the site's photo storage, then Instagram fetches it
// and posts it with the saved caption (a story, without one). Now, or at a programmed time: then the JPEGs go up when it is
// programmed and the cron publishes it (lib/instagram.js)
async function sendOut(post: Post, at?: Date): Promise<Data> {
  const images: string[] = [];
  for (const x of imagesOf(post)) images.push(await uploadPhoto(new File([await png(byId.get(x.tpl)!, x.v, x.photo, x.texts)], 'post.png', { type: 'image/png' })));
  if (!at) return api<Data>('instagram', { method: 'POST', body: { id: post.id, images } });
  return api<Data>('social', { method: 'PUT', body: { schedule: { id: post.id, at: at.toISOString(), images } } });
}

function Publish({ post, n, caption, onClose, setData, later = false }: { post: Post; n: number; caption: string; onClose: () => void; setData: (d: Data) => void; later?: boolean }) {
  // How the toasts name it: «Post 3», or «La story» for a story
  const name = post.story ? 'La story' : `Post ${n}`, theName = post.story ? 'La story' : `El post ${n}`;
  const t = byId.get(post.tpl)!, was = post.schedule && new Date(post.schedule.at);
  const tomorrow = ymd(new Date(Date.now() + 864e5));
  const [mode, setMode] = useState<'now' | 'later'>(later || post.schedule ? 'later' : 'now');
  const [date, setDate] = useState(was ? ymd(was) : post.date && post.date > ymd(new Date()) ? post.date : tomorrow);
  const [time, setTime] = useState(was ? hour(post.schedule!.at) : '19:00');
  const [busy, setBusy] = useState<'' | 'go' | 'cancel'>('');
  const at = new Date(`${date}T${time}`), past = !date || !(at.getTime() > Date.now() + 60e3);

  async function go() {
    setBusy('go');
    try {
      setData(await sendOut(post, mode === 'now' ? undefined : at));
      done(mode === 'now' ? `${name} publicat${post.story ? 'da' : ''} a Instagram` : `${theName} ${programmed({ at: at.toISOString(), image: '' })}`);
      onClose();
    } catch (e) { toastError(e); }
    setBusy('');
  }
  async function cancel() {
    setBusy('cancel');
    try { setData(await api<Data>('social', { method: 'PUT', body: { schedule: { id: post.id } } })); done(`${theName} ja no està programa${post.story ? 'da' : 't'}`); onClose(); }
    catch (e) { toastError(e); }
    setBusy('');
  }
  return (
    <Dialog isOpen onClose={onClose} title="Publica a Instagram" subtitle={`${name}: ${t.title}`}
      footer={<>
        <Button variant="ghost" onPress={onClose} isDisabled={!!busy}>Cancel·la</Button>
        {post.schedule && <Button variant="danger-soft" onPress={cancel} isPending={busy === 'cancel'} isDisabled={busy === 'go'}>{busy === 'cancel' && <Spinner size="sm" color="current" />}Desprograma</Button>}
        <Button isPending={busy === 'go'} isDisabled={busy === 'cancel' || mode === 'later' && past} onPress={go}>
          {busy === 'go' ? <Spinner size="sm" color="current" /> : mode === 'now' ? <Send size={15} /> : <Clock size={15} />}{mode === 'now' ? 'Publica ara' : post.schedule ? 'Desa la programació' : 'Programa'}
        </Button>
      </>}>
      <div className="space-y-4">
        <ToggleButtonGroup aria-label="Quan" selectionMode="single" disallowEmptySelection selectedKeys={new Set([mode])}
          onSelectionChange={(k: Set<Key>) => { const [v] = k; if (v) setMode(v as typeof mode); }} size="sm">
          <ToggleButton id="now">Ara</ToggleButton>
          <ToggleButton id="later">Programa</ToggleButton>
        </ToggleButtonGroup>
        {mode === 'later' && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-end gap-3">
              <DayPicker label="Dia" value={date} onChange={setDate} />
              <HourField label="Hora" value={time} onChange={setTime} />
            </div>
            <p className={`text-xs ${date && past ? 'text-warning' : 'text-muted'}`}>{date && past ? 'Aquesta hora ja ha passat.' : post.story ? 'Es publica sola a aquesta hora.' : 'Es publica sol a aquesta hora, amb el copy que tingui llavors.'}</p>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
          <Art t={t} v={post.v} photo={post.photo} texts={post.texts} className="w-40 rounded-xl" />
          <div className="min-w-0 space-y-2">
            {post.story ? <p className="text-sm text-muted">Les stories no porten copy. Instagram no deixa afegir-hi l'enllaç des d'aquí: l'adreça de la web ja hi surt escrita.</p>
              : caption ? <p className="max-h-72 overflow-y-auto text-sm whitespace-pre-wrap">{caption}</p> : <p className="text-sm text-warning">Aquest post encara no té copy: es publicarà sense text.</p>}
            <p className="text-xs text-muted">{post.story ? "Un cop publicada, es pot esborrar des de l'app d'Instagram." : "Un cop publicat, es pot editar o esborrar des de l'app d'Instagram."}</p>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

// A day, picked on a calendar instead of the browser's own; '' is no day. clearable adds «Sense dia» under the calendar
function DayPicker({ label, value, onChange, clearable, hideLabel }: { label: string; value: string; onChange: (v: string) => void; clearable?: boolean; hideLabel?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <I18nProvider locale="ca-ES">
      <DatePicker aria-label={hideLabel ? label : undefined} value={value ? parseDate(value) : null} minValue={todayIn(getLocalTimeZone())}
        onChange={(d: DateValue | null) => onChange(d ? d.toString().slice(0, 10) : '')} isOpen={open} onOpenChange={setOpen} className="w-40 shrink-0">
        {!hideLabel && <Label>{label}</Label>}
        <DateField.Group fullWidth>
          <DateField.Input>{segment => <DateField.Segment segment={segment} />}</DateField.Input>
          <DateField.Suffix><DatePicker.Trigger><DatePicker.TriggerIndicator /></DatePicker.Trigger></DateField.Suffix>
        </DateField.Group>
        <DatePicker.Popover>
          <Calendar aria-label={label}>
            <Calendar.Header>
              <Calendar.Heading />
              <Calendar.NavButton slot="previous" />
              <Calendar.NavButton slot="next" />
            </Calendar.Header>
            <Calendar.Grid>
              <Calendar.GridHeader>{d => <Calendar.HeaderCell>{d}</Calendar.HeaderCell>}</Calendar.GridHeader>
              <Calendar.GridBody>{d => <Calendar.Cell date={d} />}</Calendar.GridBody>
            </Calendar.Grid>
          </Calendar>
          {clearable && value && <Button size="sm" variant="ghost" className="mt-2 w-full" onPress={() => { onChange(''); setOpen(false); }}>Sense dia</Button>}
        </DatePicker.Popover>
      </DatePicker>
    </I18nProvider>
  );
}

// An hour of the day, 24 h, as HH:MM
function HourField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <I18nProvider locale="ca-ES">
      <TimeField value={parseTime(value)} hourCycle={24} onChange={(v: Time | null) => { if (v) onChange(v.toString().slice(0, 5)); }} className="w-28">
        <Label>{label}</Label>
        <TimeField.Group fullWidth>
          <TimeField.Input>{segment => <TimeField.Segment segment={segment} />}</TimeField.Input>
        </TimeField.Group>
      </TimeField>
    </I18nProvider>
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

// The house captions (written as Mas d'en Bruno, Oller del Mas, Off Grid, La Vella Farga and Mas Grimosach do), the
// template's own first: all of them on Biblioteca, three when Claude is not available
function library(t: Template): Option[] {
  const all = COPIES.filter(c => c.hashtags), own = all.find(c => c.label === t.title);
  return own ? [own, ...all.filter(c => c !== own)] : all;
}
const libraryFor = (t: Template) => library(t).slice(0, 3);

// Options Claude already wrote, per post, so closing and reopening a panel doesn't pay for them again
const written = new Map<string, Option[]>();

function CopyPanel({ post, n, data, setData, posts }: { post: Post; n: number; data: Data; setData: (d: Data) => void; posts: Post[] }) {
  const t = byId.get(post.tpl)!;
  const [options, setOptions] = useState<Option[] | null>(written.get(post.id) || null);
  const [text, setText] = useState(data.copies[post.id] || '');
  const [busy, setBusy] = useState<'' | 'gen' | 'save'>('');
  const saved = data.copies[post.id] || '';
  const editor = useRef<HTMLTextAreaElement>(null);
  const dirty = text.trim() !== saved;
  // An option goes into the editor first, so it can be changed before it is saved
  const choose = (o: Option) => { setText(joinCopy(o)); requestAnimationFrame(() => { editor.current?.focus(); editor.current?.setSelectionRange(0, 0); editor.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }); };

  async function generate() {
    if (!data.ai) { setOptions(libraryFor(t)); return; }
    setBusy('gen');
    try {
      const used = posts.filter(p => p.id !== post.id && data.copies[p.id]).map(p => data.copies[p.id].split('\n')[0]);
      const d = await api<{ options: Option[] }>('social-copy', { method: 'POST', body: { title: t.title, onImage: onImage(t, post.v, post.texts), photo: photoAlt(t, post.v, post.photo), n, used } });
      written.set(post.id, d.options); setOptions(d.options);
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
        <p className="mr-auto text-sm text-muted">{data.ai ? "Claude escriu quatre opcions en català. L'última explica el que es veu." : 'Sense la clau de Claude, et proposo els copies de la casa.'}</p>
        {data.ai && <Button size="sm" variant="ghost" onPress={() => setOptions(library(t))}><BookOpen size={15} />Biblioteca</Button>}
        <Button size="sm" variant="secondary" isPending={busy === 'gen'} onPress={generate}>
          {busy === 'gen' ? <Spinner size="sm" color="current" /> : <Sparkles size={15} />}{options ? 'Altres opcions' : 'Proposa copies'}
        </Button>
      </div>
      {options && (
        <ul className="grid gap-2 md:grid-cols-2 2xl:grid-cols-4">
          {options.map((o, k) => (
            <li key={k} className="flex flex-col gap-2 rounded-xl bg-surface p-3 ring-1 ring-border">
              <p className="flex-1 text-sm whitespace-pre-wrap">{joinCopy(o)}</p>
              <Button size="sm" variant="secondary" className="self-start" onPress={() => choose(o)}><Check size={15} />Tria aquesta</Button>
            </li>
          ))}
        </ul>
      )}
      <TextField value={text} onChange={setText} fullWidth>
        <div className="flex items-center gap-2"><Label>Copy del post</Label>{dirty && text.trim() && <Tag tone="due">Sense desar</Tag>}</div>
        <TextArea ref={editor} rows={9} placeholder="Tria una opció o escriu-lo aquí" />
      </TextField>
      <div className="flex gap-2">
        <Button size="sm" isPending={busy === 'save'} isDisabled={!text.trim() || !dirty} onPress={() => keep(text)}>Desa</Button>
        {dirty && saved && <Button size="sm" variant="ghost" onPress={() => setText(saved)}>Torna al desat</Button>}
        <Button size="sm" variant="secondary" isDisabled={!text.trim()} onPress={copy}><CopyIcon size={15} />Copia</Button>
      </div>
    </div>
  );
}
