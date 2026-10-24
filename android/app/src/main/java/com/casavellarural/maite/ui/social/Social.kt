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
import com.casavellarural.maite.data.Social
import com.casavellarural.maite.data.SocialPost
import com.casavellarural.maite.data.TODAY
import com.casavellarural.maite.data.localDayOf
import com.casavellarural.maite.data.monthTitle
import com.casavellarural.maite.data.parse
import com.casavellarural.maite.ui.Btn
import com.casavellarural.maite.ui.Card
import com.casavellarural.maite.ui.Cava
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

private val TABS = listOf("new" to "Nova publicació", "posts" to "Posts", "stories" to "Stories i reels", "highlights" to "Destacats", "profile" to "Perfil", "calendar" to "Calendari")
private val KIND_OF = mapOf("posts" to "post", "stories" to "story", "highlights" to "highlight")
private val HELP = mapOf(
    "new" to "Descriu-la i Claude la proposa, o fes-la tu des d'una plantilla. Abans d'afegir-la al perfil en pots canviar el text i la foto.",
    "posts" to "1080 × 1350 px. Només els colors de la marca. Edita una plantilla per canviar el text de les publicacions que en facis.",
    "stories" to "1080 × 1920 px. El text queda lluny de les franges de dalt i de baix, on Instagram posa els botons.",
    "highlights" to "Puja-les com a story i tria-les com a portada de cada destacat. Instagram n'agafa el cercle del centre.",
)
/** What Crea'n un post on a template card hands to Nova publicació; n tells one hand-over from the next */
private data class Start(val id: String, val v: Int, val photo: String, val n: Int)
private fun inGrid(t: Template) = t.kind == "post" || t.id == "StoryReel"
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
            tab == "new" -> key(start?.n ?: 0) { NewPost(data, start) }
            tab == "profile" -> Profile(data) { tab = "posts"; lastTab = tab }
            else -> Planner(data) { tab = "posts"; lastTab = tab }
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
private fun NewPost(data: Social, start: Start?) {
    var how by remember { mutableStateOf(if (start != null || !data.ai) "template" else "prompt") }
    if (data.ai) Segmented(listOf("prompt" to "Amb una descripció", "template" to "Des d'una plantilla"), how, { how = it })
    if (how == "prompt" && data.ai) Maker("post") else Composer(data, start)
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun Composer(data: Social, start: Start?) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val list = Renderer.catalog!!.templates.filter(::inGrid)
    var id by remember { mutableStateOf(start?.id?.takeIf { s -> list.any { it.id == s } } ?: list.first().id) }
    var v by remember { mutableStateOf(start?.v ?: 0) }
    var photo by remember { mutableStateOf(start?.photo.orEmpty()) }
    var texts by remember { mutableStateOf(data.templates[id].orEmpty()) }
    var busy by remember { mutableStateOf("") }
    val t = Renderer.byId.getValue(id)
    fun blank(x: String) { id = x; v = 0; photo = ""; texts = data.templates[x].orEmpty() }
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
            FlowRow(Modifier.fillMaxWidth().padding(top = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Btn("Descarrega", { busy = "png"; scope.launch { saveTemplate(context, t, v, photo, texts, null); busy = "" } }, look = Look.Secondary, icon = R.drawable.ic_download, busy = busy == "png", enabled = busy.isEmpty())
                Btn("Afegeix al perfil", {
                    busy = "add"
                    scope.launch {
                        try {
                            val d = Api.post<Social>("social", mapOf("tpl" to t.id, "v" to v, "photo" to photo, "texts" to changed(t, v, texts)))
                            Maite.social = d; blank(id)
                            Toasts.done("${t.title}: post ${d.posts.count { it.published == null }} del perfil")
                        } catch (e: Exception) { Toasts.error(e) }
                        busy = ""
                    }
                }, icon = R.drawable.ic_plus, busy = busy == "add", enabled = busy.isEmpty(), small = false)
            }
        }
    }
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
                            val image = if (post.schedule != null) uploadJpeg(withContext(Dispatchers.Default) { jpeg(Renderer.full(t.id, v, photo, tx), 1440, 92) }) else null
                            Maite.social = Api.put<Social>("social", mapOf("edit" to mapOf("id" to post.id, "v" to v, "photo" to photo, "texts" to tx, "image" to image)))
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
private fun Maker(start: String) {
    val l = LocalLayout.current
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var kind by remember(start) { mutableStateOf(start) }
    var style by remember(start) { mutableStateOf("") }
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
        Choice("Tipus", look?.id ?: "auto", listOf("auto" to "Qualsevol") + styles.map { it.id to it.label }, { style = if (it == "auto") "" else it; tpl = "" }, Modifier.fillMaxWidth().padding(top = 12.dp))
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
            row.forEach { o -> Box(Modifier.weight(1f)) { MadeCard(o, compact = per > 1) } }
            repeat(per - row.size) { Spacer(Modifier.weight(1f)) }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun MadeCard(o: Made, compact: Boolean) {
    val t = Renderer.byId[o.tpl] ?: return
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var caption by remember(o) { mutableStateOf(joinCopy(CaptionOption(o.caption, o.hashtags))) }
    var own by remember(o) { mutableStateOf("") }
    var texts by remember(o) { mutableStateOf(o.texts) }
    var busy by remember(o) { mutableStateOf("") }
    var kept by remember(o) { mutableStateOf(0) }
    var editing by remember(o) { mutableStateOf(false) }
    val photo = own.ifEmpty { o.photo }
    val pick = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) { busy = "photo"; scope.launch { try { own = uploadPhoto(context, uri) } catch (e: Exception) { Toasts.error(e) }; busy = "" } }
    }
    Card(Modifier.fillMaxWidth()) {
        Art(t, 0, photo, texts, Modifier.fillMaxWidth())
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(t.title, style = Type.base, fontWeight = FontWeight.SemiBold, maxLines = 2, overflow = TextOverflow.Ellipsis)
            if (kept > 0) Tag("Post $kept del perfil", Tone.Paid)
            Text(caption, style = Type.sm, maxLines = if (compact) 6 else Int.MAX_VALUE, overflow = TextOverflow.Ellipsis)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                if (kept == 0) Btn("Edita", { editing = true }, look = Look.Secondary, icon = R.drawable.ic_pencil)
                if (t.photo.isNotEmpty() && kept == 0) Btn(if (compact) "Foto" else if (own.isNotEmpty()) "Una altra foto" else "La teva foto", { pick.launch("image/*") }, look = Look.Secondary, icon = R.drawable.ic_image_up, busy = busy == "photo")
                IconBtn(R.drawable.ic_copy, "Copia el copy", { (context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager).setPrimaryClip(ClipData.newPlainText("Copy", caption)); Toasts.done("Copy copiat") })
                IconBtn(R.drawable.ic_download, "Descarrega ${t.title}", { busy = "png"; scope.launch { saveTemplate(context, t, 0, photo, texts, null); busy = "" } }, busy = busy == "png")
                if (inGrid(t) && kept == 0) Btn("Confirma", {
                    busy = "confirm"
                    scope.launch {
                        try {
                            val d = Api.post<Social>("social", mapOf("tpl" to t.id, "v" to 0, "photo" to photo, "texts" to texts, "copy" to caption))
                            Maite.social = d
                            kept = d.posts.filter { it.published == null }.indexOf(d.posts.last()) + 1
                            Toasts.done("${t.title}: post $kept del perfil")
                        } catch (e: ApiError) { Toasts.error(e) }
                        busy = ""
                    }
                }, icon = R.drawable.ic_plus, busy = busy == "confirm")
            }
        }
    }
    if (editing) MadeEditor(t, photo, texts, caption, { p, tx, c -> own = if (p == o.photo) "" else p; texts = tx; caption = c; editing = false }) { editing = false }
}

/** Saves the full-size PNG to the phone's Pictures/Maite folder */
suspend fun saveTemplate(context: Context, t: Template, v: Int, photo: String, texts: List<String?>?, n: Int?): Boolean = try {
    val bmp = Renderer.full(t.id, v, photo, texts)
    val name = (if (n != null) "%02d-".format(n) else "la-casa-vella-") + slug(t.title) + ".png"
    withContext(Dispatchers.IO) { saveBitmap(context, bmp, name) }
    Toasts.done("Desat a Imatges, Maite")
    true
} catch (e: Exception) { Toasts.error(if (e is ApiError) e.message.orEmpty() else "No s'ha pogut fer la imatge"); false }

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
    val all = data.posts.filter { byId.containsKey(it.tpl) }
    val posts = all.filter { it.published == null }
    val published = all.filter { it.published != null }.sortedByDescending { it.published!!.at }
    var show by remember { mutableStateOf("planned") }
    var open by remember { mutableStateOf<String?>(null) }
    var progress by remember { mutableStateOf("") }
    var insta by remember { mutableStateOf<Insta?>(null) }
    var publishing by remember { mutableStateOf<SocialPost?>(null) }
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
                    for ((i, p) in posts.withIndex()) { progress = "${i + 1} de ${posts.size}"; if (saveTemplate(context, byId.getValue(p.tpl), p.v, p.photo, p.texts, i + 1)) ok++ else break }
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
                        Text(if (p.photo.isNotEmpty() && !p.photo.startsWith("/maite/social/")) "Amb la teva foto" else if (p.texts != null) "Amb text propi" else "Opció ${p.v + 1}", style = Type.xs, color = T.muted)
                        Text(copy?.lineSequence()?.first() ?: "Sense copy", style = Type.xs, color = T.muted, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        p.schedule?.let { When(it) }
                    }
                }
                Row(Modifier.fillMaxWidth().padding(top = 4.dp), horizontalArrangement = Arrangement.End) {
                    IconBtn(R.drawable.ic_pencil, "Edita el post ${i + 1}", { editing = p })
                    IconBtn(R.drawable.ic_message_square_text, "Copy del post ${i + 1}", { open = if (open == p.id) null else p.id }, on = open == p.id)
                    if (insta?.connected == true && t.kind == "post") IconBtn(if (p.schedule != null) R.drawable.ic_clock else R.drawable.ic_send, "Publica o programa el post ${i + 1}", { publishing = p }, on = p.schedule != null)
                    var dl by remember { mutableStateOf(false) }
                    IconBtn(R.drawable.ic_download, "Descarrega el post ${i + 1}", { dl = true; scope.launch { saveTemplate(context, t, p.v, p.photo, p.texts, i + 1); dl = false } }, busy = dl)
                    IconBtn(R.drawable.ic_x, "Treu ${t.title} del perfil", { order(posts.filter { it != p }.map { it.id }, "${t.title} tret del perfil") })
                }
                if (open == p.id) CopyPanel(p, i + 1, data, all)
            }
        }
    }
    editing?.let { p -> PostEditor(p, posts.indexOf(p) + 1) { editing = null } }
    publishing?.let { p -> Publish(p, posts.indexOf(p) + 1, data.copies[p.id].orEmpty()) { publishing = null } }
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
                IconBtn(R.drawable.ic_download, "Descarrega ${t.title}", { scope.launch { saveTemplate(context, t, p.v, p.photo, p.texts, null) } })
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

// Publishing: the post as a full-size JPEG on the site's photo storage, then Instagram fetches it and posts it with the
// saved caption. Now, or at a programmed time: then the JPEG goes up now and the server publishes it when it is due
@Composable
@OptIn(ExperimentalLayoutApi::class)
private fun Publish(post: SocialPost, n: Int, caption: String, onClose: () -> Unit) {
    val t = Renderer.byId.getValue(post.tpl)
    val was = post.schedule
    var mode by remember { mutableStateOf(if (was != null) "later" else "now") }
    var date by remember { mutableStateOf(was?.let { dayOfIso(it.at) } ?: post.date?.takeIf { it > TODAY } ?: addDays(TODAY, 1)) }
    var time by remember { mutableStateOf(was?.let { hourOf(it.at) } ?: "19:00") }
    var busy by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    val at = runCatching { java.time.LocalDateTime.parse("${date}T$time").atZone(BCN).toInstant() }.getOrNull()
    val past = at == null || !at.isAfter(java.time.Instant.now().plusSeconds(60))
    Sheet(onClose) {
        Column(Modifier.padding(horizontal = 20.dp).padding(bottom = 28.dp).verticalScroll(rememberScrollState())) {
            Text("Publica a Instagram", style = Type.xl); Muted("Post $n: ${t.title}")
            Segmented(listOf("now" to "Ara", "later" to "Programa"), mode, { mode = it }, Modifier.padding(top = 14.dp))
            if (mode == "later") {
                Row(Modifier.padding(top = 12.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Bottom) {
                    DateField("Dia", date, { date = it }, Modifier.weight(1f), min = TODAY)
                    Field("Hora", time, { v -> time = v.filter { it.isDigit() || it == ':' }.take(5) }, Modifier.width(110.dp), type = KeyboardType.Number, error = at == null)
                }
                Text(if (past) "Aquesta hora ja ha passat." else "Es publica sol a aquesta hora, amb el copy que tingui llavors.",
                    style = Type.xs, color = if (past) T.warningText else T.muted, modifier = Modifier.padding(top = 6.dp))
            }
            Row(Modifier.padding(top = 14.dp)) {
                Art(t, post.v, post.photo, post.texts, Modifier.width(120.dp).clip(RoundedCornerShape(12.dp)))
                Spacer(Modifier.width(14.dp))
                Column(Modifier.weight(1f)) {
                    if (caption.isNotEmpty()) Text(caption, style = Type.sm, maxLines = 12, overflow = TextOverflow.Ellipsis)
                    else Text("Aquest post encara no té copy: es publicarà sense text.", style = Type.sm, color = T.warningText)
                    Text("Un cop publicat, es pot editar o esborrar des de l'app d'Instagram.", style = Type.xs, color = T.muted, modifier = Modifier.padding(top = 8.dp))
                }
            }
            FlowRow(Modifier.fillMaxWidth().padding(top = 18.dp), horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Btn("Cancel·la", onClose, look = Look.Ghost, enabled = busy.isEmpty())
                if (was != null) Btn("Desprograma", {
                    busy = "cancel"
                    scope.launch {
                        try {
                            Maite.social = Api.put<Social>("social", mapOf("schedule" to mapOf("id" to post.id)))
                            Toasts.done("El post $n ja no està programat"); onClose()
                        } catch (e: Exception) { Toasts.error(e) }
                        busy = ""
                    }
                }, look = Look.Danger, busy = busy == "cancel", enabled = busy.isEmpty())
                Btn(if (mode == "now") "Publica ara" else if (was != null) "Desa la programació" else "Programa", {
                    busy = "go"
                    scope.launch {
                        try {
                            val big = Renderer.full(t.id, post.v, post.photo, post.texts)
                            val image = uploadJpeg(withContext(Dispatchers.Default) { jpeg(big, 1440, 92) })
                            if (mode == "now") {
                                Maite.social = Api.post<Social>("instagram", mapOf("id" to post.id, "image" to image))
                                Toasts.done("Post $n publicat a Instagram")
                            } else {
                                val s = Schedule(at!!.toString(), image)
                                Maite.social = Api.put<Social>("social", mapOf("schedule" to mapOf("id" to post.id, "at" to s.at, "image" to image)))
                                Toasts.done("El post $n ${programmed(s)}")
                            }
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
private fun Planner(data: Social, onEmpty: () -> Unit) {
    val byId = Renderer.byId
    val all = data.posts.filter { byId.containsKey(it.tpl) }
    val planned = all.filter { it.published == null }
    val today = TODAY
    var month by remember { mutableStateOf(parse(planned.firstNotNullOfOrNull { it.date }?.takeIf { it > today } ?: today).withDayOfMonth(1)) }
    var live by remember { mutableStateOf<List<com.casavellarural.maite.data.LiveMedia>>(emptyList()) }
    val scope = rememberCoroutineScope()
    LaunchedEffect(Unit) { runCatching { Api.get<Insta>("instagram?media=1") }.onSuccess { live = it.media } }
    if (all.isEmpty()) return Nothing("Encara no hi ha cap post confirmat.", onEmpty)
    val ours = all.mapNotNull { it.published?.media }.toSet()
    fun on(day: String) = all.filter { (it.published?.let { p -> localDayOf(p.at) } ?: it.date) == day }
    fun liveOn(day: String) = live.filter { it.id !in ours && localDayOf(it.at) == day }
    fun plan(p: SocialPost, date: String) {
        val before = Maite.social
        Maite.social = data.copy(posts = data.posts.map { if (it.id == p.id) it.copy(date = date.ifEmpty { null }) else it })
        scope.launch { try { Maite.social = Api.put<Social>("social", mapOf("date" to mapOf("id" to p.id, "date" to date))) } catch (e: ApiError) { Maite.social = before; Toasts.error(e) } }
    }
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
            Muted("Tria el dia de cada post. Els posts amb data passen davant, per ordre de dia. Es publiquen quan prems publicar a Perfil.")
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
                    if (p.date != null && p.date < today) Text("Aquest dia ja ha passat", style = Type.xs, color = T.warningText)
                    DateField("", p.date.orEmpty(), { plan(p, it) }, Modifier.padding(top = 4.dp), min = today)
                    if (p.date != null) Text("Treu la data", style = Type.xs, color = T.muted, modifier = Modifier.padding(top = 4.dp).clickable { plan(p, "") })
                }
            }
        }
    }
}
