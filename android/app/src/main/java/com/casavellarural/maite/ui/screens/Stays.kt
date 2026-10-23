package com.casavellarural.maite.ui.screens

import android.content.Context
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.casavellarural.maite.R
import com.casavellarural.maite.data.Api
import com.casavellarural.maite.data.ApiError
import com.casavellarural.maite.data.Content
import com.casavellarural.maite.data.Feat
import com.casavellarural.maite.data.Maite
import com.casavellarural.maite.data.PhotoResponse
import com.casavellarural.maite.data.StayContent
import com.casavellarural.maite.data.json
import com.casavellarural.maite.ui.Btn
import com.casavellarural.maite.ui.Card
import com.casavellarural.maite.ui.Choice
import com.casavellarural.maite.ui.Field
import com.casavellarural.maite.ui.IconBtn
import com.casavellarural.maite.ui.Look
import com.casavellarural.maite.ui.Muted
import com.casavellarural.maite.ui.Segmented
import com.casavellarural.maite.ui.Sheet
import com.casavellarural.maite.ui.T
import com.casavellarural.maite.ui.Tag
import com.casavellarural.maite.ui.Toasts
import com.casavellarural.maite.ui.Tone
import com.casavellarural.maite.ui.Type
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

fun photoUrl(src: String) = if (src.startsWith("http")) src else Api.base + (if (src.startsWith("/")) src else "/$src")

/** A feature icon from the server's catalog (24×24 stroke SVG markup) */
@Composable
fun SvgIcon(svg: String, size: Int = 20) {
    val ctx = LocalContext.current
    val doc = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">$svg</svg>"""
    AsyncImage(ImageRequest.Builder(ctx).data(doc.toByteArray()).memoryCacheKey(doc).build(), null, Modifier.size(size.dp), colorFilter = ColorFilter.tint(T.foreground))
}

/** Photos are resized on the phone (longest side 2000 px, JPEG) before going up */
suspend fun uploadPhoto(context: Context, uri: Uri): String {
    val bytes = withContext(Dispatchers.IO) {
        val raw = context.contentResolver.openInputStream(uri)!!.use { it.readBytes() }
        val bmp = android.graphics.BitmapFactory.decodeByteArray(raw, 0, raw.size) ?: throw ApiError("Aquest format d'imatge no es pot pujar", "type")
        jpeg(bmp, 2000, 85)
    }
    return uploadJpeg(bytes)
}
suspend fun uploadJpeg(bytes: ByteArray): String = json.decodeFromString(PhotoResponse.serializer(), Api.raw("POST", "photos", bytes = bytes, type = "image/jpeg")).src

/** Allotjaments: what the web shows for each stay, with a preview */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun Stays() {
    var content by remember { mutableStateOf(Maite.content) }
    LaunchedEffect(Unit) { runCatching { content = Maite.loadContent() }.onFailure { Toasts.error(it) } }
    val c = content ?: return LoadingPage()
    var stay by remember { mutableStateOf(Maite.stays.firstOrNull()?.id ?: c.stays.keys.first()) }
    var draft by remember(stay, c) { mutableStateOf(c.stays.getValue(stay)) }
    var dirty by remember(stay, c) { mutableStateOf(false) }
    var busy by remember { mutableStateOf(false) }
    var uploading by remember { mutableStateOf(0) }
    var iconsFor by remember { mutableStateOf<Int?>(null) }
    var library by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    fun edit(f: (StayContent) -> StayContent) { draft = f(draft); dirty = true }
    val pick = rememberLauncherForActivityResult(ActivityResultContracts.GetMultipleContents()) { uris ->
        uploading += uris.size
        scope.launch {
            uris.forEach { u ->
                try { val src = uploadPhoto(context, u); draft = draft.copy(photos = draft.photos + src); dirty = true } catch (e: Exception) { Toasts.error(e) }
                uploading -= 1
            }
        }
    }
    fun save() {
        if (uploading > 0) { Toasts.error("Espera que acabin de pujar les fotos"); return }
        busy = true
        scope.launch {
            try {
                val text = Api.raw("PUT", "stays", Api.toJson(mapOf("stay" to stay, "kind" to draft.kind, "name" to draft.name, "desc" to draft.desc, "max" to draft.max, "photos" to draft.photos,
                    "feats" to draft.feats.filter { it.text.isNotBlank() }.map { mapOf("icon" to it.icon, "text" to it.text) })).toString())
                val saved = json.decodeFromString(SavedStay.serializer(), text).stay
                Maite.content = c.copy(stays = c.stays + (stay to saved)); content = Maite.content
                Maite.stays = Maite.stays.map { if (it.id == stay) it.copy(name = "${saved.kind} ${saved.name}", short = saved.name, max = saved.max) else it }
                dirty = false; Toasts.done("Allotjament desat")
            } catch (e: ApiError) { Toasts.error(e) }
            busy = false
        }
    }

    Page {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Segmented(Maite.stays.map { it.id to (c.stays[it.id]?.name ?: it.short) }, stay, { if (!dirty) stay = it else Toasts.error("Desa o desfés els canvis abans de canviar d'allotjament") }, Modifier.weight(1f, fill = false))
            if (dirty) { Spacer(Modifier.width(10.dp)); Tag("Canvis sense desar", Tone.Due) }
        }
        Card(Modifier.fillMaxWidth(), padding = PaddingValues(18.dp)) {
            Field("Tipus", draft.kind, { v -> edit { it.copy(kind = v) } }, help = "Apartament, Habitació…")
            Field("Nom", draft.name, { v -> edit { it.copy(name = v) } }, Modifier.padding(top = 12.dp))
            Choice("Capacitat", "${draft.max}", (1..12).map { "$it" to "$it ${if (it == 1) "persona" else "persones"}" }, { v -> edit { it.copy(max = v.toInt()) } }, Modifier.padding(top = 12.dp))
            Field("Descripció", draft.desc, { v -> edit { it.copy(desc = v) } }, Modifier.padding(top = 12.dp), area = true)
        }
        Card(Modifier.fillMaxWidth(), padding = PaddingValues(18.dp)) {
            Text("Característiques", style = Type.base, fontWeight = FontWeight.SemiBold)
            draft.feats.forEachIndexed { i, f ->
                Column(Modifier.padding(top = 8.dp).clip(RoundedCornerShape(14.dp)).background(T.default.copy(alpha = 0.5f)).padding(6.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(Modifier.size(40.dp).clip(CircleShape).background(T.surface).clickable { iconsFor = if (iconsFor == i) null else i }, contentAlignment = Alignment.Center) { SvgIcon(c.icons[f.icon] ?: c.icons["star"].orEmpty()) }
                        Field("", f.text, { v -> edit { s -> s.copy(feats = s.feats.mapIndexed { j, x -> if (j == i) x.copy(text = v) else x }) } }, Modifier.weight(1f).padding(horizontal = 6.dp), placeholder = "Wifi gratuït…")
                        IconBtn(R.drawable.ic_chevron_up, "Puja", { edit { s -> s.copy(feats = s.feats.toMutableList().also { l -> l.add(i - 1, l.removeAt(i)) }) } }, enabled = i > 0)
                        IconBtn(R.drawable.ic_trash_2, "Treu", { edit { s -> s.copy(feats = s.feats.filterIndexed { j, _ -> j != i }) }; iconsFor = null })
                    }
                    if (iconsFor == i) FlowRow(Modifier.padding(top = 6.dp), horizontalArrangement = Arrangement.spacedBy(4.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        c.icons.forEach { (k, svg) ->
                            Row(Modifier.clip(RoundedCornerShape(10.dp)).background(if (k == f.icon) T.accent.copy(alpha = 0.15f) else T.surface)
                                .clickable { edit { s -> s.copy(feats = s.feats.mapIndexed { j, x -> if (j == i) x.copy(icon = k) else x }) }; iconsFor = null }.padding(horizontal = 8.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically) { SvgIcon(svg, 16); Spacer(Modifier.width(6.dp)); Text(c.iconNames[k] ?: k, style = Type.xs) }
                        }
                    }
                }
            }
            Btn("Afegeix una característica", { edit { it.copy(feats = it.feats + Feat("star", "")) }; iconsFor = draft.feats.size - 1 }, Modifier.padding(top = 10.dp), look = Look.Secondary, icon = R.drawable.ic_plus)
        }
        Card(Modifier.fillMaxWidth(), padding = PaddingValues(18.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Fotos", style = Type.base, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                if (c.uploads) IconBtn(R.drawable.ic_upload, "Puja fotos", { pick.launch("image/*") })
                IconBtn(R.drawable.ic_images, "Fotos de la web", { library = true })
            }
            Muted("La primera és la portada. Mou-les amb les fletxes.${if (!c.uploads) " Per pujar fotos noves cal connectar l'emmagatzematge R2." else ""}")
            val photos = draft.photos
            FlowRow(Modifier.padding(top = 10.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp), maxItemsInEachRow = 2) {
                photos.forEachIndexed { i, src ->
                    Box(Modifier.weight(1f).aspectRatio(4 / 3f).clip(RoundedCornerShape(14.dp)).background(T.default)) {
                        AsyncImage(photoUrl(src), null, Modifier.matchParentSize(), contentScale = ContentScale.Crop)
                        if (i == 0) Text("Portada", style = Type.xs, fontWeight = FontWeight.SemiBold, color = Color.White, modifier = Modifier.padding(8.dp).clip(CircleShape).background(Color(0x99000000)).padding(horizontal = 8.dp, vertical = 3.dp))
                        Row(Modifier.align(Alignment.BottomStart).fillMaxWidth().padding(4.dp)) {
                            PhotoTool(R.drawable.ic_arrow_left, "Mou a l'esquerra", i > 0) { edit { s -> s.copy(photos = s.photos.toMutableList().also { l -> l.add(i - 1, l.removeAt(i)) }) } }
                            PhotoTool(R.drawable.ic_arrow_right, "Mou a la dreta", i < photos.size - 1) { edit { s -> s.copy(photos = s.photos.toMutableList().also { l -> l.add(i + 1, l.removeAt(i)) }) } }
                            Spacer(Modifier.weight(1f))
                            if (i > 0) PhotoTool(R.drawable.ic_star, "Fes-la portada", true) { edit { s -> s.copy(photos = listOf(src) + (s.photos - src)) } }
                            PhotoTool(R.drawable.ic_x, "Treu la foto", true) { if (photos.size > 1) edit { s -> s.copy(photos = s.photos - src) } else Toasts.error("Cal almenys una foto") }
                        }
                    }
                }
                repeat(uploading) { Box(Modifier.weight(1f).aspectRatio(4 / 3f).clip(RoundedCornerShape(14.dp)).background(T.default), contentAlignment = Alignment.Center) { CircularProgressIndicator(Modifier.size(20.dp), color = T.accent, strokeWidth = 2.dp) } }
                if ((photos.size + uploading) % 2 == 1) Spacer(Modifier.weight(1f))
            }
        }
        Preview(draft, c)
        Btn("Desa els canvis", ::save, busy = busy, full = true, small = false, enabled = dirty)
        Muted("El rètol amb el nom que hi ha sobre la foto és una imatge: si canvies el nom, caldrà fer-ne un de nou.")
    }
    if (library) Library(c, draft.photos, { library = false }) { srcs -> edit { it.copy(photos = it.photos + srcs) } }
}

@kotlinx.serialization.Serializable
private data class SavedStay(val stay: StayContent)

@Composable
private fun PhotoTool(icon: Int, label: String, enabled: Boolean, onClick: () -> Unit) =
    Box(Modifier.padding(2.dp).size(32.dp).clip(CircleShape).background(Color(0x8C000000)).alpha(if (enabled) 1f else 0.3f).clickable(enabled = enabled, onClick = onClick), contentAlignment = Alignment.Center) {
        com.casavellarural.maite.ui.Ico(icon, tint = Color.White, size = 15.dp, label = label)
    }

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun Preview(d: StayContent, c: Content) {
    Card(Modifier.fillMaxWidth(), padding = PaddingValues(16.dp)) {
        Text("Així es veu a la web", style = Type.xs, fontWeight = FontWeight.Medium, color = T.muted)
        Box(Modifier.padding(top = 10.dp).fillMaxWidth().aspectRatio(4 / 3f).clip(RoundedCornerShape(14.dp)).background(T.default)) {
            d.photos.firstOrNull()?.let { AsyncImage(photoUrl(it), null, Modifier.matchParentSize(), contentScale = ContentScale.Crop) }
        }
        Text(d.kind, style = Type.xs, fontWeight = FontWeight.SemiBold, color = T.accent, modifier = Modifier.padding(top = 12.dp))
        Text(d.name, style = Type.xl)
        FlowRow(Modifier.padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            d.feats.filter { it.text.isNotBlank() }.forEach { f -> Row(verticalAlignment = Alignment.CenterVertically) { SvgIcon(c.icons[f.icon] ?: c.icons["star"].orEmpty(), 16); Spacer(Modifier.width(5.dp)); Text(f.text, style = Type.xs, color = T.muted) } }
        }
        Text(d.desc, style = Type.sm, modifier = Modifier.padding(top = 10.dp))
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun Library(c: Content, have: List<String>, onClose: () -> Unit, add: (List<String>) -> Unit) {
    var pick by remember { mutableStateOf(listOf<String>()) }
    Sheet(onClose, full = true) {
        Column(Modifier.verticalScroll(rememberScrollState()).padding(horizontal = 16.dp).padding(bottom = 24.dp)) {
            Text("Fotos de la web", style = Type.xl); Muted("Toca les que vulguis afegir.")
            FlowRow(Modifier.padding(top = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp), maxItemsInEachRow = 3) {
                c.library.forEach { src ->
                    val there = src in have; val on = src in pick
                    Box(Modifier.weight(1f).aspectRatio(4 / 3f).clip(RoundedCornerShape(12.dp)).alpha(if (there) 0.3f else 1f)
                        .then(if (on) Modifier.border(3.dp, T.accent, RoundedCornerShape(12.dp)) else Modifier)
                        .clickable(enabled = !there) { pick = if (on) pick - src else pick + src }) {
                        AsyncImage(photoUrl(src), null, Modifier.matchParentSize(), contentScale = ContentScale.Crop)
                    }
                }
            }
            Row(Modifier.fillMaxWidth().padding(top = 14.dp), horizontalArrangement = Arrangement.End) {
                Btn("Cancel·la", onClose, look = Look.Ghost); Spacer(Modifier.width(8.dp))
                Btn("Afegeix${if (pick.isNotEmpty()) " (${pick.size})" else ""}", { add(pick); onClose() }, enabled = pick.isNotEmpty())
            }
        }
    }
}

