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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
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

// Xarxes socials, as maite-app/src/pages/Social.tsx: templates, the profile grid of confirmed posts, captions, publishing, a calendar

private val TABS = listOf("posts" to "Posts", "stories" to "Stories i reels", "highlights" to "Destacats", "profile" to "Perfil", "calendar" to "Calendari", "copies" to "Copies")
private val KIND_OF = mapOf("posts" to "post", "stories" to "story", "highlights" to "highlight")
private val HELP = mapOf(
    "posts" to "1080 × 1350 px. Només els colors de la marca. Confirma els que vulguis publicar i ordena'ls a Perfil.",
    "stories" to "1080 × 1920 px. El text queda lluny de les franges de dalt i de baix, on Instagram posa els botons.",
    "highlights" to "Puja-les com a story i tria-les com a portada de cada destacat. Instagram n'agafa el cercle del centre.",
    "copies" to "Escrits com ho fan Mas d'en Bruno, Oller del Mas, Off Grid, La Vella Farga i Mas Grimosach.",
)
private fun inGrid(t: Template) = t.kind == "post" || t.id == "StoryReel"
private fun joinCopy(o: CaptionOption) = o.caption.trim() + if (o.hashtags.isNotBlank()) "\n\n" + o.hashtags.trim() else ""
private var lastTab = "posts"

@Composable
fun SocialScreen() {
    val context = LocalContext.current
    Renderer.loadCatalog(context)
    var tab by remember { mutableStateOf(lastTab) }
    LaunchedEffect(Unit) { runCatching { Maite.loadSocial() }.onFailure { Toasts.error(it) } }
    val cat = Renderer.catalog ?: return LoadingPage()
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(pagePadding()), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Tabs(TABS, tab, { tab = it; lastTab = it })
        HELP[tab]?.let { Muted(it) }
        val kind = KIND_OF[tab]
        val data = Maite.social
        when {
            kind != null -> TemplateGrid(cat.templates.filter { it.kind == kind }, data, kind)
            tab == "copies" -> Library(cat.copies)
            data == null -> com.casavellarural.maite.ui.Loading()
            tab == "profile" -> Profile(data) { tab = "posts"; lastTab = tab }
            else -> Planner(data) { tab = "posts"; lastTab = tab }
        }
    }
}

/** A template, drawn by the renderer and scaled into its box: to the width, or covering it (grid tiles) */
@Composable
fun Art(t: Template, v: Int, photo: String, modifier: Modifier = Modifier, cover: Boolean = false) {
    var bmp by remember(t.id, v, photo) { mutableStateOf<ImageBitmap?>(null) }
    LaunchedEffect(t.id, v, photo) { runCatching { Renderer.thumb(t.id, v, photo) }.onSuccess { bmp = it.asImageBitmap() } }
    Box(modifier.then(if (cover) Modifier else Modifier.aspectRatio(t.w / t.h.toFloat())).background(Cava)) {
        bmp?.let { Image(it, null, Modifier.matchParentSize(), contentScale = if (cover) ContentScale.Crop else ContentScale.FillWidth) }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun TemplateGrid(list: List<Template>, data: Social?, kind: String) {
    val l = LocalLayout.current
    val per = if (kind == "post") (if (l.wide) 3 else if (l.rail) 2 else 1) else 2
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        list.chunked(per).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                row.forEach { t -> Box(Modifier.weight(1f)) { TemplateCard(t, data, compact = per > 1) } }
                repeat(per - row.size) { Spacer(Modifier.weight(1f)) }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun TemplateCard(t: Template, data: Social?, compact: Boolean) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var v by remember { mutableStateOf(0) }
    var own by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf("") }
    val at = data?.posts.orEmpty().filter { it.published == null }.mapIndexedNotNull { i, p -> if (p.tpl == t.id) i + 1 else null }
    val pick = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) { busy = "photo"; scope.launch { try { own = uploadPhoto(context, uri) } catch (e: Exception) { Toasts.error(e) }; busy = "" } }
    }
    Card(Modifier.fillMaxWidth()) {
        Art(t, v, own, Modifier.fillMaxWidth())
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(t.title, style = Type.base, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f), maxLines = 2, overflow = TextOverflow.Ellipsis)
            }
            if (at.isNotEmpty()) Tag(if (at.size == 1) "Post ${at[0]} del perfil" else "Posts ${at.joinToString(", ")} del perfil", Tone.Paid)
            if (!compact) Muted(t.desc)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                if (t.variants > 0) Btn(if (compact) "${v + 1}/${t.variants}" else "Una altra opció ${v + 1}/${t.variants}", { v = (v + 1) % t.variants; own = "" }, look = Look.Secondary, icon = R.drawable.ic_shuffle)
                if (t.photo.isNotEmpty()) Btn(if (compact) "Foto" else if (own.isNotEmpty()) "Una altra foto" else "La teva foto", { pick.launch("image/*") }, look = Look.Secondary, icon = R.drawable.ic_image_up, busy = busy == "photo")
                IconBtn(R.drawable.ic_download, "Descarrega ${t.title}", { busy = "png"; scope.launch { saveTemplate(context, t, v, own, null); busy = "" } }, busy = busy == "png")
                if (inGrid(t) && data != null) Btn(if (at.isNotEmpty()) "Confirma un altre" else "Confirma", {
                    busy = "confirm"
                    scope.launch {
                        try {
                            val d = Api.post<Social>("social", mapOf("tpl" to t.id, "v" to v, "photo" to own))
                            Maite.social = d; own = ""
                            Toasts.done("${t.title}: post ${d.posts.count { it.published == null }} del perfil")
                        } catch (e: ApiError) { Toasts.error(e) }
                        busy = ""
                    }
                }, icon = R.drawable.ic_plus, busy = busy == "confirm")
            }
        }
    }
}

/** Saves the full-size PNG to the phone's Pictures/Maite folder */
suspend fun saveTemplate(context: Context, t: Template, v: Int, photo: String, n: Int?): Boolean = try {
    val bmp = Renderer.full(t.id, v, photo)
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
                            Art(byId.getValue(tile.tpl), tile.v, tile.photo, Modifier.matchParentSize(), cover = true)
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
                    for ((i, p) in posts.withIndex()) { progress = "${i + 1} de ${posts.size}"; if (saveTemplate(context, byId.getValue(p.tpl), p.v, p.photo, i + 1)) ok++ else break }
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
                    Art(t, p.v, p.photo, Modifier.width(40.dp).aspectRatio(3 / 4f).clip(RoundedCornerShape(6.dp)), cover = true)
                    Spacer(Modifier.width(10.dp))
                    Column(Modifier.weight(1f)) {
                        Text(t.title, style = Type.sm, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Text(if (p.photo.isNotEmpty()) "Amb la teva foto" else "Opció ${p.v + 1}", style = Type.xs, color = T.muted)
                        Text(copy?.lineSequence()?.first() ?: "Sense copy", style = Type.xs, color = T.muted, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        p.schedule?.let { When(it) }
                    }
                }
                Row(Modifier.fillMaxWidth().padding(top = 4.dp), horizontalArrangement = Arrangement.End) {
                    IconBtn(R.drawable.ic_message_square_text, "Copy del post ${i + 1}", { open = if (open == p.id) null else p.id }, on = open == p.id)
                    if (insta?.connected == true && t.kind == "post") IconBtn(if (p.schedule != null) R.drawable.ic_clock else R.drawable.ic_send, "Publica o programa el post ${i + 1}", { publishing = p }, on = p.schedule != null)
                    var dl by remember { mutableStateOf(false) }
                    IconBtn(R.drawable.ic_download, "Descarrega el post ${i + 1}", { dl = true; scope.launch { saveTemplate(context, t, p.v, p.photo, i + 1); dl = false } }, busy = dl)
                    IconBtn(R.drawable.ic_x, "Treu ${t.title} del perfil", { order(posts.filter { it != p }.map { it.id }, "${t.title} tret del perfil") })
                }
                if (open == p.id) CopyPanel(p, i + 1, data, all)
            }
        }
    }
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
                Art(t, p.v, p.photo, Modifier.width(40.dp).aspectRatio(3 / 4f).clip(RoundedCornerShape(6.dp)), cover = true)
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text(t.title, style = Type.sm, fontWeight = FontWeight.SemiBold)
                    Text("Publicat el ${parse(localDayOf(p.published!!.at)).let { "${it.dayOfMonth} ${com.casavellarural.maite.data.monthShort(it.monthValue)} ${it.year}" }}", style = Type.xs, color = T.muted)
                    Text(copies[p.id]?.lineSequence()?.first() ?: "Sense copy", style = Type.xs, color = T.muted, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                if (p.published!!.url.isNotEmpty()) IconBtn(R.drawable.ic_external_link, "Obre a Instagram", { open(context, p.published.url) })
                IconBtn(R.drawable.ic_download, "Descarrega ${t.title}", { scope.launch { saveTemplate(context, t, p.v, p.photo, null) } })
            }
        }
    }
}

// Options Claude already wrote, per post, so closing and reopening a panel doesn't pay for them again
private val written = mutableMapOf<String, List<CaptionOption>>()

private fun libraryFor(t: Template): List<CaptionOption> {
    val all = Renderer.catalog?.copies.orEmpty().filter { it.hashtags.isNotEmpty() }
    val own = all.find { it.label == t.title }
    return ((if (own != null) listOf(own) + (all - own) else all).take(3)).map { CaptionOption(it.caption, it.hashtags) }
}

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
        Muted(if (data.ai) "Claude escriu tres opcions en català." else "Sense la clau de Claude, et proposo els copies de la pestanya Copies.")
        Btn(if (options != null) "Altres opcions" else "Proposa copies", {
            if (!data.ai) { options = libraryFor(t); return@Btn }
            busy = "gen"
            scope.launch {
                try {
                    val (onImage, photo) = Renderer.words(t.id, post.v, post.photo.isNotEmpty())
                    val used = posts.filter { it.id != post.id && data.copies[it.id] != null }.map { data.copies.getValue(it.id).lineSequence().first() }
                    val d = Api.post<CaptionOptions>("social-copy", mapOf("title" to t.title, "onImage" to onImage, "photo" to photo, "n" to n, "used" to used))
                    written[post.id] = d.options; options = d.options
                } catch (e: ApiError) { Toasts.error(e); options = libraryFor(t) }
                busy = ""
            }
        }, Modifier.padding(top = 8.dp), look = Look.Secondary, icon = R.drawable.ic_sparkles, busy = busy == "gen")
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
                Art(t, post.v, post.photo, Modifier.width(120.dp).clip(RoundedCornerShape(12.dp)))
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
                            val big = Renderer.full(t.id, post.v, post.photo)
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
                                Art(byId.getValue(p.tpl), p.v, p.photo, Modifier.weight(1f).aspectRatio(3 / 4f).clip(RoundedCornerShape(4.dp)).alpha(if (p.published != null) 0.6f else 1f)
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
                Art(t, p.v, p.photo, Modifier.width(36.dp).aspectRatio(3 / 4f).clip(RoundedCornerShape(6.dp)), cover = true)
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

// ---------- Copies ----------
@Composable
private fun Library(list: List<LibCopy>) {
    val context = LocalContext.current
    list.forEach { c ->
        val full = c.caption + if (c.hashtags.isNotEmpty()) "\n\n" + c.hashtags else ""
        Card(Modifier.fillMaxWidth(), padding = PaddingValues(16.dp)) {
            Text(c.label, style = Type.base, fontWeight = FontWeight.SemiBold)
            Text(full, style = Type.sm, modifier = Modifier.padding(top = 8.dp))
            if (c.note.isNotEmpty()) Text(c.note, style = Type.xs, color = T.muted, modifier = Modifier.padding(top = 8.dp))
            Btn("Copia", { (context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager).setPrimaryClip(ClipData.newPlainText("Copy", full)); Toasts.done("Copy copiat") },
                Modifier.padding(top = 10.dp), look = Look.Secondary, icon = R.drawable.ic_copy)
        }
    }
}
