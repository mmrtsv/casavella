package com.casavellarural.maite.ui.social

import android.content.ClipData
import android.content.ClipboardManager
import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.os.Build
import android.provider.MediaStore
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.casavellarural.maite.R
import androidx.compose.ui.text.input.KeyboardType
import com.casavellarural.maite.data.Schedule
import com.casavellarural.maite.data.addDays
import com.casavellarural.maite.data.dayMonth
import com.casavellarural.maite.data.Api
import com.casavellarural.maite.data.ApiError
import com.casavellarural.maite.data.CaptionOption
import com.casavellarural.maite.data.CaptionOptions
import com.casavellarural.maite.data.Insta
import com.casavellarural.maite.data.Maite
import com.casavellarural.maite.data.Made
import com.casavellarural.maite.data.MadeOptions
import com.casavellarural.maite.data.Slide
import com.casavellarural.maite.data.Social
import com.casavellarural.maite.data.SocialPost
import com.casavellarural.maite.data.TODAY
import com.casavellarural.maite.data.localDayOf
import com.casavellarural.maite.data.monthTitle
import com.casavellarural.maite.data.parse
import com.casavellarural.maite.ui.Btn
import com.casavellarural.maite.ui.Card
import com.casavellarural.maite.ui.Cava
import com.casavellarural.maite.ui.CheckRow
import com.casavellarural.maite.ui.Choice
import com.casavellarural.maite.ui.Divider
import com.casavellarural.maite.ui.Field
import com.casavellarural.maite.ui.IconBtn
import com.casavellarural.maite.ui.LocalLayout
import com.casavellarural.maite.ui.Look
import com.casavellarural.maite.ui.Muted
import com.casavellarural.maite.ui.Panel
import com.casavellarural.maite.ui.Segmented
import com.casavellarural.maite.ui.Sheet
import com.casavellarural.maite.ui.T
import com.casavellarural.maite.ui.Tabs
import com.casavellarural.maite.ui.Tag
import com.casavellarural.maite.ui.Toasts
import com.casavellarural.maite.ui.Tone
import com.casavellarural.maite.ui.Type
import com.casavellarural.maite.ui.pagePadding
import com.casavellarural.maite.ui.screens.DateField
import com.casavellarural.maite.ui.screens.LoadingPage
import com.casavellarural.maite.ui.screens.jpeg
import com.casavellarural.maite.ui.Deep
import com.casavellarural.maite.ui.Ico
import com.casavellarural.maite.ui.screens.open
import com.casavellarural.maite.ui.screens.uploadJpeg
import com.casavellarural.maite.ui.screens.uploadPhoto
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

// Xarxes socials, as maite-app/src/pages/Social.tsx: a new post (from a description or from a template), the templates and the
// words changed on them, the profile grid of the posts made, captions, publishing, a calendar

private val TABS = listOf("new" to "Generador de posts", "posts" to "Posts", "stories" to "Stories i reels", "menus" to "Menús", "profile" to "Publicar", "calendar" to "Calendari")
private val KIND_OF = mapOf("posts" to "post", "stories" to "story")
private val HELP = mapOf(
    "new" to "Descriu-la i Claude la proposa, o fes-la tu des d'una plantilla. Abans d'afegir-la al perfil en pots canviar el text i la foto.",
    "posts" to "1080 × 1350 px. Només els colors de la marca. Edita una plantilla per canviar el text de les publicacions que en facis.",
    "stories" to "1080 × 1920 px. El text queda lluny de les franges de dalt i de baix, on Instagram posa els botons.",
)
/** What Crea'n un post on a template card hands to Nova publicació; n tells one hand-over from the next */
private data class Start(val id: String, val v: Int, val photo: String, val n: Int)
private fun inGrid(t: Template) = t.kind == "post" || t.id == "StoryReel"
/** The slides that follow a template in a carousel (the menu after the announcement), as they are before anyone changes them */
private fun nextSlides(t: Template) = Renderer.catalog?.carousels?.get(t.id).orEmpty().map { Slide(it) }
/** Every image of a post: the post itself, then the slides of a carousel */
private fun imagesOf(p: SocialPost) = (listOf(Slide(p.tpl, p.v, p.photo, p.texts)) + p.slides.orEmpty()).filter { Renderer.byId.containsKey(it.tpl) }
private fun joinCopy(o: CaptionOption) = o.caption.trim() + if (o.hashtags.isNotBlank()) "\n\n" + o.hashtags.trim() else ""
private var lastTab = "new"

@Composable
fun SocialScreen() {
    val context = LocalContext.current
    Renderer.loadCatalog(context)
    var tab by remember { mutableStateOf(lastTab.takeIf { t -> TABS.any { it.first == t } } ?: "new") }
    var start by remember { mutableStateOf<Start?>(null) }
    LaunchedEffect(Unit) { runCatching { Maite.loadSocial() }.onFailure { Toasts.error(it) } }
    val cat = Renderer.catalog ?: return LoadingPage()
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(pagePadding()), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Tabs(TABS, tab, { tab = it; lastTab = it })
        HELP[tab]?.let { Muted(it) }
        val kind = KIND_OF[tab]
        val data = Maite.social
        when {
            kind != null -> TemplateGrid(cat.templates.filter { it.kind == kind }, data, kind) { t, v, own ->
                start = Start(t.id, v, own, (start?.n ?: 0) + 1); tab = "new"; lastTab = tab
            }
            data == null -> com.casavellarural.maite.ui.Loading()
            tab == "menus" -> Menus(data)
            tab == "new" -> key(start?.n ?: 0) { NewPost(data, start) { tab = it; lastTab = it } }
            tab == "profile" -> Profile(data) { tab = "posts"; lastTab = tab }
            else -> Planner(data, { tab = "posts"; lastTab = tab }) { tab = "profile"; lastTab = tab }
        }
    }
}

/** A template, drawn by the renderer and scaled into its box: to the width, or covering it (grid tiles) */
@Composable
fun Art(t: Template, v: Int, photo: String, texts: List<String?>? = null, modifier: Modifier = Modifier, cover: Boolean = false) {
    var bmp by remember(t.id, v, photo, texts) { mutableStateOf<ImageBitmap?>(null) }
    LaunchedEffect(t.id, v, photo, texts) { runCatching { Renderer.thumb(t.id, v, photo, texts) }.onSuccess { bmp = it.asImageBitmap() } }
    Box(modifier.then(if (cover) Modifier else Modifier.aspectRatio(t.w / t.h.toFloat())).background(Cava)) {
        bmp?.let { Image(it, null, Modifier.matchParentSize(), contentScale = if (cover) ContentScale.Crop else ContentScale.FillWidth) }
    }
}

/** The images of a post one at a time, as Instagram shows a carousel; a single image is just the image */
@Composable
private fun Carousel(list: List<Slide>, modifier: Modifier = Modifier) {
    val byId = Renderer.byId
    if (list.size < 2) { val x = list.first(); return Art(byId.getValue(x.tpl), x.v, x.photo, x.texts, modifier) }
    val pager = androidx.compose.foundation.pager.rememberPagerState { list.size }
    Box(modifier) {
        androidx.compose.foundation.pager.HorizontalPager(pager, Modifier.fillMaxWidth()) { k ->
            val x = list[k]; Art(byId.getValue(x.tpl), x.v, x.photo, x.texts, Modifier.fillMaxWidth())
        }
        Text("${pager.currentPage + 1}/${list.size}", style = Type.xs, fontWeight = FontWeight.SemiBold, color = Color(0xFFF3EFE4),
            modifier = Modifier.align(Alignment.TopEnd).padding(8.dp).clip(CircleShape).background(Color(0xD91A3F20)).padding(horizontal = 8.dp, vertical = 2.dp))
    }
}

/** A post alone or as a carousel, for templates that can open one (the announcement, with the menu after it) */
@Composable
private fun SingleOrCarousel(carousel: Boolean, onChange: (Boolean) -> Unit) =
    Segmented(listOf("single" to "Una imatge", "carousel" to "Carrusel"), if (carousel) "carousel" else "single", { onChange(it == "carousel") })

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun TemplateGrid(list: List<Template>, data: Social?, kind: String, onCreate: (Template, Int, String) -> Unit) {
    val l = LocalLayout.current
    val per = if (kind == "post") (if (l.wide) 3 else if (l.rail) 2 else 1) else 2
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        list.chunked(per).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                row.forEach { t -> Box(Modifier.weight(1f)) { TemplateCard(t, data, compact = per > 1) { v, own -> onCreate(t, v, own) } } }
                repeat(per - row.size) { Spacer(Modifier.weight(1f)) }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun TemplateCard(t: Template, data: Social?, compact: Boolean, onCreate: (Int, String) -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var v by remember { mutableStateOf(0) }
    var own by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf("") }
    var editing by remember { mutableStateOf(false) }
    val texts = data?.templates?.get(t.id)
    val at = data?.posts.orEmpty().filter { it.published == null }.mapIndexedNotNull { i, p -> if (p.tpl == t.id) i + 1 else null }
    val pick = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) { busy = "photo"; scope.launch { try { own = uploadPhoto(context, uri) } catch (e: Exception) { Toasts.error(e) }; busy = "" } }
    }
    Card(Modifier.fillMaxWidth()) {
        Art(t, v, own, texts, Modifier.fillMaxWidth())
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(t.title, style = Type.base, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f), maxLines = 2, overflow = TextOverflow.Ellipsis)
            }
            if (at.isNotEmpty()) Tag(if (at.size == 1) "Post ${at[0]} del perfil" else "Posts ${at.joinToString(", ")} del perfil", Tone.Paid)
            if (!compact) Muted(t.desc)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                if (t.variants > 0) Btn(if (compact) "${v + 1}/${t.variants}" else "Una altra opció ${v + 1}/${t.variants}", { v = (v + 1) % t.variants; own = "" }, look = Look.Secondary, icon = R.drawable.ic_shuffle)
                if (t.photo.isNotEmpty()) Btn(if (compact) "Foto" else if (own.isNotEmpty()) "Una altra foto" else "La teva foto", { pick.launch("image/*") }, look = Look.Secondary, icon = R.drawable.ic_image_up, busy = busy == "photo")
                IconBtn(R.drawable.ic_download, "Descarrega ${t.title}", { busy = "png"; scope.launch { saveTemplate(context, t, v, own, texts, null); busy = "" } }, busy = busy == "png")
                if (data != null) IconBtn(R.drawable.ic_pencil, "Edita la plantilla ${t.title}", { editing = true })
                if (inGrid(t) && data != null) Btn("Crea'n un post", { onCreate(v, own); own = "" }, icon = R.drawable.ic_plus)
            }
        }
    }
    if (editing && data != null) TemplateEditor(t, data) { editing = false }
}

// ---------- Nova publicació ----------
/** The words with one changed, the others as they were (null keeps the template's) */
private fun List<String?>.with(i: Int, s: String): List<String?> = List(maxOf(size, i + 1)) { k -> if (k == i) s else getOrNull(k) }

/** Only the words that differ from the template's own (null for the rest), so a change of variation still changes those (paint.ts, changed) */
private suspend fun changed(t: Template, v: Int, texts: List<String?>?): List<String?> {
    val own = Renderer.fields(t.id, v)
    val out = own.mapIndexed { i, d -> texts?.getOrNull(i)?.trim()?.takeIf { it != d } }.toMutableList()
    while (out.isNotEmpty() && out.last() == null) out.removeAt(out.lastIndex)
    return out
}

/** The template drawn as the draft has it, and what can be changed on it: the variation and the photo (look), and its words */
@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun Editor(t: Template, v: Int, photo: String, texts: List<String?>, onChange: (Int, String, List<String?>) -> Unit, look: Boolean = true) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var defaults by remember(t.id, v) { mutableStateOf<List<String>?>(null) }
    LaunchedEffect(t.id, v) { defaults = runCatching { Renderer.fields(t.id, v) }.getOrDefault(emptyList()) }
    // The drawing follows the typing a moment later, not at every key
    var shown by remember { mutableStateOf(texts) }
    LaunchedEffect(texts) { delay(300); shown = texts }
    var busy by remember { mutableStateOf(false) }
    val now by androidx.compose.runtime.rememberUpdatedState(Triple(v, photo, texts))
    val pick = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) { busy = true; scope.launch { try { val up = uploadPhoto(context, uri); onChange(now.first, up, now.third) } catch (e: Exception) { Toasts.error(e) }; busy = false } }
    }
    Column {
        Art(t, v, photo, shown, Modifier.align(Alignment.CenterHorizontally).fillMaxWidth(0.7f).widthIn(max = 320.dp).clip(RoundedCornerShape(12.dp)))
        if (look && (t.variants > 0 || t.photo.isNotEmpty())) FlowRow(Modifier.padding(top = 12.dp), horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            if (t.variants > 0) Btn("Una altra opció ${v + 1}/${t.variants}", { onChange((v + 1) % t.variants, "", texts) }, look = Look.Secondary, icon = R.drawable.ic_shuffle)
            if (t.photo.isNotEmpty()) Btn(if (photo.isNotEmpty()) "Una altra foto" else "La teva foto", { pick.launch("image/*") }, look = Look.Secondary, icon = R.drawable.ic_image_up, busy = busy)
            if (photo.isNotEmpty()) Btn("La foto de la plantilla", { onChange(v, "", texts) }, look = Look.Ghost)
        }
        defaults?.let { d ->
            if (d.isEmpty()) Muted("Aquesta plantilla no porta text.", Modifier.padding(top = 12.dp))
            d.forEachIndexed { i, own ->
                val value = texts.getOrNull(i) ?: own
                Field("Text ${i + 1}", value, { onChange(v, photo, texts.with(i, it)) }, Modifier.padding(top = 12.dp), area = maxOf(own.length, value.length) > 40)
            }
        }
    }
}

/** Nova publicació: from a description (Claude proposes it) or from a template, changed, added to the end of the profile */
@Composable
private fun NewPost(data: Social, start: Start?, go: (String) -> Unit) {
    var how by remember { mutableStateOf(if (start != null || !data.ai) "template" else "prompt") }
    var live by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { live = runCatching { Api.get<Insta>("instagram") }.getOrNull()?.connected == true }
    val then = Then(live, go)
    if (data.ai) Segmented(listOf("prompt" to "Amb una descripció", "template" to "Des d'una plantilla"), how, { how = it })
    if (how == "prompt" && data.ai) Maker("post", then) else Composer(data, start, then)
}

/** The caption of a post being made in the generator: Claude's options (or the house ones) to pick from, then changed by hand.
 *  It is required: a post isn't added without it */
@Composable
private fun NewCopy(t: Template, v: Int, photo: String, texts: List<String?>, data: Social, value: String, onChange: (String) -> Unit) {
    var options by remember { mutableStateOf<List<CaptionOption>?>(null) }
    var busy by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    Column(Modifier.padding(top = 16.dp)) {
        Divider()
        Text("Copy", style = Type.sm, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(top = 12.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 8.dp)) {
            Btn(if (options != null) "Altres opcions" else "Proposa copies", {
                if (!data.ai) { options = libraryFor(t); return@Btn }
                busy = true
                scope.launch {
                    try {
                        val (onImage, alt) = Renderer.words(t.id, v, photo, texts)
                        val planned = data.posts.filter { it.published == null && !it.story }
                        val used = planned.mapNotNull { data.copies[it.id] }.map { it.lineSequence().first() }
                        options = Api.post<CaptionOptions>("social-copy", mapOf("title" to t.title, "onImage" to onImage, "photo" to alt, "n" to planned.size + 1, "used" to used)).options
                    } catch (e: ApiError) { Toasts.error(e); options = libraryFor(t) }
                    busy = false
                }
            }, look = Look.Secondary, icon = R.drawable.ic_sparkles, busy = busy)
            if (data.ai) Btn("Biblioteca", { options = library(t) }, look = Look.Ghost, icon = R.drawable.ic_book_open)
        }
        options?.forEach { o ->
            Column(Modifier.padding(top = 8.dp).fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(T.default.copy(alpha = 0.5f)).padding(12.dp)) {
                Text(joinCopy(o), style = Type.sm)
                Btn("Tria aquesta", { onChange(joinCopy(o)) }, Modifier.padding(top = 8.dp), look = Look.Secondary, icon = R.drawable.ic_check)
            }
        }
        Field("", value, onChange, Modifier.padding(top = 8.dp), area = true, placeholder = "Tria una opció o escriu-lo aquí")
        if (value.isBlank()) Text("Cal el copy per afegir-lo al perfil.", style = Type.xs, color = T.muted, modifier = Modifier.padding(top = 6.dp))
    }
}

/** Once a post is added it can go out from here (now or programmed), and Publicar or the calendar is one step away */
private class Then(val live: Boolean, val go: (String) -> Unit)

/** A post's number in the profile: its place among the posts still to publish */
private fun planNumber(d: Social, p: SocialPost) = d.posts.filter { it.published == null && !it.story }.indexOfFirst { it.id == p.id } + 1

/** Where a post just added stands: its number in the profile, programmed, or published */
@Composable
private fun Kept(post: SocialPost, n: Int) {
    when {
        post.published != null -> Text("Publicat a Instagram", style = Type.sm, color = T.muted)
        post.schedule != null -> When(post.schedule)
        else -> Tag("Post $n del perfil", Tone.Paid)
    }
}

/** What comes after adding it: publish or program it, then go to Publicar or, once programmed, to the calendar */
@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun Next(post: SocialPost, then: Then, onPublish: () -> Unit) {
    val context = LocalContext.current
    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        if (then.live && post.published == null) Btn(if (post.schedule != null) "Canvia la programació" else "Publica o programa", onPublish,
            look = if (post.schedule != null) Look.Secondary else Look.Primary, icon = if (post.schedule != null) R.drawable.ic_clock else R.drawable.ic_send)
        if (post.published?.url?.isNotEmpty() == true) Btn("Obre a Instagram", { open(context, post.published.url) }, look = Look.Ghost, icon = R.drawable.ic_external_link)
        Btn(if (post.schedule != null) "Vés al calendari" else "Vés a Publicar", { then.go(if (post.schedule != null) "calendar" else "profile") }, look = Look.Ghost)
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun Composer(data: Social, start: Start?, then: Then) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val list = Renderer.catalog!!.templates.filter(::inGrid)
    var id by remember { mutableStateOf(start?.id?.takeIf { s -> list.any { it.id == s } } ?: list.first().id) }
    var v by remember { mutableStateOf(start?.v ?: 0) }
    var photo by remember { mutableStateOf(start?.photo.orEmpty()) }
    var texts by remember { mutableStateOf(data.templates[id].orEmpty()) }
    var busy by remember { mutableStateOf("") }
    // The post just added, and whether its Publica a Instagram is open
    var added by remember { mutableStateOf("") }
    var publishing by remember { mutableStateOf(false) }
    val last = data.posts.find { it.id == added }
    // Every post leaves the generator with its caption
    var caption by remember { mutableStateOf("") }
    val t = Renderer.byId.getValue(id)
    // The announcement can open a carousel, with the menu after it
    val next = nextSlides(t)
    var carousel by remember { mutableStateOf(false) }
    val images = listOf(Slide(t.id, v, photo, texts)) + if (carousel) next else emptyList()
    fun blank(x: String) { id = x; v = 0; photo = ""; texts = data.templates[x].orEmpty(); carousel = false; caption = "" }
    Card(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp)) {
            Text("Plantilla", style = Type.base, fontWeight = FontWeight.SemiBold)
            Row(Modifier.padding(top = 10.dp).horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                list.forEach { x ->
                    Column(Modifier.width(84.dp)) {
                        Art(x, 0, "", data.templates[x.id], Modifier.fillMaxWidth().aspectRatio(4 / 5f).clip(RoundedCornerShape(8.dp))
                            .border(if (x.id == id) 2.dp else 0.dp, if (x.id == id) T.accent else Color.Transparent, RoundedCornerShape(8.dp))
                            .clickable { blank(x.id) }, cover = true)
                        Text(x.title, style = Type.xs, color = if (x.id == id) T.foreground else T.muted, fontWeight = if (x.id == id) FontWeight.SemiBold else FontWeight.Normal,
                            maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(top = 4.dp))
                    }
                }
            }
        }
    }
    Card(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp)) {
            Text(t.title, style = Type.base, fontWeight = FontWeight.SemiBold)
            Muted(t.desc, Modifier.padding(bottom = 12.dp))
            Editor(t, v, photo, texts, { nv, np, nt -> v = nv; photo = np; texts = nt })
            if (next.isNotEmpty()) {
                SingleOrCarousel(carousel) { carousel = it }
                if (carousel) Row(Modifier.padding(top = 10.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    next.forEach { x -> Art(Renderer.byId.getValue(x.tpl), x.v, x.photo, x.texts, Modifier.width(100.dp).clip(RoundedCornerShape(8.dp))) }
                }
            }
            key(id, added) { NewCopy(t, v, photo, texts, data, caption) { caption = it } }
            FlowRow(Modifier.fillMaxWidth().padding(top = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Btn("Descarrega", { busy = "png"; scope.launch { savePost(context, images, null); busy = "" } }, look = Look.Secondary, icon = R.drawable.ic_download, busy = busy == "png", enabled = busy.isEmpty())
                Btn("Afegeix al perfil", {
                    busy = "add"
                    scope.launch {
                        try {
                            val d = Api.post<Social>("social", mapOf("tpl" to t.id, "v" to v, "photo" to photo, "texts" to changed(t, v, texts), "slides" to images.drop(1).map { it.body() }, "copy" to caption))
                            Maite.social = d; blank(id); added = d.posts.last().id; publishing = then.live
                            Toasts.done("${t.title}: post ${d.posts.count { it.published == null && !it.story }} del perfil")
                        } catch (e: Exception) { Toasts.error(e) }
                        busy = ""
                    }
                }, icon = R.drawable.ic_plus, busy = busy == "add", enabled = busy.isEmpty() && caption.isNotBlank(), small = false)
            }
            if (last != null) Column(Modifier.padding(top = 12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Kept(last, planNumber(data, last))
                Next(last, then) { publishing = true }
            }
        }
    }
    if (publishing && last != null) Publish(last, planNumber(data, last), data.copies[last.id].orEmpty(), first = true) { publishing = false }
}

/** The words of a template, for the posts made from it from now on; the ones already made keep theirs */
@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun TemplateEditor(t: Template, data: Social, onClose: () -> Unit) {
    val saved = data.templates[t.id].orEmpty()
    var texts by remember { mutableStateOf(saved) }
    var busy by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    fun keep(b: String) {
        busy = b
        scope.launch {
            try {
                val tx = if (b == "save") changed(t, 0, texts) else emptyList()
                Maite.social = Api.put<Social>("social", mapOf("template" to mapOf("id" to t.id, "texts" to tx)))
                Toasts.done(if (b == "save") "Plantilla ${t.title} desada" else "${t.title} torna a tenir el text original"); onClose()
            } catch (e: Exception) { Toasts.error(e) }
            busy = ""
        }
    }
    Sheet(onClose) {
        Column(Modifier.padding(horizontal = 20.dp).padding(bottom = 28.dp).verticalScroll(rememberScrollState())) {
            Text("Edita la plantilla", style = Type.xl); Muted(t.title)
            Muted("Les publicacions noves en surten amb aquest text. Les que ja has fet no canvien.", Modifier.padding(top = 10.dp, bottom = 12.dp))
            Editor(t, 0, "", texts, { _, _, nt -> texts = nt }, look = false)
            FlowRow(Modifier.fillMaxWidth().padding(top = 18.dp), horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Btn("Cancel·la", onClose, look = Look.Ghost, enabled = busy.isEmpty())
                if (saved.isNotEmpty()) Btn("Torna a l'original", { keep("reset") }, look = Look.Secondary, busy = busy == "reset", enabled = busy.isEmpty())
                Btn("Desa la plantilla", { keep("save") }, busy = busy == "save", enabled = busy.isEmpty(), small = false)
            }
        }
    }
}

/** A post not yet published, changed; a programmed one gets its new image for the program */
@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun PostEditor(post: SocialPost, n: Int, onClose: () -> Unit) {
    val t = Renderer.byId.getValue(post.tpl)
    var v by remember { mutableStateOf(post.v) }
    var photo by remember { mutableStateOf(post.photo) }
    var texts by remember { mutableStateOf(post.texts.orEmpty()) }
    var busy by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    Sheet(onClose) {
        Column(Modifier.padding(horizontal = 20.dp).padding(bottom = 28.dp).verticalScroll(rememberScrollState())) {
            Text("Edita el post", style = Type.xl); Muted("Post $n: ${t.title}")
            if (post.schedule != null) Muted("Està programat: es publicarà amb aquests canvis.", Modifier.padding(top = 10.dp))
            Spacer(Modifier.height(12.dp))
            Editor(t, v, photo, texts, { nv, np, nt -> v = nv; photo = np; texts = nt })
            FlowRow(Modifier.fillMaxWidth().padding(top = 18.dp), horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Btn("Cancel·la", onClose, look = Look.Ghost, enabled = !busy)
                Btn("Desa els canvis", {
                    busy = true
                    scope.launch {
                        try {
                            val tx = changed(t, v, texts)
                            // A programmed post gets its new JPEGs: the first as changed, the slides of a carousel as they are
                            val images = if (post.schedule != null) imagesOf(post.copy(v = v, photo = photo, texts = tx)).map { x ->
                                uploadJpeg(withContext(Dispatchers.Default) { jpeg(Renderer.full(x.tpl, x.v, x.photo, x.texts), 1440, 92) })
                            } else null
                            Maite.social = Api.put<Social>("social", mapOf("edit" to mapOf("id" to post.id, "v" to v, "photo" to photo, "texts" to tx, "images" to images)))
                            Toasts.done("Post $n desat"); onClose()
                        } catch (e: Exception) { Toasts.error(e) }
                        busy = false
                    }
                }, busy = busy, small = false)
            }
        }
    }
}

/** Changing a proposal from Claude before it is confirmed: the template's words and photo, and the caption */
@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun MadeEditor(t: Template, photo: String, texts: List<String?>, caption: String, onDone: (String, List<String?>, String) -> Unit, onClose: () -> Unit) {
    var p by remember { mutableStateOf(photo) }
    var tx by remember { mutableStateOf(texts) }
    var c by remember { mutableStateOf(caption) }
    Sheet(onClose) {
        Column(Modifier.padding(horizontal = 20.dp).padding(bottom = 28.dp).verticalScroll(rememberScrollState())) {
            Text("Edita la proposta", style = Type.xl); Muted(t.title)
            Spacer(Modifier.height(12.dp))
            Editor(t, 0, p, tx, { _, np, nt -> p = np; tx = nt })
            if (inGrid(t)) Field("Copy", c, { c = it }, Modifier.padding(top = 16.dp), area = true)
            FlowRow(Modifier.fillMaxWidth().padding(top = 18.dp), horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Btn("Cancel·la", onClose, look = Look.Ghost)
                Btn("Fet", { onDone(p, tx, c.trim()) }, small = false)
            }
        }
    }
}

// A post or story from a description, with the owner's photo or without, on one of the templates or on the one Claude picks:
// Claude writes the words on it and the caption (and picks a photo from the library, when there isn't one)
private val made = mutableMapOf<String, Pair<String, List<Made>>>()

@Composable
private fun Maker(start: String, then: Then) {
    val l = LocalLayout.current
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var kind by remember(start) { mutableStateOf(start) }
    var style by remember(start) { mutableStateOf("general") }
    var tpl by remember(start) { mutableStateOf("") }
    var prompt by remember(start) { mutableStateOf("") }
    // The photo goes up as soon as it is picked: what the phone shows, and the address Claude gets
    var own by remember(start) { mutableStateOf<Pair<android.net.Uri, String>?>(null) }
    var busy by remember { mutableStateOf("") }
    var result by remember(start) { mutableStateOf(made[start]) }
    val pick = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) { busy = "photo"; scope.launch { try { own = uri to uploadPhoto(context, uri) } catch (e: Exception) { Toasts.error(e) }; busy = "" } }
    }
    // The kinds of post and the templates to choose from; with the owner's photo, only those that have one
    fun usable(t: Template?) = t != null && t.kind == kind && (own == null || t.photo.isNotEmpty())
    val styles = Renderer.catalog?.styles.orEmpty().filter { st -> st.kind == kind && st.tpls.any { usable(Renderer.byId[it]) } }
    val look = styles.find { it.id == style }
    val fits = Renderer.catalog?.templates.orEmpty().filter { usable(it) && (look == null || it.id in look.tpls) }
    val chosen = tpl.takeIf { id -> fits.any { it.id == id } }.orEmpty()
    Card(Modifier.fillMaxWidth(), padding = PaddingValues(16.dp)) {
        Segmented(listOf("post" to "Post", "story" to "Story"), kind, { kind = it })
        Choice("Tema", look?.id ?: "general", styles.map { it.id to it.label }, { style = it; tpl = "" }, Modifier.fillMaxWidth().padding(top = 12.dp))
        if (fits.size > 1) Choice("Plantilla", chosen.ifEmpty { "auto" }, listOf("auto" to "La tria Claude") + fits.map { it.id to it.title }, { tpl = if (it == "auto") "" else it }, Modifier.fillMaxWidth().padding(top = 12.dp))
        Field(if (own != null) "Què vols dir amb aquesta foto (opcional)" else if (kind == "post") "Què vols publicar" else "Què vols explicar a la story", prompt, { prompt = it }, Modifier.padding(top = 12.dp), area = true,
            placeholder = if (kind == "post") "El sopar de Cap d'Any al restaurant, 31 de desembre, 65 € per persona" else "Aquest cap de setmana encara queda lliure Les Vinyes")
        Row(Modifier.padding(top = 10.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            own?.let { AsyncImage(it.first, "La teva foto", Modifier.size(56.dp).clip(RoundedCornerShape(8.dp)), contentScale = ContentScale.Crop) }
            Btn(if (own != null) "Una altra foto" else "Afegeix una foto", { pick.launch("image/*") }, look = Look.Secondary, icon = R.drawable.ic_image_up, busy = busy == "photo")
            if (own != null) Btn("Treu la foto", { own = null }, look = Look.Ghost, icon = R.drawable.ic_x)
        }
        Muted(if (own != null) "Claude fa ${if (kind == "post") "el post" else "la story"} amb la teva foto i n'escriu el text i el copy." else if (chosen.isNotEmpty()) "Claude tria la foto i escriu el text de la imatge i el copy." else "Claude tria la plantilla i la foto, i escriu el text de la imatge i el copy.")
        Btn(if (result != null) "Altres propostes" else "Proposa", {
            busy = "make"
            scope.launch {
                try {
                    val d = Api.post<MadeOptions>("social-make", mapOf("prompt" to prompt, "kind" to kind, "photo" to own?.second.orEmpty(), "style" to (look?.id ?: ""), "tpl" to chosen))
                    result = kind to d.options.filter { Renderer.byId.containsKey(it.tpl) }; made[start] = result!!
                } catch (e: ApiError) { Toasts.error(e) }
                busy = ""
            }
        }, Modifier.padding(top = 10.dp), icon = R.drawable.ic_sparkles, busy = busy == "make", enabled = (prompt.isNotBlank() || own != null) && busy.isEmpty())
    }
    val per = if (l.wide) 3 else if (l.rail) 2 else 1
    result?.second.orEmpty().chunked(per).forEach { row ->
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            row.forEach { o -> Box(Modifier.weight(1f)) { MadeCard(o, compact = per > 1, then) } }
            repeat(per - row.size) { Spacer(Modifier.weight(1f)) }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun MadeCard(o: Made, compact: Boolean, then: Then) {
    val t = Renderer.byId[o.tpl] ?: return
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var caption by remember(o) { mutableStateOf(joinCopy(CaptionOption(o.caption, o.hashtags))) }
    var own by remember(o) { mutableStateOf("") }
    var texts by remember(o) { mutableStateOf(o.texts) }
    var busy by remember(o) { mutableStateOf("") }
    var keptId by remember(o) { mutableStateOf("") }
    var publishing by remember(o) { mutableStateOf(false) }
    val data = Maite.social
    val post = data?.posts?.find { it.id == keptId }
    val kept = if (data != null && post != null) planNumber(data, post) else 0
    var editing by remember(o) { mutableStateOf(false) }
    // A carousel when Claude filled the slides after it (the menu after the announcement); it can still go alone
    var carousel by remember(o) { mutableStateOf(o.slides.isNotEmpty()) }
    val photo = own.ifEmpty { o.photo }
    val list = listOf(Slide(t.id, 0, photo, texts)) + if (carousel) o.slides else emptyList()
    val pick = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) { busy = "photo"; scope.launch { try { own = uploadPhoto(context, uri) } catch (e: Exception) { Toasts.error(e) }; busy = "" } }
    }
    Card(Modifier.fillMaxWidth()) {
        Carousel(list, Modifier.fillMaxWidth())
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(t.title, style = Type.base, fontWeight = FontWeight.SemiBold, maxLines = 2, overflow = TextOverflow.Ellipsis)
            if (post != null) Kept(post, kept)
            if (o.slides.isNotEmpty() && post == null) SingleOrCarousel(carousel) { carousel = it }
            Text(caption, style = Type.sm, maxLines = if (compact) 6 else Int.MAX_VALUE, overflow = TextOverflow.Ellipsis)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                if (post == null) Btn("Edita", { editing = true }, look = Look.Secondary, icon = R.drawable.ic_pencil)
                if (t.photo.isNotEmpty() && post == null) Btn(if (compact) "Foto" else if (own.isNotEmpty()) "Una altra foto" else "La teva foto", { pick.launch("image/*") }, look = Look.Secondary, icon = R.drawable.ic_image_up, busy = busy == "photo")
                IconBtn(R.drawable.ic_copy, "Copia el copy", { (context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager).setPrimaryClip(ClipData.newPlainText("Copy", caption)); Toasts.done("Copy copiat") })
                IconBtn(R.drawable.ic_download, "Descarrega ${t.title}", { busy = "png"; scope.launch { savePost(context, list, null); busy = "" } }, busy = busy == "png")
                if (inGrid(t) && post == null) Btn("Confirma", {
                    busy = "confirm"
                    scope.launch {
                        try {
                            val d = Api.post<Social>("social", mapOf("tpl" to t.id, "v" to 0, "photo" to photo, "texts" to texts, "slides" to list.drop(1).map { it.body() }, "copy" to caption))
                            Maite.social = d
                            keptId = d.posts.last().id; publishing = then.live
                            Toasts.done("${t.title}: post ${planNumber(d, d.posts.last())} del perfil")
                        } catch (e: ApiError) { Toasts.error(e) }
                        busy = ""
                    }
                }, icon = R.drawable.ic_plus, busy = busy == "confirm", enabled = caption.isNotBlank())
            }
            if (post != null) Next(post, then) { publishing = true }
        }
    }
    if (publishing && post != null && data != null) Publish(post, kept, data.copies[post.id].orEmpty(), first = true) { publishing = false }
    if (editing) MadeEditor(t, photo, texts, caption, { p, tx, c -> own = if (p == o.photo) "" else p; texts = tx; caption = c; editing = false }) { editing = false }
}

/** Saves the full-size PNG to the phone's Pictures/Maite folder */
/** slide: the image's place in a carousel, so its files sort together and in order */
suspend fun saveTemplate(context: Context, t: Template, v: Int, photo: String, texts: List<String?>?, n: Int?, slide: Int? = null, toast: Boolean = true): Boolean = try {
    val bmp = Renderer.full(t.id, v, photo, texts)
    val name = (if (n != null) "%02d-".format(n) else "la-casa-vella-") + (if (slide != null) "$slide-" else "") + slug(t.title) + ".png"
    withContext(Dispatchers.IO) { saveBitmap(context, bmp, name) }
    if (toast) Toasts.done("Desat a Imatges, Maite")
    true
} catch (e: Exception) { Toasts.error(if (e is ApiError) e.message.orEmpty() else "No s'ha pogut fer la imatge"); false }

/** Every image of a post, one after the other, numbered when there are more than one */
suspend fun savePost(context: Context, list: List<Slide>, n: Int?, toast: Boolean = true): Boolean {
    for ((k, x) in list.withIndex()) {
        val t = Renderer.byId[x.tpl] ?: continue
        if (!saveTemplate(context, t, x.v, x.photo, x.texts, n, if (list.size > 1) k + 1 else null, toast = false)) return false
    }
    if (toast) Toasts.done("Desat a Imatges, Maite")
    return true
}

fun slug(s: String) = java.text.Normalizer.normalize(s.lowercase(), java.text.Normalizer.Form.NFD).replace(Regex("[\\u0300-\\u036f]"), "").replace(Regex("[^a-z0-9]+"), "-").trim('-')

private fun saveBitmap(context: Context, bmp: Bitmap, name: String) {
    val values = ContentValues().apply {
        put(MediaStore.Images.Media.DISPLAY_NAME, name); put(MediaStore.Images.Media.MIME_TYPE, "image/png")
        if (Build.VERSION.SDK_INT >= 29) put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/Maite")
    }
    val uri = context.contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values) ?: error("no media store")
    context.contentResolver.openOutputStream(uri)!!.use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) }
}

// ---------- Perfil ----------
@Composable
private fun Profile(data: Social, onEmpty: () -> Unit) {
    val byId = Renderer.byId
    val all = data.posts.filter { byId.containsKey(it.tpl) && !it.story }
    val posts = all.filter { it.published == null }
    val published = all.filter { it.published != null }.sortedByDescending { it.published!!.at }
    var show by remember { mutableStateOf("planned") }
    var open by remember { mutableStateOf<String?>(null) }
    var progress by remember { mutableStateOf("") }
    var insta by remember { mutableStateOf<Insta?>(null) }
    // The post whose Publica a Instagram is open, and whether it opens on Programa
    var publishing by remember { mutableStateOf<Pair<SocialPost, Boolean>?>(null) }
    var editing by remember { mutableStateOf<SocialPost?>(null) }
    var head by remember { mutableStateOf<ImageBitmap?>(null) }
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    LaunchedEffect(Unit) { insta = runCatching { Api.get<Insta>("instagram?media=1") }.getOrDefault(Insta()) }
    LaunchedEffect(Unit) { runCatching { Renderer.profile() }.onSuccess { head = it.asImageBitmap() } }

    fun order(planned: List<String>, msg: String) {
        val ids = planned + published.map { it.id }; val before = Maite.social
        Maite.social = data.copy(posts = ids.mapNotNull { id -> data.posts.find { it.id == id } })
        scope.launch {
            try { Maite.social = Api.put<Social>("social", mapOf("order" to ids)); Toasts.done(msg) }
            catch (e: ApiError) { Maite.social = before; Toasts.error(e) }
        }
    }
    if (all.isEmpty()) return Nothing("Encara no hi ha cap post confirmat.", onEmpty)
    if (published.isNotEmpty()) Segmented(listOf("planned" to "Per publicar", "published" to "Publicats"), show, { show = it })
    if (show == "published" && published.isNotEmpty()) return Published(published, data.copies)
    if (posts.isEmpty()) return Nothing("No queda cap post per publicar.", onEmpty)

    Card(Modifier.fillMaxWidth()) {
        Box(Modifier.fillMaxWidth().background(Color.White)) { head?.let { Image(it, null, Modifier.fillMaxWidth(), contentScale = ContentScale.FillWidth) } ?: Spacer(Modifier.height(160.dp)) }
        // The plan on top (the last to publish first, as Instagram will show it), then what is already on Instagram
        val tiles: List<Any> = posts.reversed() + insta?.media.orEmpty().sortedByDescending { it.at }
        tiles.chunked(3).forEach { row ->
            Row(Modifier.background(Color.White), horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                row.forEach { tile ->
                    Box(Modifier.weight(1f).aspectRatio(3 / 4f).padding(bottom = 2.dp)) {
                        if (tile is SocialPost) {
                            Art(byId.getValue(tile.tpl), tile.v, tile.photo, tile.texts, Modifier.matchParentSize(), cover = true)
                            if (!tile.slides.isNullOrEmpty()) Ico(R.drawable.ic_gallery_horizontal_end, tint = Color(0xFFF3EFE4), size = 15.dp, modifier = Modifier.align(Alignment.TopEnd).padding(5.dp))
                            Text("${posts.indexOf(tile) + 1}", style = Type.xs, fontWeight = FontWeight.SemiBold, color = Color(0xFFF3EFE4),
                                modifier = Modifier.padding(5.dp).clip(CircleShape).background(Color(0xD91A3F20)).padding(horizontal = 6.dp, vertical = 1.dp))
                            tile.schedule?.let { s ->
                                Row(Modifier.align(Alignment.BottomStart).padding(5.dp).clip(CircleShape).background(if (s.error != null) T.danger else Color(0xE6F3EFE4)).padding(horizontal = 6.dp, vertical = 1.dp),
                                    verticalAlignment = Alignment.CenterVertically) {
                                    val c = if (s.error != null) Color.White else Deep
                                    Ico(R.drawable.ic_clock, tint = c, size = 11.dp); Spacer(Modifier.width(3.dp))
                                    Text(if (s.error != null) "No publicat" else "${dayMonth(dayOfIso(s.at))} ${hourOf(s.at)}", style = Type.xs, fontWeight = FontWeight.Medium, color = c)
                                }
                            }
                        } else if (tile is com.casavellarural.maite.data.LiveMedia) {
                            AsyncImage(tile.image, "Publicat el ${dayMonth(tile.at.take(10))}", Modifier.matchParentSize().clickable(enabled = tile.url.isNotEmpty()) { open(context, tile.url) }, contentScale = ContentScale.Crop)
                            Box(Modifier.align(Alignment.TopEnd).padding(5.dp).clip(CircleShape).background(Color(0xD91A3F20)).padding(3.dp)) { Ico(R.drawable.ic_check, tint = Color(0xFFF3EFE4), size = 11.dp) }
                        }
                    }
                }
                repeat(3 - row.size) { Spacer(Modifier.weight(1f)) }
            }
        }
    }
    Card(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp)) {
            Text("Ordre de publicació", style = Type.base, fontWeight = FontWeight.SemiBold)
            Muted("El post 1 és el primer que publicaràs; a la graella queda a baix de tot.")
            insta?.let { Muted(if (it.connected) "Es publica a @${it.username}." else "Per publicar des d'aquí cal connectar el compte d'Instagram.") }
            Btn(if (progress.isNotEmpty()) "Descarregant $progress" else "Descarrega la graella", {
                scope.launch {
                    var ok = 0
                    for ((i, p) in posts.withIndex()) { progress = "${i + 1} de ${posts.size}"; if (savePost(context, imagesOf(p), i + 1, toast = false)) ok++ else break }
                    progress = ""
                    if (ok > 0) Toasts.done(if (ok == 1) "1 post descarregat" else "$ok posts descarregats")
                }
            }, Modifier.padding(top = 10.dp), look = Look.Secondary, icon = R.drawable.ic_download, busy = progress.isNotEmpty())
        }
        posts.forEachIndexed { i, p ->
            val t = byId.getValue(p.tpl); val copy = data.copies[p.id]
            Divider()
            Column(Modifier.padding(horizontal = 12.dp, vertical = 10.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Choice(null, "${i + 1}", posts.indices.map { "${it + 1}" to "${it + 1}" }, { k ->
                        val to = k.toInt() - 1
                        if (to != i) order(posts.map { it.id }.toMutableList().also { it.remove(p.id); it.add(to, p.id) }, "${t.title} ara és el post ${to + 1}")
                    }, Modifier.width(76.dp))
                    Spacer(Modifier.width(10.dp))
                    Art(t, p.v, p.photo, p.texts, Modifier.width(40.dp).aspectRatio(3 / 4f).clip(RoundedCornerShape(6.dp)), cover = true)
                    Spacer(Modifier.width(10.dp))
                    Column(Modifier.weight(1f)) {
                        Text(t.title, style = Type.sm, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Text(if (!p.slides.isNullOrEmpty()) "Carrusel de ${p.slides.size + 1} imatges" else if (p.photo.isNotEmpty() && !p.photo.startsWith("/maite/social/")) "Amb la teva foto" else if (p.texts != null) "Amb text propi" else "Opció ${p.v + 1}", style = Type.xs, color = T.muted)
                        Text(copy?.lineSequence()?.first() ?: "Sense copy", style = Type.xs, color = T.muted, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        p.schedule?.let { When(it) }
                    }
                }
                Row(Modifier.fillMaxWidth().padding(top = 4.dp), horizontalArrangement = Arrangement.End) {
                    IconBtn(R.drawable.ic_pencil, "Edita el post ${i + 1}", { editing = p })
                    IconBtn(R.drawable.ic_message_square_text, "Copy del post ${i + 1}", { open = if (open == p.id) null else p.id }, on = open == p.id)
                    if (insta?.connected == true && t.kind == "post") {
                        IconBtn(R.drawable.ic_clock, if (p.schedule != null) "Canvia la programació del post ${i + 1}" else "Programa el post ${i + 1}", { publishing = p to true }, on = p.schedule != null)
                        IconBtn(R.drawable.ic_send, "Publica ara el post ${i + 1}", { publishing = p to false })
                    }
                    var dl by remember { mutableStateOf(false) }
                    IconBtn(R.drawable.ic_download, "Descarrega el post ${i + 1}", { dl = true; scope.launch { savePost(context, imagesOf(p), i + 1); dl = false } }, busy = dl)
                    IconBtn(R.drawable.ic_x, "Treu ${t.title} del perfil", { order(posts.filter { it != p }.map { it.id }, "${t.title} tret del perfil") })
                }
                if (open == p.id) CopyPanel(p, i + 1, data, all)
            }
        }
    }
    editing?.let { p -> PostEditor(p, posts.indexOf(p) + 1) { editing = null } }
    publishing?.let { (p, later) -> key(p.id, later) { Publish(p, posts.indexOf(p) + 1, data.copies[p.id].orEmpty(), later = later) { publishing = null } } }
}

@Composable
private fun Nothing(text: String, onEmpty: () -> Unit) {
    Card(Modifier.fillMaxWidth(), padding = PaddingValues(18.dp)) {
        Text(text, style = Type.sm)
        Btn("Vés a Posts", onEmpty, Modifier.padding(top = 10.dp), look = Look.Secondary)
    }
}

@Composable
private fun Published(posts: List<SocialPost>, copies: Map<String, String>) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    Card(Modifier.fillMaxWidth()) {
        posts.forEachIndexed { i, p ->
            val t = Renderer.byId.getValue(p.tpl)
            if (i > 0) Divider()
            Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                Art(t, p.v, p.photo, p.texts, Modifier.width(40.dp).aspectRatio(3 / 4f).clip(RoundedCornerShape(6.dp)), cover = true)
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text(t.title, style = Type.sm, fontWeight = FontWeight.SemiBold)
                    Text("Publicat el ${parse(localDayOf(p.published!!.at)).let { "${it.dayOfMonth} ${com.casavellarural.maite.data.monthShort(it.monthValue)} ${it.year}" }}", style = Type.xs, color = T.muted)
                    Text(copies[p.id]?.lineSequence()?.first() ?: "Sense copy", style = Type.xs, color = T.muted, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                if (p.published!!.url.isNotEmpty()) IconBtn(R.drawable.ic_external_link, "Obre a Instagram", { open(context, p.published.url) })
                IconBtn(R.drawable.ic_download, "Descarrega ${t.title}", { scope.launch { savePost(context, imagesOf(p), null) } })
            }
        }
    }
}

// Options Claude already wrote, per post, so closing and reopening a panel doesn't pay for them again
private val written = mutableMapOf<String, List<CaptionOption>>()

// The house captions (written as Mas d'en Bruno, Oller del Mas, Off Grid, La Vella Farga and Mas Grimosach do), the
// template's own first: all of them on Biblioteca, three when Claude is not available
private fun library(t: Template): List<CaptionOption> {
    val all = Renderer.catalog?.copies.orEmpty().filter { it.hashtags.isNotEmpty() }
    val own = all.find { it.label == t.title }
    return (if (own != null) listOf(own) + (all - own) else all).map { CaptionOption(it.caption, it.hashtags) }
}
private fun libraryFor(t: Template) = library(t).take(3)

@Composable
private fun CopyPanel(post: SocialPost, n: Int, data: Social, posts: List<SocialPost>) {
    val t = Renderer.byId.getValue(post.tpl)
    val context = LocalContext.current
    val saved = data.copies[post.id].orEmpty()
    var options by remember { mutableStateOf(written[post.id]) }
    var text by remember(post.id) { mutableStateOf(saved) }
    var busy by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    val dirty = text.trim() != saved
    Panel(Modifier.fillMaxWidth().padding(top = 8.dp)) {
        Muted(if (data.ai) "Claude escriu quatre opcions en català. L'última explica el que es veu." else "Sense la clau de Claude, et proposo els copies de la casa.")
        Btn(if (options != null) "Altres opcions" else "Proposa copies", {
            if (!data.ai) { options = libraryFor(t); return@Btn }
            busy = "gen"
            scope.launch {
                try {
                    val (onImage, photo) = Renderer.words(t.id, post.v, post.photo, post.texts)
                    val used = posts.filter { it.id != post.id && data.copies[it.id] != null }.map { data.copies.getValue(it.id).lineSequence().first() }
                    val d = Api.post<CaptionOptions>("social-copy", mapOf("title" to t.title, "onImage" to onImage, "photo" to photo, "n" to n, "used" to used))
                    written[post.id] = d.options; options = d.options
                } catch (e: ApiError) { Toasts.error(e); options = libraryFor(t) }
                busy = ""
            }
        }, Modifier.padding(top = 8.dp), look = Look.Secondary, icon = R.drawable.ic_sparkles, busy = busy == "gen")
        if (data.ai) Btn("Biblioteca", { options = library(t) }, Modifier.padding(top = 6.dp), look = Look.Ghost, icon = R.drawable.ic_book_open)
        options?.forEach { o ->
            Column(Modifier.padding(top = 8.dp).fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(T.surface).border(1.dp, T.border, RoundedCornerShape(12.dp)).padding(12.dp)) {
                Text(joinCopy(o), style = Type.sm)
                Btn("Tria aquesta", { text = joinCopy(o) }, Modifier.padding(top = 8.dp), look = Look.Secondary, icon = R.drawable.ic_check)
            }
        }
        Row(Modifier.padding(top = 12.dp), verticalAlignment = Alignment.CenterVertically) {
            Text("Copy del post", style = Type.sm, fontWeight = FontWeight.Medium); Spacer(Modifier.width(8.dp))
            if (dirty && text.isNotBlank()) Tag("Sense desar", Tone.Due)
        }
        Field("", text, { text = it }, area = true, placeholder = "Tria una opció o escriu-lo aquí")
        Row(Modifier.padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Btn("Desa", {
                busy = "save"
                scope.launch {
                    try { Maite.social = Api.put<Social>("social", mapOf("copy" to mapOf("id" to post.id, "text" to text))); text = text.trim(); Toasts.done("Copy del post $n desat") }
                    catch (e: ApiError) { Toasts.error(e) }
                    busy = ""
                }
            }, enabled = text.isNotBlank() && dirty, busy = busy == "save")
            Btn("Copia", { (context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager).setPrimaryClip(ClipData.newPlainText("Copy", text)); Toasts.done("Copy copiat") }, look = Look.Secondary, icon = R.drawable.ic_copy, enabled = text.isNotBlank())
            if (dirty && saved.isNotEmpty()) Btn("Torna al desat", { text = saved }, look = Look.Ghost)
        }
    }
}

/** Publishing: the post as a JPEG on the site's photo storage, then Instagram fetches it and posts it with the saved caption */
// Programs are moments; Maite shows them in Barcelona's time
private val BCN = java.time.ZoneId.of("Europe/Madrid")
private fun hourOf(iso: String) = java.time.Instant.parse(iso).atZone(BCN).toLocalTime().toString().take(5)
private fun dayOfIso(iso: String) = java.time.Instant.parse(iso).atZone(BCN).toLocalDate().toString()
private fun programmed(s: Schedule) = "es publica el ${dayMonth(dayOfIso(s.at))} a les ${hourOf(s.at)}"

@Composable
private fun When(s: Schedule) {
    if (s.error != null) Text("No s'ha pogut publicar: ${s.error}", style = Type.xs, color = T.danger, maxLines = 2, overflow = TextOverflow.Ellipsis)
    else Text("Programat: ${dayMonth(dayOfIso(s.at))} a les ${hourOf(s.at)}", style = Type.xs, color = T.accent, maxLines = 1)
}

// Publishing: the post as a full-size JPEG (one per image, for a carousel) on the site's photo storage, then Instagram fetches it and posts it with the
// saved caption. Now, or at a programmed time: then the JPEG goes up now and the server publishes it when it is due
/** Renders and uploads the post's JPEGs (one per image: a carousel goes up whole), then publishes it now, or programs it for at */
private suspend fun sendOut(post: SocialPost, at: java.time.Instant?): Social {
    val images = imagesOf(post).map { x ->
        val big = Renderer.full(x.tpl, x.v, x.photo, x.texts)
        uploadJpeg(withContext(Dispatchers.Default) { jpeg(big, 1440, 92) })
    }
    return if (at == null) Api.post<Social>("instagram", mapOf("id" to post.id, "images" to images))
    else Api.put<Social>("social", mapOf("schedule" to mapOf("id" to post.id, "at" to at.toString(), "images" to images)))
}

@Composable
@OptIn(ExperimentalLayoutApi::class)
/** later: opens on Programa (by default, when it is already programmed). first: opened right after the post was added, so leaving it
 *  is «Més endavant»: it stays in the profile */
private fun Publish(post: SocialPost, n: Int, caption: String, later: Boolean? = null, first: Boolean = false, onClose: () -> Unit) {
    // How the toasts name it: «Post 3», or «La story» for a story
    val name = if (post.story) "La story" else "Post $n"; val theName = if (post.story) "La story" else "El post $n"
    val t = Renderer.byId.getValue(post.tpl)
    val was = post.schedule
    var mode by remember { mutableStateOf(if (later ?: (was != null)) "later" else "now") }
    var date by remember { mutableStateOf(was?.let { dayOfIso(it.at) } ?: post.date?.takeIf { it > TODAY } ?: addDays(TODAY, 1)) }
    var time by remember { mutableStateOf(was?.let { hourOf(it.at) } ?: "19:00") }
    var busy by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    val at = runCatching { java.time.LocalDateTime.parse("${date}T$time").atZone(BCN).toInstant() }.getOrNull()
    val past = at == null || !at.isAfter(java.time.Instant.now().plusSeconds(60))
    Sheet(onClose) {
        Column(Modifier.padding(horizontal = 20.dp).padding(bottom = 28.dp).verticalScroll(rememberScrollState())) {
            Text("Publica a Instagram", style = Type.xl); Muted("$name: ${t.title}")
            Segmented(listOf("now" to "Ara", "later" to "Programa"), mode, { mode = it }, Modifier.padding(top = 14.dp))
            if (mode == "later") {
                Row(Modifier.padding(top = 12.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Bottom) {
                    DateField("Dia", date, { date = it }, Modifier.weight(1f), min = TODAY)
                    Field("Hora", time, { v -> time = v.filter { it.isDigit() || it == ':' }.take(5) }, Modifier.width(110.dp), type = KeyboardType.Number, error = at == null)
                }
                Text(if (past) "Aquesta hora ja ha passat." else if (post.story) "Es publica sola a aquesta hora." else "Es publica sol a aquesta hora, amb el copy que tingui llavors.",
                    style = Type.xs, color = if (past) T.warningText else T.muted, modifier = Modifier.padding(top = 6.dp))
            }
            Row(Modifier.padding(top = 14.dp)) {
                Art(t, post.v, post.photo, post.texts, Modifier.width(120.dp).clip(RoundedCornerShape(12.dp)))
                Spacer(Modifier.width(14.dp))
                Column(Modifier.weight(1f)) {
                    if (post.story) Text("Les stories no porten copy. Instagram no deixa afegir-hi l'enllaç des d'aquí: l'adreça de la web ja hi surt escrita.", style = Type.sm, color = T.muted)
                    else if (caption.isNotEmpty()) Text(caption, style = Type.sm, maxLines = 12, overflow = TextOverflow.Ellipsis)
                    else Text("Aquest post encara no té copy: es publicarà sense text.", style = Type.sm, color = T.warningText)
                    if (first) Text("Més endavant el deixa al perfil, per publicar quan vulguis.", style = Type.xs, color = T.muted, modifier = Modifier.padding(top = 8.dp))
                    Text(if (post.story) "Un cop publicada, es pot esborrar des de l'app d'Instagram." else "Un cop publicat, es pot editar o esborrar des de l'app d'Instagram.", style = Type.xs, color = T.muted, modifier = Modifier.padding(top = 8.dp))
                }
            }
            FlowRow(Modifier.fillMaxWidth().padding(top = 18.dp), horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Btn(if (first) "Més endavant" else "Cancel·la", onClose, look = Look.Ghost, enabled = busy.isEmpty())
                if (was != null) Btn("Desprograma", {
                    busy = "cancel"
                    scope.launch {
                        try {
                            Maite.social = Api.put<Social>("social", mapOf("schedule" to mapOf("id" to post.id)))
                            Toasts.done("$theName ja no està ${if (post.story) "programada" else "programat"}"); onClose()
                        } catch (e: Exception) { Toasts.error(e) }
                        busy = ""
                    }
                }, look = Look.Danger, busy = busy == "cancel", enabled = busy.isEmpty())
                Btn(if (mode == "now") "Publica ara" else if (was != null) "Desa la programació" else "Programa", {
                    busy = "go"
                    scope.launch {
                        try {
                            Maite.social = sendOut(post, if (mode == "now") null else at)
                            Toasts.done(if (mode == "now") "$name ${if (post.story) "publicada" else "publicat"} a Instagram" else "$theName ${programmed(Schedule(at!!.toString()))}")
                            onClose()
                        } catch (e: Exception) { Toasts.error(e) }
                        busy = ""
                    }
                }, icon = if (mode == "now") R.drawable.ic_send else R.drawable.ic_clock, busy = busy == "go", enabled = busy.isEmpty() && !(mode == "later" && past), small = false)
            }
        }
    }
}

// ---------- Calendari ----------
@Composable
/** Calendari: the plan to look at, by day. Posts are programmed and published from Publicar */
private fun Planner(data: Social, onEmpty: () -> Unit, onPublish: () -> Unit) {
    val byId = Renderer.byId
    val all = data.posts.filter { byId.containsKey(it.tpl) && !it.story }
    val planned = all.filter { it.published == null }
    val today = TODAY
    var month by remember { mutableStateOf(parse(planned.firstNotNullOfOrNull { it.date }?.takeIf { it > today } ?: today).withDayOfMonth(1)) }
    var live by remember { mutableStateOf<List<com.casavellarural.maite.data.LiveMedia>>(emptyList()) }
    LaunchedEffect(Unit) { runCatching { Api.get<Insta>("instagram?media=1") }.onSuccess { live = it.media } }
    if (all.isEmpty()) return Nothing("Encara no hi ha cap post confirmat.", onEmpty)
    val ours = all.mapNotNull { it.published?.media }.toSet()
    fun on(day: String) = all.filter { (it.published?.let { p -> localDayOf(p.at) } ?: it.date) == day }
    fun liveOn(day: String) = live.filter { it.id !in ours && localDayOf(it.at) == day }
    val context = LocalContext.current
    Card(Modifier.fillMaxWidth()) {
        Row(Modifier.padding(start = 16.dp, end = 4.dp, top = 6.dp, bottom = 6.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(monthTitle(month.toString()), style = Type.base, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
            Btn("Avui", { month = parse(today).withDayOfMonth(1) }, look = Look.Ghost)
            IconBtn(R.drawable.ic_chevron_left, "Mes anterior", { month = month.minusMonths(1) })
            IconBtn(R.drawable.ic_chevron_right, "Mes següent", { month = month.plusMonths(1) })
        }
        Divider()
        Row { listOf("Dl", "Dt", "Dc", "Dj", "Dv", "Ds", "Dg").forEach { Text(it, style = Type.xs, color = T.muted, modifier = Modifier.weight(1f).padding(vertical = 6.dp), textAlign = androidx.compose.ui.text.style.TextAlign.Center) } }
        val lead = month.dayOfWeek.value - 1
        val count = month.lengthOfMonth()
        val cells = (0 until ((lead + count + 6) / 7) * 7).map { month.plusDays((it - lead).toLong()) }
        cells.chunked(7).forEach { week ->
            Row {
                week.forEach { d ->
                    val key = d.toString(); val inMonth = d.monthValue == month.monthValue
                    Column(Modifier.weight(1f).height(86.dp).border(0.5.dp, T.separator).background(if (inMonth) Color.Transparent else T.default.copy(alpha = 0.4f)).padding(3.dp)) {
                        Box(Modifier.size(22.dp).clip(CircleShape).background(if (key == today) T.accent else Color.Transparent), contentAlignment = Alignment.Center) {
                            Text("${d.dayOfMonth}", style = Type.xs, color = if (key == today) T.onAccent else if (inMonth) T.foreground else T.muted, fontWeight = if (key == today) FontWeight.SemiBold else FontWeight.Normal)
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(2.dp), modifier = Modifier.padding(top = 2.dp)) {
                            on(key).take(2).forEach { p ->
                                Art(byId.getValue(p.tpl), p.v, p.photo, p.texts, Modifier.weight(1f).aspectRatio(3 / 4f).clip(RoundedCornerShape(4.dp)).alpha(if (p.published != null) 0.6f else 1f)
                                    .clickable(enabled = p.published?.url?.isNotEmpty() == true) { open(context, p.published!!.url) }, cover = true)
                            }
                            liveOn(key).take(2).forEach { m ->
                                AsyncImage(m.image, null, Modifier.weight(1f).aspectRatio(3 / 4f).clip(RoundedCornerShape(4.dp)).alpha(0.6f).clickable { open(context, m.url) }, contentScale = ContentScale.Crop)
                            }
                        }
                    }
                }
            }
        }
    }
    Card(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp)) {
            Text("Per publicar", style = Type.base, fontWeight = FontWeight.SemiBold)
            Muted("Es programen i es publiquen des de Publicar.")
            Btn("Vés a Publicar", onPublish, Modifier.padding(top = 10.dp), look = Look.Secondary)
        }
        if (planned.isEmpty()) Text("No queda cap post per publicar.", style = Type.sm, modifier = Modifier.padding(16.dp))
        planned.forEachIndexed { i, p ->
            val t = byId.getValue(p.tpl)
            Divider()
            Row(Modifier.padding(horizontal = 12.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                Art(t, p.v, p.photo, p.texts, Modifier.width(36.dp).aspectRatio(3 / 4f).clip(RoundedCornerShape(6.dp)), cover = true)
                Spacer(Modifier.width(10.dp))
                Column(Modifier.weight(1f)) {
                    Text("${i + 1}  ${t.title}", style = Type.sm, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    when {
                        p.schedule != null -> When(p.schedule)
                        p.date != null && p.date < today -> Text("Aquest dia ja ha passat", style = Type.xs, color = T.warningText)
                        p.date != null -> Text("Previst el ${dayMonth(p.date)}", style = Type.xs, color = T.muted)
                        else -> Text("Sense programar", style = Type.xs, color = T.muted)
                    }
                }
            }
        }
    }
}

// ---------- Menús ----------
// As Menús in maite-app/src/pages/Social.tsx: a menu in three steps (the cover, the menu, when it goes out). It becomes the
// announcement with the menu after it, as a carousel post in the grid, and the same cover as a story; each goes out now, at a
// programmed time or later. The menus made here are listed under the form

/** The menu's words in the templates' text lines, as catalog.ts menuSlides: the carousel post, and the story */
private fun menuSlides(m: Menu, dishes: Int): Pair<Pair<Slide, List<Slide>>, Slide> {
    val price = m.price.trim().removeSuffix("€").trim()
    val whenLine = listOf(m.dates.trim(), if (price.isNotEmpty()) "$price € per persona" else "").filter { it.isNotEmpty() }.joinToString(", ")
    val cover = listOf("La Casa Vella, El Bedorc", m.kicker.trim(), m.title.trim(), m.subtitle.trim(), whenLine, "Reserva per DM")
    val menu = listOf(m.subtitle.trim(), m.name.trim()) + (0 until dishes).map { m.dishes.getOrElse(it) { "" }.trim() } +
        listOf(m.drinks.trim(), "Reserva per DM", if (price.isNotEmpty()) "$price€" else "", "persona", "La Casa Vella")
    return (Slide("PostAnnounce", 0, m.photo, cover) to listOf(Slide("PostMenu", 0, "", menu))) to
        Slide("StoryPoster", 0, m.photo, cover.take(5) + m.link.trim().ifEmpty { "Reserva per DM" })
}

/** A first caption for the menu, to change before it goes out (catalog.ts menuCaption) */
private fun menuCaption(m: Menu): String {
    val price = m.price.trim().removeSuffix("€").trim()
    return listOf(
        "${m.kicker.trim()} ${m.title.trim()}".trim() + ".",
        listOf(m.subtitle.trim(), m.dates.trim()).filter { it.isNotEmpty() }.joinToString(". ") + ".",
        (listOf(m.name.trim()) + m.dishes.map { it.trim() }.filter { it.isNotEmpty() }).filter { it.isNotEmpty() }.joinToString("\n"),
        if (price.isNotEmpty()) "$price € per persona, ${m.drinks.trim().ifEmpty { "begudes a part" }}." else "",
        "Reserva per DM",
    ).filter { it.isNotEmpty() && it != "." }.joinToString("\n\n")
}

private data class Out(val mode: String, val date: String, val time: String) {
    val at get() = runCatching { java.time.LocalDateTime.parse("${date}T$time").atZone(BCN).toInstant() }.getOrNull()
    val late get() = mode == "later" && at?.isAfter(java.time.Instant.now().plusSeconds(60)) != true
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun Menus(data: Social) {
    val cat = Renderer.catalog ?: return
    val defaults = cat.menu ?: return
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val byId = Renderer.byId
    var step by remember { mutableStateOf("cover") }
    var m by remember { mutableStateOf(defaults.example) }
    var own by remember { mutableStateOf<Pair<android.net.Uri, String>?>(null) }
    var copy by remember { mutableStateOf<String?>(null) }
    var insta by remember { mutableStateOf<Insta?>(null) }
    var post by remember { mutableStateOf(Out("later", addDays(TODAY, 1), "19:00")) }
    var story by remember { mutableStateOf(Out("later", addDays(TODAY, 1), "12:00")) }
    var withStory by remember { mutableStateOf(true) }
    var busy by remember { mutableStateOf("") }
    var publishing by remember { mutableStateOf<SocialPost?>(null) }
    LaunchedEffect(Unit) { insta = runCatching { Api.get<Insta>("instagram") }.getOrDefault(Insta()) }
    val pick = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) { busy = "photo"; scope.launch { try { own = uri to uploadPhoto(context, uri) } catch (e: Exception) { Toasts.error(e) }; busy = "" } }
    }
    val shown = m.copy(photo = own?.second ?: m.photo)
    val (made, madeStory) = menuSlides(shown, defaults.dishes)
    val caption = copy ?: menuCaption(m)
    val live = insta?.connected == true
    val ready = m.title.isNotBlank() && m.name.isNotBlank() && m.price.isNotBlank() && m.dishes.any { it.isNotBlank() } &&
        !(live && post.late) && !(live && withStory && story.late)

    @Composable
    fun OutFields(x: Out, change: (Out) -> Unit) {
        Segmented(listOf("later" to "Programa", "now" to "Ara", "save" to "Més endavant"), x.mode, { change(x.copy(mode = it)) }, Modifier.padding(top = 8.dp))
        if (x.mode == "later") Row(Modifier.padding(top = 10.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Bottom) {
            DateField("Dia", x.date, { change(x.copy(date = it)) }, Modifier.weight(1f), min = TODAY)
            Field("Hora", x.time, { v -> change(x.copy(time = v.filter { it.isDigit() || it == ':' }.take(5))) }, Modifier.width(110.dp), type = KeyboardType.Number, error = x.at == null)
        }
        if (x.late) Text("Aquesta hora ja ha passat.", style = Type.xs, color = T.warningText, modifier = Modifier.padding(top = 6.dp))
        if (x.mode == "save") Text("Es desa i el pots publicar o programar quan vulguis, des d'aquí sota.", style = Type.xs, color = T.muted, modifier = Modifier.padding(top = 6.dp))
    }

    fun save() {
        busy = "save"
        scope.launch {
            try {
                var d = Api.post<Social>("social", made.first.body() + mapOf("slides" to made.second.map { it.body() }, "menu" to true, "copy" to caption))
                val p = d.posts.last()
                var st: SocialPost? = null
                if (withStory) { d = Api.post<Social>("social", madeStory.body() + mapOf("story" to true, "menu" to true)); st = d.posts.last() }
                Maite.social = d
                val out = mutableListOf<String>()
                for ((x, w) in listOf(p to post, st to story)) {
                    if (x == null || !live || w.mode == "save") continue
                    d = sendOut(x, if (w.mode == "now") null else w.at); Maite.social = d
                    out += "${if (x.story) "la story" else "el post"} ${if (w.mode == "now") (if (x.story) "publicada" else "publicat") else programmed(Schedule(w.at.toString()))}"
                }
                Toasts.done(if (out.isEmpty()) "Menú desat" else "Menú desat: ${out.joinToString(" i ")}")
                step = "cover"; own = null; copy = null
            } catch (e: Exception) { Toasts.error(e) }
            busy = ""
        }
    }

    Card(Modifier.fillMaxWidth(), padding = PaddingValues(16.dp)) {
        Segmented(listOf("cover" to "Portada", "menu" to "Menú", "out" to "Publica"), step, { step = it })
        Column(Modifier.padding(top = 12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            when (step) {
                "cover" -> {
                    if (own == null) Choice("Foto de la portada", m.photo, cat.library.map { it.src to it.alt }, { m = m.copy(photo = it) }, Modifier.fillMaxWidth())
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        own?.let { AsyncImage(it.first, "La teva foto", Modifier.size(56.dp).clip(RoundedCornerShape(8.dp)), contentScale = ContentScale.Crop) }
                        Btn(if (own != null) "Una altra foto" else "La teva foto", { pick.launch("image/*") }, look = Look.Secondary, icon = R.drawable.ic_image_up, busy = busy == "photo")
                        if (own != null) Btn("Treu la foto", { own = null }, look = Look.Ghost, icon = R.drawable.ic_x)
                    }
                    Field("Damunt del títol", m.kicker, { m = m.copy(kicker = it) }, placeholder = "Torna la")
                    Field("Títol", m.title, { m = m.copy(title = it) }, placeholder = "Calçotada")
                    Field("Sota el títol", m.subtitle, { m = m.copy(subtitle = it) }, placeholder = "A la terrassa, cada diumenge")
                    Field("Dates", m.dates, { m = m.copy(dates = it) }, placeholder = "Del 18 de gener al 29 de març")
                    Btn("Següent", { step = "menu" }, Modifier.align(Alignment.End))
                }
                "menu" -> {
                    Field("Nom del menú", m.name, { m = m.copy(name = it) }, placeholder = "Menú de calçotada")
                    for (i in 0 until defaults.dishes) Field("Plat ${i + 1}", m.dishes.getOrElse(i) { "" }, { v -> m = m.copy(dishes = List(defaults.dishes) { k -> if (k == i) v else m.dishes.getOrElse(k) { "" } }) })
                    Field("Begudes", m.drinks, { m = m.copy(drinks = it) }, placeholder = "Vi del Penedès, aigua, cafè")
                    Field("Preu per persona (€)", m.price, { v -> m = m.copy(price = v.filter { it.isDigit() || it == ',' || it == '.' }) }, type = KeyboardType.Decimal)
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Btn("Enrere", { step = "cover" }, look = Look.Ghost); Btn("Següent", { step = "out" })
                    }
                }
                else -> {
                    if (insta != null && !live) Muted("Per publicar o programar des d'aquí cal connectar el compte d'Instagram. El menú es desa i el pots descarregar.")
                    Field("Copy del post", caption, { copy = it }, area = true)
                    if (live) Column {
                        Text("Post, carrusel amb el menú", style = Type.sm, fontWeight = FontWeight.SemiBold)
                        OutFields(post) { post = it }
                    }
                    CheckRow(withStory, { withStory = it }, "També com a story")
                    if (withStory && live) Column { OutFields(story) { story = it } }
                    if (withStory) Field("Adreça a la story", m.link, { m = m.copy(link = it) }, help = "Surt escrita a la story. Instagram no deixa posar-hi l'enllaç des d'aquí.")
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Btn("Enrere", { step = "menu" }, look = Look.Ghost)
                        Btn("Desa el menú", { save() }, icon = R.drawable.ic_check, busy = busy == "save", enabled = ready && busy.isEmpty())
                    }
                    if (!ready) Text("Cal el títol, el nom del menú, un plat i el preu.", style = Type.xs, color = T.muted)
                }
            }
        }
    }
    Card(Modifier.fillMaxWidth()) { Carousel(listOf(made.first) + made.second, Modifier.fillMaxWidth()) }
    if (withStory) Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Art(byId.getValue("StoryPoster"), 0, madeStory.photo, madeStory.texts, Modifier.width(110.dp).clip(RoundedCornerShape(12.dp)))
        Muted("La story")
    }

    // The menus made here, newest first: the post and its story
    val list = data.posts.filter { it.menu && byId.containsKey(it.tpl) }.sortedByDescending { it.at }
    val grid = data.posts.filter { it.published == null && !it.story }
    if (list.isNotEmpty()) Card(Modifier.fillMaxWidth()) {
        Text("Menús fets", style = Type.base, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(16.dp))
        list.forEach { p ->
            val t = byId.getValue(p.tpl)
            val title = listOfNotNull(p.texts?.getOrNull(1), p.texts?.getOrNull(2)).filter { it.isNotBlank() }.joinToString(" ").ifEmpty { t.title }
            Divider()
            Row(Modifier.padding(horizontal = 12.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                Art(t, p.v, p.photo, p.texts, Modifier.width(40.dp).aspectRatio(if (p.story) 9 / 16f else 3 / 4f).clip(RoundedCornerShape(6.dp)), cover = true)
                Spacer(Modifier.width(10.dp))
                Column(Modifier.weight(1f)) {
                    Text(title, style = Type.sm, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(if (p.story) "Story" else if (!p.slides.isNullOrEmpty()) "Post, carrusel de ${p.slides.size + 1} imatges" else "Post", style = Type.xs, color = T.muted, maxLines = 1)
                    when {
                        p.published != null -> Text("Publicat el ${dayMonth(localDayOf(p.published.at))}", style = Type.xs, color = T.muted)
                        p.schedule != null -> When(p.schedule)
                        else -> Text("Per publicar", style = Type.xs, color = T.muted)
                    }
                }
                if (p.published?.url?.isNotEmpty() == true) IconBtn(R.drawable.ic_external_link, "Obre a Instagram", { open(context, p.published.url) })
                if (live && p.published == null) IconBtn(if (p.schedule != null) R.drawable.ic_clock else R.drawable.ic_send, if (p.schedule != null) "Canvia la programació" else "Publica o programa", { publishing = p })
                var dl by remember { mutableStateOf(false) }
                IconBtn(R.drawable.ic_download, "Descarrega $title", { dl = true; scope.launch { savePost(context, imagesOf(p), null); dl = false } }, busy = dl)
                if (p.published == null) IconBtn(R.drawable.ic_x, "Treu $title", {
                    scope.launch {
                        try { Maite.social = Api.put<Social>("social", mapOf("remove" to p.id)); Toasts.done(if (p.story) "Story treta" else "Post tret del perfil") }
                        catch (e: ApiError) { Toasts.error(e) }
                    }
                })
            }
        }
    }
    publishing?.let { p -> Publish(p, grid.indexOf(p) + 1, data.copies[p.id].orEmpty(), later = true) { publishing = null } }
}
