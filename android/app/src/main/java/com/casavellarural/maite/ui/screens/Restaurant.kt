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
import com.casavellarural.maite.data.ApiError
import com.casavellarural.maite.data.Maite
import com.casavellarural.maite.data.RestaurantSettings
import com.casavellarural.maite.data.SOURCE
import com.casavellarural.maite.data.SOURCES
import com.casavellarural.maite.data.Service
import com.casavellarural.maite.data.Settings
import com.casavellarural.maite.data.TODAY
import com.casavellarural.maite.data.Table
import com.casavellarural.maite.data.TableResponse
import com.casavellarural.maite.data.TablesResponse
import com.casavellarural.maite.data.addDays
import com.casavellarural.maite.data.cap
import com.casavellarural.maite.data.day
import com.casavellarural.maite.data.json
import com.casavellarural.maite.data.longDay
import com.casavellarural.maite.data.parse
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

// Restaurant: the tables booked for a day (web and phone), a new one, cancelling, and the services, seats and limits the web follows.
// Like maite-app/src/pages/Restaurant.tsx.

private val WEEK = listOf("dl", "dt", "dc", "dj", "dv", "ds", "dg")
private fun mins(t: String) = (t.take(2).toIntOrNull() ?: 0) * 60 + (t.drop(3).take(2).toIntOrNull() ?: 0)
private fun servicesOn(cfg: RestaurantSettings, d: String) = if (d in cfg.closed) emptyList() else cfg.services.filter { parse(d).dayOfWeek.value in it.days }
private fun inService(s: Service, t: Table) = if (t.service.isNotEmpty()) t.service == s.id else t.time.isNotEmpty() && mins(t.time) in mins(s.from)..mins(s.to)
private fun seated(list: List<Table>) = list.sumOf { it.people ?: 0 }

@Composable
fun Restaurant() {
    val S = Maite.settings ?: return LoadingPage()
    var tab by remember { mutableStateOf("tables") }
    Page {
        Tabs(listOf("tables" to "Taules", "hours" to "Horaris i places"), tab, { tab = it })
        if (tab == "tables") Tables(S.restaurant) else Hours(S.restaurant)
    }
}

// ---------- Tables ----------
@Composable
private fun Tables(cfg: RestaurantSettings) {
    var date by remember { mutableStateOf(TODAY) }
    var tables by remember { mutableStateOf<Map<String, Table>>(emptyMap()) }
    var loaded by remember { mutableStateOf<List<Pair<String, String>>>(emptyList()) }
    var configured by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf("") }
    var adding by remember { mutableStateOf(false) }
    var cancel by remember { mutableStateOf<Table?>(null) }
    // Loads a window around the day shown, once
    LaunchedEffect(date) {
        if (loaded.any { (a, b) -> a <= date && b > date }) return@LaunchedEffect
        val from = addDays(date, -7); val to = addDays(date, 60)
        loaded = loaded + (from to to)
        try {
            val d = Api.get<TablesResponse>("restaurant?from=$from&to=$to")
            configured = d.configured; tables = tables + d.tables.associateBy { it.id }; error = ""
        } catch (e: ApiError) { error = e.message.orEmpty(); loaded = loaded.filter { it.first != from } }
    }
    val all = tables.values.sortedBy { it.date + it.time }
    val ofDay = all.filter { it.date == date }; val live = ofDay.filter { !it.cancelled }
    val services = servicesOn(cfg, date)
    val rest = live.filter { t -> services.none { inService(it, t) } }
    val put = { t: Table -> tables = tables + (t.id to t) }

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
        if (services.isEmpty()) Muted(if (date in cfg.closed) "Aquest dia el restaurant és tancat." else "Aquest dia no hi ha cap servei.", Modifier.padding(top = 14.dp))
        services.forEach { s ->
            val list = live.filter { inService(s, it) }
            Group(s.name, "${seated(list)} de ${s.seats} places")
            if (list.isEmpty()) Muted("Cap taula.", Modifier.padding(vertical = 10.dp))
            list.forEach { t -> TableRow(t) { cancel = t } }
        }
        if (rest.isNotEmpty()) { Group("Fora d'horari", null); rest.forEach { t -> TableRow(t) { cancel = t } } }
        if (ofDay.any { it.cancelled }) { Group("Cancel·lades", null, muted = true); ofDay.filter { it.cancelled }.forEach { TableRow(it, null) } }
    }

    val upcoming = all.filter { !it.cancelled && it.date >= TODAY && it.date < addDays(TODAY, 30) }.groupBy { it.date }
    Card(Modifier.fillMaxWidth(), padding = PaddingValues(16.dp)) {
        Text("Pròxims dies", style = Type.base, fontWeight = FontWeight.SemiBold)
        if (upcoming.isEmpty()) Muted("Cap taula en els pròxims 30 dies.", Modifier.padding(top = 6.dp))
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
        }
        if (onCancel != null && t.source != "calendar") Btn("Cancel·la", onCancel, look = Look.Ghost)
    }
    Divider()
}

@Composable
private fun NewTable(cfg: RestaurantSettings, date0: String, tables: List<Table>, onClose: () -> Unit, onSaved: (Table) -> Unit) {
    var date by remember { mutableStateOf(date0) }; var time by remember { mutableStateOf(servicesOn(cfg, date0).firstOrNull()?.from ?: "13:00") }
    var people by remember { mutableStateOf("2") }; var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }; var email by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }; var source by remember { mutableStateOf("phone") }
    var err by remember { mutableStateOf("") }; var busy by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    // How full the service at that time already is, so the house can judge
    val s = servicesOn(cfg, date).find { time.length == 5 && mins(time) in mins(it.from)..mins(it.to) }
    val taken = s?.let { x -> seated(tables.filter { !it.cancelled && it.date == date && inService(x, it) }) } ?: 0
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
            Field("Hora", time, { time = it }, Modifier.weight(1f), placeholder = "13:30")
        }
        Muted(if (s != null) "${s.name}: $taken de ${s.seats} places ocupades" else "Fora dels horaris del restaurant")
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

// ---------- Hours and seats ----------
private data class SForm(val id: String, val name: String, val days: List<Int>, val from: String, val to: String, val seats: String)

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun Hours(cfg: RestaurantSettings) {
    var online by remember(cfg) { mutableStateOf(cfg.online) }
    var services by remember(cfg) { mutableStateOf(cfg.services.map { SForm(it.id, it.name, it.days, it.from, it.to, "${it.seats}") }) }
    var maxParty by remember(cfg) { mutableStateOf("${cfg.maxParty}") }; var minHours by remember(cfg) { mutableStateOf("${cfg.minHours}") }
    var maxDays by remember(cfg) { mutableStateOf("${cfg.maxDays}") }; var closed by remember(cfg) { mutableStateOf(cfg.closed) }
    var closeDay by remember { mutableStateOf(TODAY) }
    var busy by remember { mutableStateOf(false) }; var err by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    fun setS(i: Int, f: (SForm) -> SForm) { services = services.mapIndexed { j, s -> if (j == i) f(s) else s } }

    Card(Modifier.fillMaxWidth(), padding = PaddingValues(18.dp)) {
        Block("A la web", "Si no, el botó de reservar taula remet al telèfon i al WhatsApp.") {
            CheckRow(online, { online = it }, "Es pot reservar taula a la web")
        }
        Block("Serveis", "Les hores són la primera i l'última d'arribada, cada mitja hora. Les places compten per a tot el servei.") {
            if (services.isEmpty()) Panel(Modifier.fillMaxWidth()) { Muted("Sense serveis, la web no ofereix cap hora.") }
            services.forEachIndexed { i, s ->
                Panel(Modifier.fillMaxWidth().padding(bottom = 8.dp)) {
                    Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Field("Nom", s.name, { v -> setS(i) { it.copy(name = v) } }, Modifier.weight(1f))
                        Field("Places", s.seats, { v -> setS(i) { it.copy(seats = v) } }, Modifier.width(84.dp), type = KeyboardType.Number)
                        IconBtn(R.drawable.ic_trash_2, "Treu ${s.name.ifEmpty { "aquest servei" }}", { services = services.filterIndexed { j, _ -> j != i } })
                    }
                    Row(Modifier.padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Field("Primera hora", s.from, { v -> setS(i) { it.copy(from = v) } }, Modifier.weight(1f), placeholder = "13:00")
                        Field("Última hora", s.to, { v -> setS(i) { it.copy(to = v) } }, Modifier.weight(1f), placeholder = "15:00")
                    }
                    FlowRow(Modifier.padding(top = 10.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        WEEK.forEachIndexed { j, w ->
                            val on = (j + 1) in s.days
                            Box(
                                Modifier.size(38.dp).clip(CircleShape).background(if (on) T.accent else T.default)
                                    .clickable(role = Role.Checkbox) { setS(i) { it.copy(days = if (on) it.days - (j + 1) else (it.days + (j + 1)).sorted()) } },
                                contentAlignment = Alignment.Center,
                            ) { Text(w, style = Type.sm, fontWeight = FontWeight.Medium, color = if (on) T.onAccent else T.foreground) }
                        }
                    }
                }
            }
            if (services.size < 6) Btn("Afegeix un servei", { services = services + SForm("s" + System.currentTimeMillis().toString(36), "", listOf(6, 7), "13:00", "15:00", "20") },
                Modifier.padding(top = 4.dp), look = Look.Secondary, icon = R.drawable.ic_plus)
        }
        Block("Límits", "Només per a la web. Des de Maite es pot apuntar qualsevol taula.") {
            Field("Persones per taula, com a molt", maxParty, { maxParty = it }, type = KeyboardType.Number, help = "Els grups més grans truquen")
            Row(Modifier.padding(top = 10.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Field("Hores d'antelació", minHours, { minHours = it }, Modifier.weight(1f), type = KeyboardType.Number)
                Field("Dies endavant", maxDays, { maxDays = it }, Modifier.weight(1f), type = KeyboardType.Number)
            }
        }
        Block("Dies tancats", "Festius, vacances o un esdeveniment privat. Aquells dies la web no ofereix taula.", last = true) {
            Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                DateField("Dia", closeDay, { closeDay = it }, Modifier.weight(1f), min = TODAY)
                Btn("Tanca aquest dia", { if (closeDay >= TODAY && closeDay !in closed) closed = (closed + closeDay).sorted() }, look = Look.Secondary, icon = R.drawable.ic_plus, small = false)
            }
            closed.forEach { d ->
                Row(Modifier.fillMaxWidth().padding(top = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(cap(longDay(d)), style = Type.sm, modifier = Modifier.weight(1f))
                    IconBtn(R.drawable.ic_trash_2, "Obre ${day(d)}", { closed = closed - d })
                }
            }
        }
        ErrorNote(err)
        Btn("Desa els horaris", {
            busy = true; err = ""
            scope.launch {
                try {
                    Maite.settings = Api.put<Settings>("settings", mapOf("restaurant" to mapOf(
                        "online" to online, "maxParty" to maxParty, "minHours" to minHours, "maxDays" to maxDays, "closed" to closed,
                        "services" to services.map { mapOf("id" to it.id, "name" to it.name, "days" to it.days, "from" to it.from, "to" to it.to, "seats" to (it.seats.toIntOrNull() ?: 0)) })))
                    Toasts.done("Horaris desats")
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
