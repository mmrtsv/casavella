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

private fun mins(t: String) = (t.take(2).toIntOrNull() ?: 0) * 60 + (t.drop(3).take(2).toIntOrNull() ?: 0)
// Closed unless that date is opened, as lib/restaurant.js
private fun servicesOn(cfg: RestaurantSettings, d: String) = cfg.services.filter { it.id in (cfg.open[d] ?: emptyList()) }
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
        if (services.isEmpty()) Muted("Aquest dia el restaurant no obre. Els dies s'obren a Horaris i places.", Modifier.padding(top = 14.dp))
        services.forEach { s ->
            val list = live.filter { inService(s, it) }
            Group(s.name, "${seated(list)} de ${s.seats} places")
            if (list.isEmpty()) Muted("Cap taula.", Modifier.padding(vertical = 10.dp))
            list.forEach { t -> TableRow(t) { cancel = t } }
        }
        if (rest.isNotEmpty()) { Group("Fora d'horari", null); rest.forEach { t -> TableRow(t) { cancel = t } } }
        if (ofDay.any { it.cancelled }) { Group("Cancel·lades", null, muted = true); ofDay.filter { it.cancelled }.forEach { TableRow(it, null) } }
    }

    // The open days ahead and any other day that has tables, in order
    val upcoming = (cfg.open.keys.filter { it >= TODAY }.associateWith { emptyList<Table>() } +
        all.filter { !it.cancelled && it.date >= TODAY && it.date < addDays(TODAY, 60) }.groupBy { it.date }).toSortedMap()
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

// ---------- Open days, services and limits ----------
private data class SForm(val id: String, val name: String, val from: String, val to: String, val seats: String)

/** Services as toggles, like the web's ToggleButtonGroup */
@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun ServicePicker(services: List<SForm>, on: List<String>, onChange: (List<String>) -> Unit) {
    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        services.forEach { s ->
            val sel = s.id in on
            Box(
                Modifier.clip(CircleShape).background(if (sel) T.accent else T.default)
                    .clickable(role = Role.Checkbox) { onChange(if (sel) on - s.id else on + s.id) }.padding(horizontal = 14.dp, vertical = 8.dp),
            ) { Text(s.name.ifEmpty { "Servei" }, style = Type.sm, fontWeight = FontWeight.Medium, color = if (sel) T.onAccent else T.foreground) }
        }
    }
}

@Composable
private fun Hours(cfg: RestaurantSettings) {
    var online by remember(cfg) { mutableStateOf(cfg.online) }
    var services by remember(cfg) { mutableStateOf(cfg.services.map { SForm(it.id, it.name, it.from, it.to, "${it.seats}") }) }
    var maxParty by remember(cfg) { mutableStateOf("${cfg.maxParty}") }; var minHours by remember(cfg) { mutableStateOf("${cfg.minHours}") }
    var open by remember(cfg) { mutableStateOf(cfg.open) }
    var first by remember { mutableStateOf(TODAY) }; var last by remember { mutableStateOf(TODAY) }
    var pick by remember(cfg) { mutableStateOf(cfg.services.map { it.id }) }
    var busy by remember { mutableStateOf(false) }; var err by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    fun setS(i: Int, f: (SForm) -> SForm) { services = services.mapIndexed { j, s -> if (j == i) f(s) else s } }
    fun setDay(d: String, ids: List<String>) { open = if (ids.isEmpty()) open - d else open + (d to ids) }

    Card(Modifier.fillMaxWidth(), padding = PaddingValues(18.dp)) {
        Block("Dies oberts", "El restaurant només obre els dies que hi ha aquí, amb els serveis de cada dia. La resta de dies, la web no ofereix taula.") {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                DateField("Des del", first, { first = it; if (last < it) last = it }, Modifier.weight(1f), min = TODAY)
                DateField("Fins al", last, { last = it }, Modifier.weight(1f), min = first)
            }
            Row(Modifier.padding(top = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.weight(1f)) { ServicePicker(services, pick) { pick = it } }
                // Opens every date from the first to the last with the services picked
                Btn("Obre", {
                    if (pick.isNotEmpty() && first >= TODAY && last >= first) {
                        var d = first; val next = open.toMutableMap()
                        while (d <= last) { next[d] = pick; d = addDays(d, 1) }
                        open = next
                    }
                }, look = Look.Secondary, icon = R.drawable.ic_plus, enabled = pick.isNotEmpty())
            }
            val days = open.keys.filter { it >= TODAY }.sorted()
            if (days.isEmpty()) Muted("Cap dia obert. La web diu que el restaurant obre en dates concretes i dona el telèfon.", Modifier.padding(top = 12.dp))
            days.forEach { d ->
                Divider()
                Column(Modifier.padding(vertical = 8.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(cap(longDay(d)), style = Type.sm, modifier = Modifier.weight(1f))
                        IconBtn(R.drawable.ic_trash_2, "Tanca ${day(d)}", { setDay(d, emptyList()) })
                    }
                    ServicePicker(services, open[d] ?: emptyList()) { setDay(d, it) }
                }
            }
        }
        Block("Serveis", "Les hores són la primera i l'última d'arribada, cada mitja hora. Les places compten per a tot el servei.") {
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
                }
            }
            if (services.size < 6) Btn("Afegeix un servei", { services = services + SForm("s" + System.currentTimeMillis().toString(36), "", "13:00", "15:00", "15") },
                Modifier.padding(top = 4.dp), look = Look.Secondary, icon = R.drawable.ic_plus)
        }
        Block("A la web", "Només per a la web. Des de Maite es pot apuntar qualsevol taula, qualsevol dia.", last = true) {
            CheckRow(online, { online = it }, "Es pot reservar taula a la web")
            Field("Persones per taula, com a molt", maxParty, { maxParty = it }, Modifier.padding(top = 10.dp), type = KeyboardType.Number, help = "Els grups més grans truquen")
            Field("Hores d'antelació", minHours, { minHours = it }, Modifier.padding(top = 10.dp), type = KeyboardType.Number)
        }
        ErrorNote(err)
        Btn("Desa els horaris", {
            busy = true; err = ""
            scope.launch {
                try {
                    Maite.settings = Api.put<Settings>("settings", mapOf("restaurant" to mapOf(
                        "online" to online, "maxParty" to maxParty, "minHours" to minHours, "open" to open,
                        "services" to services.map { mapOf("id" to it.id, "name" to it.name, "from" to it.from, "to" to it.to, "seats" to (it.seats.toIntOrNull() ?: 0)) })))
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
