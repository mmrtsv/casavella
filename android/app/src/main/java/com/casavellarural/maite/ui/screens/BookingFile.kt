package com.casavellarural.maite.ui.screens

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape

import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.core.content.FileProvider
import com.casavellarural.maite.R
import com.casavellarural.maite.data.Api
import com.casavellarural.maite.data.ApiError
import com.casavellarural.maite.data.Booking
import com.casavellarural.maite.data.BookingResponse
import com.casavellarural.maite.data.Maite
import com.casavellarural.maite.data.METHOD
import com.casavellarural.maite.data.PAYTYPE
import com.casavellarural.maite.data.Payment
import com.casavellarural.maite.data.SOURCE
import com.casavellarural.maite.data.TODAY
import com.casavellarural.maite.data.WALLET
import com.casavellarural.maite.data.atHome
import com.casavellarural.maite.data.cap
import com.casavellarural.maite.data.day
import com.casavellarural.maite.data.dueList
import com.casavellarural.maite.data.euro
import com.casavellarural.maite.data.hasDocs
import com.casavellarural.maite.data.isBooking
import com.casavellarural.maite.data.json
import com.casavellarural.maite.data.longDay
import com.casavellarural.maite.data.nightsBetween
import com.casavellarural.maite.data.nitsTxt
import com.casavellarural.maite.data.policyText
import com.casavellarural.maite.data.range
import com.casavellarural.maite.data.stamp
import com.casavellarural.maite.data.stampMillis
import com.casavellarural.maite.data.who
import com.casavellarural.maite.ui.Btn
import com.casavellarural.maite.ui.Card
import com.casavellarural.maite.ui.Choice
import com.casavellarural.maite.ui.Divider
import com.casavellarural.maite.ui.Field
import com.casavellarural.maite.ui.Ico
import com.casavellarural.maite.ui.Look
import com.casavellarural.maite.ui.Panel
import com.casavellarural.maite.ui.Progress
import com.casavellarural.maite.ui.Sheet
import com.casavellarural.maite.ui.Status
import com.casavellarural.maite.ui.T
import com.casavellarural.maite.ui.Tabs
import com.casavellarural.maite.ui.Toasts
import com.casavellarural.maite.ui.Type
import com.casavellarural.maite.ui.Ui
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.File

/** Client file: Resum (where the stay is at and the checklist), Reserva (dates, payment, policy), Client (contact, papers, other stays) */
@Composable
fun BookingFile() {
    val key = Ui.detail ?: return
    val b = Maite.bookings[key] ?: run { Ui.detail = null; return }
    var tab by remember(key) { mutableStateOf("overview") }
    Sheet({ Ui.detail = null }, full = true) {
        Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(horizontal = 18.dp).padding(bottom = 40.dp)) {
            Text(who(b), style = Type.xl)
            FlowLine(b)
            if (!isBooking(b)) { OtherEntry(b); return@Column }
            Tabs(listOf("overview" to "Resum", "booking" to "Reserva", "client" to "Client"), tab, { tab = it }, Modifier.padding(top = 14.dp, bottom = 16.dp))
            when (tab) {
                "overview" -> Overview(b) { tab = "client" }
                "booking" -> BookingTab(b)
                else -> ClientTab(b)
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun FlowLine(b: Booking) {
    val n = nightsBetween(TODAY, b.first)
    val stage = if (!isBooking(b)) nitsTxt(nightsBetween(b.first, b.until)) else when {
        b.checkout.isNotEmpty() -> "Ja ha marxat"
        atHome(b) -> "A casa"
        b.first > TODAY -> "Arriba d'aquí a ${if (n == 1) "1 dia" else "$n dies"}"
        b.first == TODAY -> "Arriba avui"
        b.until < TODAY -> "Estada acabada"
        else -> "Hauria de ser a casa"
    }
    FlowRow(Modifier.padding(top = 6.dp), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Status(b)
        Text(stage, style = Type.sm, color = T.muted)
        Text(Maite.shortName(b.stay), style = Type.sm, color = T.muted)
        Text(range(b.first, b.until), style = Type.sm, color = T.muted)
    }
}

// Saves a checklist change on the booking's calendar event: shows at once, and a failure puts back what was there
private val latest = mutableMapOf<String, Int>()
fun saveCheck(b: Booking, set: Map<String, Any?>) {
    val key = b.key; val was = Maite.bookings[key] ?: b; val n = (latest[key] ?: 0) + 1
    latest[key] = n
    var now = was
    set.forEach { (k, v) ->
        now = when (k) {
            "checkin" -> now.copy(checkin = if (v == true) java.time.Instant.now().toString() else "")
            "checkout" -> now.copy(checkout = if (v == true) java.time.Instant.now().toString() else "")
            "settled" -> now.copy(settled = v == true)
            "method" -> now.copy(method = v as String)
            "email" -> now.copy(email = v as String)
            "phone" -> now.copy(phone = v as String)
            "memo" -> now.copy(memo = v as String)
            else -> now
        }
    }
    Maite.setBooking(now)
    Maite.scope.launch {
        try {
            val d = Api.post<BookingResponse>("check", mapOf("stay" to b.stay, "id" to b.id, "set" to set))
            if (latest[key] == n) Maite.setBooking(d.booking)
        } catch (e: ApiError) {
            if (latest[key] == n) Maite.setBooking(was)
            Toasts.error(e)
        }
    }
}

@Composable
private fun Row2(ok: Boolean?, title: String, sub: String?, control: (@Composable () -> Unit)? = null, trailing: @Composable () -> Unit = {}) {
    Row(Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
        if (control != null) control() else Box(
            Modifier.size(22.dp).clip(CircleShape).background(if (ok == true) T.accent else T.foreground.copy(alpha = 0.08f)),
            contentAlignment = Alignment.Center,
        ) { if (ok == true) Ico(R.drawable.ic_check, tint = T.onAccent, size = 13.dp) }
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text(title, style = Type.sm, fontWeight = FontWeight.Medium)
            if (sub != null) Text(sub, style = Type.sm, color = T.muted)
        }
        trailing()
    }
}

@Composable
private fun Overview(b: Booking, toClient: () -> Unit) {
    val list = dueList(b); val done = list.count { it.ok }
    val rules = Maite.settings?.rules
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Fact2("Nits", "${nightsBetween(b.first, b.until)}", Modifier.weight(1f))
        Fact2("Persones", b.guests?.toString() ?: "–", Modifier.weight(1f))
        Fact2("Import", b.amount?.let(::euro) ?: "–", Modifier.weight(1.3f))
    }
    Panel(Modifier.fillMaxWidth().padding(top = 8.dp)) {
        Text("Llista", style = Type.xs, color = T.muted)
        Progress(done, list.size, Modifier.padding(top = 6.dp), width = 160.dp)
    }
    if (b.arrival.isNotEmpty() || b.notes.isNotEmpty()) Panel(Modifier.fillMaxWidth().padding(top = 8.dp)) {
        if (b.arrival.isNotEmpty()) Text("Arribada prevista: ${b.arrival}", style = Type.sm)
        if (b.notes.isNotEmpty()) Text("Comentaris de l'hoste: ${b.notes}", style = Type.sm, modifier = Modifier.padding(top = 4.dp))
    }
    Card(Modifier.fillMaxWidth().padding(top = 12.dp)) {
        when (b.kind) {
            "paid" -> Row2(true, "Pagada a la web", "${euro(b.amount)}${if (b.refunded > 0) ", retornats ${euro(b.refunded)}" else ""}")
            "pending" -> Row2(false, "Pendent del banc", "${euro(b.amount)}. Stripe encara no l'ha confirmat.")
            else -> Row2(null, "Cobrada", "${b.amount?.let(::euro) ?: "Sense import"}${if (b.method.isNotEmpty()) ", ${METHOD[b.method]}" else ""}", control = {
                Checkbox(b.settled, { saveCheck(b, mapOf("settled" to it)) }, Modifier.size(22.dp), colors = CheckboxDefaults.colors(checkedColor = T.accent, checkmarkColor = T.onAccent))
            })
        }
        Divider(); Row2(b.email.isNotEmpty(), "Correu", b.email.ifEmpty { "Falta" }) { Btn(if (b.email.isNotEmpty()) "Canvia" else "Afegeix", toClient, look = Look.Ghost) }
        Divider(); Row2(b.phone.isNotEmpty(), "Telèfon", b.phone.ifEmpty { "Falta" }) { Btn(if (b.phone.isNotEmpty()) "Canvia" else "Afegeix", toClient, look = Look.Ghost) }
        Divider(); Docs(b)
        Divider(); Moment(b, "checkin", "Check-in", "${day(b.first)}, a partir de les ${rules?.checkin ?: "15:00"}")
        Divider(); Moment(b, "checkout", "Check-out", "${day(b.until)}, abans de les ${rules?.checkout ?: "11:00"}")
    }
    Memo(b)
}

@Composable
private fun Fact2(label: String, value: String, modifier: Modifier) = Panel(modifier) {
    Text(label, style = Type.xs, color = T.muted)
    Text(value, style = Type.lg, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(top = 2.dp))
}

@Composable
private fun Moment(b: Booking, k: String, label: String, `when`: String) {
    val at = if (k == "checkin") b.checkin else b.checkout
    Row2(at.isNotEmpty(), label, if (at.isNotEmpty()) "Fet ${stamp(at)}" else "Previst ${`when`}") {
        if (at.isNotEmpty()) Btn("Desfés", { saveCheck(b, mapOf(k to false)) }, look = Look.Ghost)
        else Btn("Marca ${label.lowercase()}", { saveCheck(b, mapOf(k to true)) })
    }
}

@Composable
private fun Memo(b: Booking) {
    var v by remember(b.key, b.memo) { mutableStateOf(b.memo) }
    Field("Nota interna (només a Maite)", v, { v = it }, Modifier.padding(top = 16.dp), area = true, placeholder = "Claus, llit supletori, al·lèrgies…",
        onBlur = { if (v != b.memo) saveCheck(b, mapOf("memo" to v)) })
}

// ID documents: done only once photos or PDFs are uploaded to the booking's folder in Google Drive
@Composable
private fun Docs(b: Booking) {
    val context = LocalContext.current
    var left by remember { mutableStateOf(0) }
    val scope = rememberCoroutineScope()
    fun upload(uris: List<Uri>) {
        if (uris.isEmpty()) return
        scope.launch {
            var ok = 0
            uris.forEachIndexed { i, u ->
                left = uris.size - i
                try {
                    val (bytes, type, name) = withContext(Dispatchers.IO) { readDoc(context, u) }
                    val text = Api.raw("POST", "docs?stay=${b.stay}&id=${Uri.encode(b.id)}&name=${Uri.encode(name)}", bytes = bytes, type = type)
                    Maite.setBooking(json.decodeFromString(BookingResponse.serializer(), text).booking); ok++
                } catch (e: Exception) { Toasts.error(e) }
            }
            left = 0
            if (ok > 0) Toasts.done(if (ok == 1) "Document desat a Drive" else "$ok documents desats a Drive")
        }
    }
    val files = rememberLauncherForActivityResult(ActivityResultContracts.OpenMultipleDocuments()) { upload(it) }
    var shot by remember { mutableStateOf<Uri?>(null) }
    val camera = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { ok -> if (ok) shot?.let { upload(listOf(it)) } }
    Column {
        Row2(hasDocs(b), "Documents d'identitat", if (hasDocs(b)) "A Google Drive${if (b.ref.isNotEmpty()) ", reserva ${b.ref}" else ""}" else "Puja el DNI o passaport de tots els hostes adults.")
        Row(Modifier.fillMaxWidth().padding(start = 48.dp, end = 14.dp, bottom = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            if (left > 0) Row(verticalAlignment = Alignment.CenterVertically) { CircularProgressIndicator(Modifier.size(16.dp), color = T.accent, strokeWidth = 2.dp); Text("  Pujant${if (left > 1) " ($left)" else ""}", style = Type.sm) }
            else {
                Btn("Foto", { shot = newShot(context); camera.launch(shot!!) }, look = Look.Secondary, icon = R.drawable.ic_camera)
                Btn(if (b.docsFolder.isNotEmpty()) "Puja'n més" else "Puja", { files.launch(arrayOf("image/*", "application/pdf")) }, look = Look.Secondary, icon = R.drawable.ic_upload)
                if (b.docsFolder.isNotEmpty()) Btn("Carpeta", { open(context, b.docsFolder) }, look = Look.Ghost, icon = R.drawable.ic_folder_open)
            }
        }
    }
}

fun newShot(context: Context): Uri {
    val dir = File(context.cacheDir, "shots").apply { mkdirs() }
    return FileProvider.getUriForFile(context, "${context.packageName}.files", File(dir, "doc-${System.currentTimeMillis()}.jpg"))
}

/** Photos are made smaller first (longest side 2400 px, JPEG); PDFs go as they are */
fun readDoc(context: Context, uri: Uri): Triple<ByteArray, String, String> {
    val cr = context.contentResolver
    val type = cr.getType(uri) ?: "image/jpeg"
    var name = uri.lastPathSegment?.substringAfterLast('/')?.substringAfterLast(':') ?: "document"
    val raw = cr.openInputStream(uri)!!.use { it.readBytes() }
    if (!type.startsWith("image/")) return Triple(raw, type, name)
    val bmp = BitmapFactory.decodeByteArray(raw, 0, raw.size) ?: return Triple(raw, type, name)
    return Triple(jpeg(bmp, 2400, 88), "image/jpeg", name.substringBeforeLast('.') + ".jpg")
}

fun jpeg(bmp: Bitmap, max: Int, quality: Int): ByteArray {
    val k = minOf(1f, max / maxOf(bmp.width, bmp.height).toFloat())
    val out = if (k < 1f) Bitmap.createScaledBitmap(bmp, (bmp.width * k).toInt(), (bmp.height * k).toInt(), true) else bmp
    return ByteArrayOutputStream().also { out.compress(Bitmap.CompressFormat.JPEG, quality, it) }.toByteArray()
}

@Composable
private fun Fact(k: String, content: @Composable () -> Unit) {
    Column(Modifier.fillMaxWidth().padding(vertical = 12.dp)) {
        Text(k, style = Type.xs, color = T.muted)
        Box(Modifier.padding(top = 3.dp)) { content() }
    }
    Divider()
}

private val payments = mutableMapOf<String, Payment>()

@Composable
private fun PaymentInfo(b: Booking) {
    var p by remember(b.key) { mutableStateOf(payments[b.key]) }
    var err by remember(b.key) { mutableStateOf(false) }
    LaunchedEffect(b.key) {
        if (p == null) runCatching { Api.get<Payment>("payment?stay=${b.stay}&id=${Uri.encode(b.id)}") }
            .onSuccess { payments[b.key] = it; p = it }.onFailure { err = true }
    }
    val context = LocalContext.current
    when {
        err -> Text("No s'ha pogut consultar Stripe.", style = Type.sm, color = T.muted)
        p == null -> Row(verticalAlignment = Alignment.CenterVertically) { CircularProgressIndicator(Modifier.size(14.dp), strokeWidth = 2.dp, color = T.muted); Text("  Consultant Stripe…", style = Type.sm, color = T.muted) }
        else -> {
            val x = p!!; val m = x.method
            val what = if (m.type == "card") "${if (m.brand.isNotEmpty()) cap(m.brand) else "Targeta"}${if (m.last4.isNotEmpty()) " acabada en ${m.last4}" else ""}${if (m.wallet.isNotEmpty()) " amb ${WALLET[m.wallet] ?: m.wallet}" else ""}"
                else (PAYTYPE[m.type] ?: m.type.ifEmpty { "Mètode desconegut" }) + (if (m.last4.isNotEmpty()) " acabada en ${m.last4}" else "") + (if (m.bank.isNotEmpty()) ", ${m.bank}" else "")
            val whenTxt = when (x.status) { "succeeded" -> "cobrat ${stampMillis(x.created * 1000)}"; "processing" -> "en procés"; else -> x.status }
            Column {
                Text("$what, $whenTxt.${if (x.refunded > 0) " Retornats ${euro(x.refunded)}." else ""}", style = Type.sm, color = T.muted)
                if (x.receipt.isNotEmpty()) Text("Veure el rebut", style = Type.sm, color = T.accent, fontWeight = FontWeight.Medium, modifier = Modifier.padding(top = 4.dp).clickable { open(context, x.receipt) })
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun BookingTab(b: Booking) {
    val S = Maite.settings
    val pol = b.policy ?: S?.cancel
    val context = LocalContext.current
    Divider()
    Fact("Allotjament") { Text(Maite.stayName(b.stay), style = Type.sm) }
    Fact("Check-in") { Column { Text(cap(longDay(b.first)), style = Type.sm); Text("A partir de les ${S?.rules?.checkin ?: "15:00"}${if (b.arrival.isNotEmpty()) ". L'hoste diu: ${b.arrival}" else ""}", style = Type.xs, color = T.muted) } }
    Fact("Check-out") { Column { Text(cap(longDay(b.until)), style = Type.sm); Text("Abans de les ${S?.rules?.checkout ?: "11:00"}", style = Type.xs, color = T.muted) } }
    Fact("Estada") { Text("${nitsTxt(nightsBetween(b.first, b.until))}${b.guests?.let { ", " + persones(it) } ?: ""}", style = Type.sm) }
    Fact("Via") { Text(SOURCE[b.source] ?: b.source.ifEmpty { "–" }, style = Type.sm) }
    Fact("Import") { Column { Text(b.amount?.let(::euro) ?: "Sense import", style = Type.sm); if (b.refunded > 0) Text("Retornats ${euro(b.refunded)}", style = Type.xs, color = T.muted) } }
    Fact("Pagament") {
        if (b.kind == "manual") Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(b.settled, { saveCheck(b, mapOf("settled" to it)) }, colors = CheckboxDefaults.colors(checkedColor = T.accent, checkmarkColor = T.onAccent))
                Text("Cobrada", style = Type.sm)
            }
            Choice(null, b.method, METHOD.toList(), { saveCheck(b, mapOf("method" to it)) }, placeholder = "Com s'ha cobrat?")
        } else Column { Text(if (b.kind == "paid") "Pagada a la web" else "Pendent del banc", style = Type.sm); Spacer(Modifier.height(4.dp)); PaymentInfo(b) }
    }
    if (pol != null && b.kind != "manual") Fact("Cancel·lació") { Column { Text(policyText(pol), style = Type.sm); Text(if (b.policy != null) "La que va acceptar l'hoste." else "La política actual (aquesta reserva no en té cap de guardada).", style = Type.xs, color = T.muted) } }
    if (b.notes.isNotEmpty()) Fact("Comentaris") { Text(b.notes, style = Type.sm) }
    FlowRow(Modifier.padding(top = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        if (b.stripe.isNotEmpty()) Btn("Stripe", { open(context, b.stripe) }, look = Look.Secondary, icon = R.drawable.ic_credit_card)
        if (b.link.isNotEmpty()) Btn("Google Calendar", { open(context, b.link) }, look = Look.Secondary, icon = R.drawable.ic_calendar_days)
        if ((b.kind == "paid" || b.kind == "manual") && b.until >= TODAY) Btn("Cancel·la la reserva", { Ui.openCancel(b.key) }, look = Look.DangerSoft)
    }
}

@Composable
private fun Contact(b: Booking, k: String, label: String) {
    val context = LocalContext.current
    val now = if (k == "email") b.email else b.phone
    var v by remember(b.key, now) { mutableStateOf(now) }
    Column {
        Field(label, v, { v = it }, placeholder = "Falta", type = if (k == "email") KeyboardType.Email else KeyboardType.Phone, onBlur = { if (v != now) saveCheck(b, mapOf(k to v)) })
        Row(Modifier.padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            if (k == "email" && b.email.isNotEmpty()) Btn("Escriu", { open(context, "mailto:${b.email}") }, look = Look.Secondary, icon = R.drawable.ic_mail)
            if (k == "phone" && b.phone.isNotEmpty()) {
                Btn("Truca", { open(context, "tel:${b.phone.replace(" ", "")}") }, look = Look.Secondary, icon = R.drawable.ic_phone)
                Btn("WhatsApp", { open(context, "https://wa.me/${b.phone.filter(Char::isDigit)}") }, look = Look.Secondary, icon = R.drawable.ic_message_circle)
            }
        }
    }
}

@Composable
private fun ClientTab(b: Booking) {
    val wa = b.phone.filter(Char::isDigit)
    val history = Maite.all().filter { x -> x.key != b.key && isBooking(x) && ((b.email.isNotEmpty() && x.email.equals(b.email, true)) || (wa.length > 5 && x.phone.filter(Char::isDigit) == wa)) }
        .sortedByDescending { it.first }
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Contact(b, "email", "Correu")
        Contact(b, "phone", "Telèfon")
        Card(Modifier.fillMaxWidth()) { Docs(b) }
        Text("Altres estades", style = Type.base, fontWeight = FontWeight.SemiBold)
        if (history.isEmpty()) Text(if (b.email.isNotEmpty() || b.phone.isNotEmpty()) "Cap altra estada amb aquest correu o telèfon." else "Afegeix el correu o el telèfon per veure si ja ha estat a casa.", style = Type.sm, color = T.muted)
        else Card(Modifier.fillMaxWidth()) {
            history.forEachIndexed { i, x ->
                if (i > 0) Divider()
                Row(Modifier.fillMaxWidth().clickable { Ui.detail = x.key }.padding(horizontal = 14.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) { Text(range(x.first, x.until), style = Type.sm); Text(Maite.shortName(x.stay), style = Type.xs, color = T.muted) }
                    Text(euro(x.amount), style = Type.sm); Spacer(Modifier.width(8.dp)); Status(x)
                }
            }
        }
    }
}

/** Closed nights, cancelled bookings and entries made in Google Calendar */
@Composable
private fun OtherEntry(b: Booking) {
    val context = LocalContext.current
    var busy by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    Column(Modifier.padding(top = 16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        if (b.amount != null) Text("Import: ${euro(b.amount)}${if (b.refunded > 0) " (retornats ${euro(b.refunded)})" else ""}", style = Type.sm)
        if (b.kind == "other") Muted2("Aquesta entrada es va crear directament a Google Calendar. Es canvia des d'allà.")
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            if (b.stripe.isNotEmpty()) Btn("Stripe", { open(context, b.stripe) }, look = Look.Secondary, icon = R.drawable.ic_credit_card)
            if (b.link.isNotEmpty()) Btn("Google Calendar", { open(context, b.link) }, look = Look.Secondary, icon = R.drawable.ic_calendar_days)
        }
        if (b.kind == "block" && b.until >= TODAY) Btn("Obre aquestes nits", {
            busy = true
            scope.launch {
                try { Api.raw("POST", "cancel", Api.encode(mapOf("stay" to b.stay, "id" to b.id))); Ui.detail = null; Toasts.done("Nits obertes"); Maite.reload() }
                catch (e: ApiError) { Toasts.error(e); busy = false }
            }
        }, look = Look.DangerSoft, busy = busy)
    }
}

@Composable
private fun Muted2(t: String) = Text(t, style = Type.sm, color = T.muted)


