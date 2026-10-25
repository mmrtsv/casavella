package com.casavellarural.maite.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.casavellarural.maite.R
import com.casavellarural.maite.data.Api
import com.casavellarural.maite.data.ERRORS
import com.casavellarural.maite.data.ApiError
import com.casavellarural.maite.data.Maite
import com.casavellarural.maite.data.RestaurantSettings
import com.casavellarural.maite.data.SOURCE
import com.casavellarural.maite.data.SOURCES
import com.casavellarural.maite.data.Settings
import com.casavellarural.maite.data.TODAY
import com.casavellarural.maite.data.Table
import com.casavellarural.maite.data.TableResponse
import com.casavellarural.maite.data.TablesResponse
import com.casavellarural.maite.data.addDays
import com.casavellarural.maite.data.cap
import com.casavellarural.maite.data.day
import com.casavellarural.maite.data.euro
import com.casavellarural.maite.data.parse
import com.casavellarural.maite.data.monthTitle
import com.casavellarural.maite.data.json
import com.casavellarural.maite.data.longDay
import com.casavellarural.maite.ui.Btn
import com.casavellarural.maite.ui.Card
import com.casavellarural.maite.ui.CheckRow
import com.casavellarural.maite.ui.Choice
import com.casavellarural.maite.ui.Divider
import com.casavellarural.maite.ui.ErrorNote
import com.casavellarural.maite.ui.Field
import com.casavellarural.maite.ui.IconBtn
import com.casavellarural.maite.ui.Ico
import com.casavellarural.maite.ui.Look
import com.casavellarural.maite.ui.Muted
import com.casavellarural.maite.ui.Panel
import com.casavellarural.maite.ui.T
import com.casavellarural.maite.ui.Tabs
import com.casavellarural.maite.ui.Toasts
import com.casavellarural.maite.ui.Type
import kotlinx.coroutines.launch

// Restaurant: the tables booked for a day (web and phone), a new one, cancelling, and the openings (a day and a time each),
// seats and limits the web follows. Like maite-app/src/pages/Restaurant.tsx.

fun atOf(t: Table) = "${t.date}T${t.time}"
fun seated(list: List<Table>) = list.sumOf { it.people ?: 0 }
/** "2026-12-31T21:00" as "Dijous, 31 de desembre, 21:00" */
private fun atLabel(at: String) = "${cap(longDay(at.take(10)))}, ${at.drop(11)}"

@Composable
fun Restaurant() {
    val S = Maite.settings ?: return LoadingPage()
    var tab by remember { mutableStateOf("tables") }
    Page {
        Tabs(listOf("tables" to "Taules", "paid" to "Cobrat", "open" to "Dies oberts"), tab, { tab = it })
        when (tab) { "tables" -> Tables(S.restaurant); "paid" -> Paid(S.restaurant); else -> Openings(S.restaurant) }
    }
}

// ---------- Tables ----------
@Composable
private fun Tables(cfg: RestaurantSettings) {
    var date by remember { mutableStateOf(cfg.open.firstOrNull { it.take(10) >= TODAY }?.take(10) ?: TODAY) }
    var error by remember { mutableStateOf("") }
    var adding by remember { mutableStateOf(false) }
    var cancel by remember { mutableStateOf<Table?>(null) }
    // Loads a window around the day shown, once
    LaunchedEffect(date) {
        try { Maite.ensureTables(addDays(date, -7), addDays(date, 90)); error = "" } catch (e: ApiError) { error = e.message.orEmpty() }
    }
    val tables = Maite.tables; val configured = Maite.tablesConfigured
    val all = tables.values.sortedBy { atOf(it) }
    val ofDay = all.filter { it.date == date }; val live = ofDay.filter { !it.cancelled }
    val opens = cfg.open.filter { it.take(10) == date }
    val rest = live.filter { atOf(it) !in opens }
    val put = { t: Table -> Maite.setTable(t) }

    Card(Modifier.fillMaxWidth(), padding = PaddingValues(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconBtn(R.drawable.ic_chevron_left, "Dia anterior", { date = addDays(date, -1) })
            IconBtn(R.drawable.ic_chevron_right, "Dia següent", { date = addDays(date, 1) })
            Text(cap(longDay(date)), style = Type.lg, modifier = Modifier.weight(1f).padding(start = 4.dp))
        }
        Row(Modifier.padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Btn("Nova taula", { adding = true }, icon = R.drawable.ic_plus)
            if (date != TODAY) Btn("Avui", { date = TODAY }, look = Look.Secondary)
        }
        if (!configured) Panel(Modifier.fillMaxWidth().padding(top = 12.dp)) { Text("Falta connectar el calendari del restaurant (CAL_RESTAURANT). Fins llavors, la web remet al telèfon.", style = Type.sm) }
        ErrorNote(error)
        if (opens.isEmpty()) Muted("Aquest dia el restaurant no obre. Els dies s'obren a Dies oberts.", Modifier.padding(top = 14.dp))
        opens.forEach { at ->
            val list = live.filter { atOf(it) == at }
            Group(at.drop(11), "${seated(list)} de ${cfg.seats} places")
            if (list.isEmpty()) Muted("Cap taula.", Modifier.padding(vertical = 10.dp))
            list.forEach { t -> TableRow(t) { cancel = t } }
        }
        if (rest.isNotEmpty()) { Group(if (opens.isEmpty()) "Taules" else "A una altra hora", null); rest.forEach { t -> TableRow(t) { cancel = t } } }
        if (ofDay.any { it.cancelled }) { Group("Cancel·lades", null, muted = true); ofDay.filter { it.cancelled }.forEach { TableRow(it, null) } }
    }

    // The openings ahead and any other day that has tables, in order
    val upcoming = (cfg.open.filter { it.take(10) >= TODAY }.associate { it.take(10) to emptyList<Table>() } +
        all.filter { !it.cancelled && it.date >= TODAY }.groupBy { it.date }).toSortedMap()
    Card(Modifier.fillMaxWidth(), padding = PaddingValues(16.dp)) {
        Text("Pròxims dies", style = Type.base, fontWeight = FontWeight.SemiBold)
        if (upcoming.isEmpty()) Muted("Cap dia obert.", Modifier.padding(top = 6.dp))
        upcoming.forEach { (d, list) ->
            Row(
                Modifier.fillMaxWidth().padding(top = 4.dp).clip(RoundedCornerShape(12.dp)).background(if (d == date) T.accent.copy(alpha = 0.14f) else T.surface.copy(alpha = 0f))
                    .clickable { date = d }.padding(horizontal = 8.dp, vertical = 10.dp),
            ) {
                Text(cap(day(d)), style = Type.sm, modifier = Modifier.weight(1f))
                Text("${list.size} ${if (list.size == 1) "taula" else "taules"}", style = Type.sm, color = T.muted)
                Text(persones(seated(list)), style = Type.sm, modifier = Modifier.padding(start = 12.dp))
            }
        }
    }

    if (adding) NewTable(cfg, date, all, { adding = false }) { t -> put(t); date = t.date }
    cancel?.let { t -> CancelTable(t, { cancel = null }, put) }
}

@Composable
private fun Group(title: String, sub: String?, muted: Boolean = false) {
    Row(Modifier.padding(top = 18.dp, bottom = 6.dp), verticalAlignment = Alignment.Bottom) {
        Text(title, style = Type.base, fontWeight = FontWeight.SemiBold, color = if (muted) T.muted else T.foreground)
        if (sub != null) Text(sub, style = Type.sm, color = T.muted, modifier = Modifier.padding(start = 10.dp))
    }
    Divider()
}

@Composable
private fun TableRow(t: Table, onCancel: (() -> Unit)?) {
    val context = LocalContext.current
    Row(Modifier.fillMaxWidth().padding(vertical = 10.dp), verticalAlignment = Alignment.Top) {
        Text(t.time.ifEmpty { "Tot el dia" }, style = Type.sm, fontWeight = FontWeight.SemiBold, color = if (t.cancelled) T.muted else T.foreground, modifier = Modifier.width(56.dp))
        Column(Modifier.weight(1f)) {
            Text(t.name.ifEmpty { "Sense nom" } + (t.people?.let { " (${persones(it)})" } ?: ""), style = Type.sm, fontWeight = FontWeight.Medium, color = if (t.cancelled) T.muted else T.foreground)
            if (t.phone.isNotEmpty()) Row(Modifier.padding(top = 2.dp).clickable { open(context, "tel:" + t.phone.replace(" ", "")) }, verticalAlignment = Alignment.CenterVertically) {
                Ico(R.drawable.ic_phone, tint = T.muted, size = 13.dp); Spacer(Modifier.width(6.dp)); Text(t.phone, style = Type.sm, color = T.muted)
            }
            if (t.notes.isNotEmpty()) Text(t.notes, style = Type.sm, modifier = Modifier.padding(top = 2.dp))
            Text(SOURCE[t.source] ?: "Maite", style = Type.xs, color = T.muted, modifier = Modifier.padding(top = 2.dp))
            if (t.paid != null) Text("Ha pagat ${euro(t.paid)}", style = Type.xs, color = T.muted)
        }
        if (onCancel != null && t.source != "calendar") Btn("Cancel·la", onCancel, look = Look.Ghost)
    }
    Divider()
}

@Composable
private fun NewTable(cfg: RestaurantSettings, date0: String, tables: List<Table>, onClose: () -> Unit, onSaved: (Table) -> Unit) {
    var date by remember { mutableStateOf(date0) }; var time by remember { mutableStateOf(cfg.open.firstOrNull { it.take(10) == date0 }?.drop(11) ?: "21:00") }
    var people by remember { mutableStateOf("2") }; var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }; var email by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }; var source by remember { mutableStateOf("phone") }
    var err by remember { mutableStateOf("") }; var busy by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    // How full that opening already is, so the house can judge
    val at = "${date}T$time"
    val taken = seated(tables.filter { !it.cancelled && atOf(it) == at })
    FormSheet("Nova taula", null, onClose, {
        Btn("Cancel·la", onClose, look = Look.Ghost)
        Spacer(Modifier.width(8.dp))
        Btn("Desa la taula", {
            busy = true; err = ""
            scope.launch {
                try {
                    val d = Api.post<TableResponse>("restaurant", mapOf("date" to date, "time" to time, "people" to people, "name" to name, "phone" to phone,
                        "email" to email, "notes" to notes, "source" to source))
                    onSaved(d.table); onClose(); Toasts.done("Taula desada")
                } catch (e: ApiError) { err = e.message.orEmpty() }
                busy = false
            }
        }, busy = busy, small = false)
    }) {
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            DateField("Dia", date, { date = it }, Modifier.weight(1.4f))
            Field("Hora", time, { time = it }, Modifier.weight(1f), placeholder = "21:00")
        }
        Muted(if (at in cfg.open) "$taken de ${cfg.seats} places ocupades" else "No és cap dia obert")
        Field("Nom", name, { name = it })
        Field("Persones", people, { people = it }, type = KeyboardType.Number)
        Field("Telèfon", phone, { phone = it }, type = KeyboardType.Phone)
        Field("Correu", email, { email = it }, type = KeyboardType.Email)
        Choice("Via", source, SOURCES, { source = it })
        Field("Comentaris", notes, { notes = it }, area = true, placeholder = "Al·lèrgies, cadira per al nadó…")
        ErrorNote(err)
    }
}

@Composable
private fun CancelTable(t: Table, onClose: () -> Unit, onSaved: (Table) -> Unit) {
    var busy by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    FormSheet("Cancel·lar la taula", "${t.name}, ${day(t.date)} a les ${t.time}${t.people?.let { ", ${persones(it)}" } ?: ""}.", onClose, {
        Btn("No", onClose, look = Look.Ghost)
        Spacer(Modifier.width(8.dp))
        Btn("Cancel·la la taula", {
            busy = true
            scope.launch {
                try {
                    val d = json.decodeFromString(TableResponse.serializer(), Api.raw("PATCH", "restaurant", Api.encode(mapOf("id" to t.id, "cancelled" to true))))
                    onSaved(d.table); onClose(); Toasts.done("Taula cancel·lada")
                } catch (e: ApiError) { Toasts.error(e) }
                busy = false
            }
        }, look = Look.Danger, busy = busy, small = false)
    }) {
        Text("Queda al calendari com a cancel·lada i les places tornen a quedar lliures. L'hoste no rep cap correu: avisa'l si cal.", style = Type.sm)
    }
}

// ---------- What each table paid, by day ----------
private val WEEK = listOf("dl", "dt", "dc", "dj", "dv", "ds", "dg")
private fun total(list: List<Table>) = list.sumOf { it.paid ?: 0L }

@Composable
private fun Paid(cfg: RestaurantSettings) {
    var month by remember { mutableStateOf(TODAY.take(8) + "01") }
    val m = parse(month); val end = m.plusMonths(1).toString()
    var error by remember { mutableStateOf("") }
    LaunchedEffect(month) { try { Maite.ensureTables(month, end); error = "" } catch (e: ApiError) { error = e.message.orEmpty() } }
    val live = Maite.tables.values.filter { !it.cancelled && it.date >= month && it.date < end }
    fun byDay(d: String) = live.filter { it.date == d }.sortedBy { atOf(it) }
    var sel by remember { mutableStateOf(TODAY) }
    LaunchedEffect(month, live.size) { if (sel < month || sel >= end) sel = if (TODAY >= month && TODAY < end) TODAY else live.minOfOrNull { it.date } ?: month }
    val missing = live.count { it.paid == null && it.date <= TODAY }
    val days = (0 until m.lengthOfMonth()).map { addDays(month, it) }

    Card(Modifier.fillMaxWidth(), padding = PaddingValues(12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconBtn(R.drawable.ic_chevron_left, "Mes anterior", { month = m.minusMonths(1).toString() })
            IconBtn(R.drawable.ic_chevron_right, "Mes següent", { month = m.plusMonths(1).toString() })
            Text(monthTitle(month), style = Type.lg, modifier = Modifier.weight(1f).padding(start = 4.dp))
            Column(horizontalAlignment = Alignment.End) {
                Text("Cobrat al mes", style = Type.xs, color = T.muted)
                Text(euro(total(live)).ifEmpty { "0 €" }, style = Type.base, fontWeight = FontWeight.SemiBold)
            }
        }
        ErrorNote(error)
        if (missing > 0) Text(if (missing == 1) "1 taula ja servida no té import." else "$missing taules ja servides no tenen import.", style = Type.sm, color = T.warningText, modifier = Modifier.padding(top = 8.dp))
        Row(Modifier.padding(top = 8.dp)) { WEEK.forEach { Text(it, style = Type.xs, color = T.muted, modifier = Modifier.weight(1f), textAlign = androidx.compose.ui.text.style.TextAlign.Center) } }
        (List(m.dayOfWeek.value - 1) { null } + days).chunked(7).forEach { week ->
            Row(Modifier.padding(vertical = 2.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                (0 until 7).forEach { i ->
                    val d = week.getOrNull(i)
                    Box(Modifier.weight(1f)) {
                        if (d != null) {
                            val list = byDay(d); val open = cfg.open.any { it.take(10) == d }; val owed = list.any { it.paid == null } && d <= TODAY
                            Column(
                                Modifier.fillMaxWidth().height(54.dp).clip(RoundedCornerShape(10.dp))
                                    .background(when { d == sel -> T.accent.copy(alpha = 0.18f); list.isNotEmpty() || open -> T.default.copy(alpha = 0.7f); else -> T.surface.copy(alpha = 0f) })
                                    .clickable { sel = d }.padding(4.dp),
                                verticalArrangement = Arrangement.SpaceBetween,
                            ) {
                                Text("${parse(d).dayOfMonth}", style = Type.xs, color = if (d == TODAY) T.accent else T.muted, fontWeight = if (d == TODAY) FontWeight.Bold else FontWeight.Normal)
                                if (list.isNotEmpty() && (d <= TODAY || list.any { it.paid != null }))
                                    Text(euro(total(list)).ifEmpty { "0 €" }, style = Type.xs, fontWeight = FontWeight.SemiBold, color = if (owed) T.warningText else T.foreground, maxLines = 1)
                            }
                        }
                    }
                }
            }
        }
    }
    PaidDay(sel, byDay(sel))
}

/** The day's tables, each with what it paid; amounts in euros, saved one table at a time */
@Composable
private fun PaidDay(date: String, list: List<Table>) {
    var edit by remember(date) { mutableStateOf<Map<String, String>>(emptyMap()) }
    var busy by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    fun shown(t: Table) = t.paid?.let { (it / 100.0).let { v -> if (v == Math.floor(v)) v.toLong().toString() else v.toString() }.replace('.', ',') } ?: ""
    Card(Modifier.fillMaxWidth(), padding = PaddingValues(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(cap(longDay(date)), style = Type.base, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
            if (list.isNotEmpty()) Text(euro(total(list)).ifEmpty { "0 €" }, style = Type.base, fontWeight = FontWeight.SemiBold)
        }
        if (list.isEmpty()) Muted("Cap taula aquest dia.", Modifier.padding(top = 6.dp))
        list.forEach { t ->
            val value = edit[t.id] ?: shown(t); val dirty = edit[t.id] != null && value != shown(t)
            Divider()
            Row(Modifier.padding(vertical = 8.dp), verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Column(Modifier.weight(1f)) {
                    Text(t.name.ifEmpty { "Sense nom" }, style = Type.sm, fontWeight = FontWeight.Medium, maxLines = 1)
                    Text(t.time + (t.people?.let { ", ${persones(it)}" } ?: ""), style = Type.xs, color = T.muted)
                }
                Field("Ha pagat (€)", value, { v -> edit = edit + (t.id to v) }, Modifier.width(110.dp), type = KeyboardType.Decimal, placeholder = "0")
                Btn("Desa", {
                    val v = value.trim().replace(',', '.')
                    if (v.isNotEmpty() && (v.toDoubleOrNull() ?: -1.0) < 0) { Toasts.error("L'import no és vàlid"); return@Btn }
                    busy = t.id
                    scope.launch {
                        try {
                            val d = json.decodeFromString(TableResponse.serializer(), Api.raw("PATCH", "restaurant", Api.encode(mapOf("id" to t.id, "paid" to (if (v.isEmpty()) null else Math.round(v.toDouble() * 100))))))
                            Maite.setTable(d.table); edit = edit - t.id; Toasts.done("Import desat")
                        } catch (e: ApiError) { Toasts.error(e) }
                        busy = ""
                    }
                }, look = if (dirty) Look.Primary else Look.Secondary, enabled = dirty, busy = busy == t.id, small = false)
            }
        }
    }
}

// ---------- Openings, seats and limits ----------
@Composable
private fun Openings(cfg: RestaurantSettings) {
    var online by remember(cfg) { mutableStateOf(cfg.online) }
    var seats by remember(cfg) { mutableStateOf("${cfg.seats}") }
    var maxParty by remember(cfg) { mutableStateOf("${cfg.maxParty}") }; var minHours by remember(cfg) { mutableStateOf("${cfg.minHours}") }
    var open by remember(cfg) { mutableStateOf(cfg.open) }
    var day0 by remember { mutableStateOf(TODAY) }; var time by remember { mutableStateOf("21:00") }
    var busy by remember { mutableStateOf(false) }; var err by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    Card(Modifier.fillMaxWidth(), padding = PaddingValues(18.dp)) {
        Block("Dies oberts", "El restaurant només obre aquests dies, a aquesta hora. La web no ofereix res més.") {
            Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                DateField("Dia", day0, { day0 = it }, Modifier.weight(1.4f), min = TODAY)
                Field("Hora", time, { time = it }, Modifier.weight(1f), placeholder = "21:00")
            }
            Btn("Obre", {
                val at = "${day0}T$time"
                if (day0 >= TODAY && Regex("^([01]\\d|2[0-3]):[0-5]\\d$").matches(time) && at !in open) open = (open + at).sorted()
            }, Modifier.padding(top = 10.dp), look = Look.Secondary, icon = R.drawable.ic_plus)
            val ahead = open.filter { it.take(10) >= TODAY }
            if (ahead.isEmpty()) Muted("Cap dia obert. La web diu que el restaurant obre en dates concretes i dona el telèfon.", Modifier.padding(top = 12.dp))
            ahead.forEach { a ->
                Divider()
                Row(Modifier.fillMaxWidth().padding(vertical = 2.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(atLabel(a), style = Type.sm, modifier = Modifier.weight(1f))
                    IconBtn(R.drawable.ic_trash_2, "Tanca ${atLabel(a)}", { open = open - a })
                }
            }
        }
        Block("Places", "Les persones que caben cada dia obert, sumant totes les taules.") {
            Field("Places", seats, { seats = it }, type = KeyboardType.Number)
        }
        Block("A la web", "Només per a la web. Des de Maite es pot apuntar qualsevol taula, qualsevol dia.", last = true) {
            CheckRow(online, { online = it }, "Es pot reservar taula a la web")
            Field("Persones per taula, com a molt", maxParty, { maxParty = it }, Modifier.padding(top = 10.dp), type = KeyboardType.Number, help = "Els grups més grans truquen")
            Field("Hores d'antelació", minHours, { minHours = it }, Modifier.padding(top = 10.dp), type = KeyboardType.Number)
        }
        ErrorNote(err)
        Btn("Desa", {
            if ((maxParty.toIntOrNull() ?: 0) > (seats.toIntOrNull() ?: 0)) { err = ERRORS.getValue("max_party"); return@Btn }
            busy = true; err = ""
            scope.launch {
                try {
                    Maite.settings = Api.put<Settings>("settings", mapOf("restaurant" to mapOf(
                        "online" to online, "seats" to seats, "maxParty" to maxParty, "minHours" to minHours, "open" to open)))
                    Toasts.done("Dies oberts desats")
                } catch (e: ApiError) { err = e.message.orEmpty() }
                busy = false
            }
        }, Modifier.padding(top = 16.dp), busy = busy, full = true, small = false)
    }
}

@Composable
private fun Block(title: String, hint: String?, last: Boolean = false, content: @Composable () -> Unit) {
    Column(Modifier.padding(bottom = if (last) 0.dp else 18.dp)) {
        Text(title, style = Type.base, fontWeight = FontWeight.SemiBold)
        if (hint != null) Muted(hint, Modifier.padding(top = 2.dp))
        Spacer(Modifier.height(10.dp))
        content()
    }
    if (!last) { Divider(); Spacer(Modifier.height(18.dp)) }
}
