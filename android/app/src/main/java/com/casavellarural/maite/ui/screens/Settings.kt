package com.casavellarural.maite.ui.screens

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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.casavellarural.maite.R
import com.casavellarural.maite.data.Api
import com.casavellarural.maite.data.ApiError
import com.casavellarural.maite.data.DaysResponse
import com.casavellarural.maite.data.Maite
import com.casavellarural.maite.data.Policy
import com.casavellarural.maite.data.Settings
import com.casavellarural.maite.data.TODAY
import com.casavellarural.maite.data.addDays
import com.casavellarural.maite.data.cap
import com.casavellarural.maite.data.dayMonth
import com.casavellarural.maite.data.euro
import com.casavellarural.maite.data.euros
import com.casavellarural.maite.data.longDay
import com.casavellarural.maite.data.monthTitle
import com.casavellarural.maite.data.nightsBetween
import com.casavellarural.maite.data.nitsTxt
import com.casavellarural.maite.data.parse
import com.casavellarural.maite.data.plain
import com.casavellarural.maite.data.policyText
import com.casavellarural.maite.ui.Btn
import com.casavellarural.maite.ui.Card
import com.casavellarural.maite.ui.CheckRow
import com.casavellarural.maite.ui.Choice
import com.casavellarural.maite.ui.Divider
import com.casavellarural.maite.ui.ErrorNote
import com.casavellarural.maite.ui.Field
import com.casavellarural.maite.ui.IconBtn
import com.casavellarural.maite.ui.Look
import com.casavellarural.maite.ui.Muted
import com.casavellarural.maite.ui.Panel
import com.casavellarural.maite.ui.Segmented
import com.casavellarural.maite.ui.Tabs
import com.casavellarural.maite.ui.T
import com.casavellarural.maite.ui.Toasts
import com.casavellarural.maite.ui.Type
import com.casavellarural.maite.ui.pagePadding
import kotlinx.coroutines.launch
import java.time.LocalDate

@Composable
fun Page(content: @Composable () -> Unit) {
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(pagePadding()), verticalArrangement = Arrangement.spacedBy(16.dp)) { content() }
}

private fun nightOf(S: Settings, stay: String, d: String): Pair<Double, Boolean> {
    S.days[stay]?.get(d)?.price?.let { return it to true }
    val dow = parse(d).dayOfWeek.value; val st = S.stays.getValue(stay)
    return (if ((dow == 5 || dow == 6) && st.weekend != null) st.weekend else st.base) to false
}

private data class PSel(val a: String, val b: String? = null, val weekends: Boolean = false)

/** Preus: two tabs, the nights of each stay and the long-stay discounts */
@Composable
fun Prices() {
    val S = Maite.settings ?: return LoadingPage()
    var tab by remember { mutableStateOf("nights") }
    Page {
        Tabs(listOf("nights" to "Per nit", "discounts" to "Descomptes"), tab, { tab = it })
        if (tab == "nights") Nights(S) else Discounts(S)
    }
}

@OptIn(ExperimentalLayoutApi::class)
/** Per nit: a month per stay. Tap a day, or the first and last of a period, to give it a special price or a minimum stay */
@Composable
private fun Nights(S: Settings) {
    var stay by remember { mutableStateOf(Maite.stays.firstOrNull()?.id.orEmpty()) }
    var month by remember { mutableStateOf(TODAY.take(7) + "-01") }
    var sel by remember { mutableStateOf<PSel?>(null) }
    if (stay.isEmpty() || S.stays[stay] == null) return LoadingPage()
    val m = parse(month); val end = m.plusMonths(1).toString(); val lead = m.dayOfWeek.value - 1
    val days = (0 until nightsBetween(month, end)).map { addDays(month, it) }
    val dates = sel?.let { s ->
        val out = mutableListOf<String>(); var d = s.a
        while (d <= (s.b ?: s.a)) { if (!s.weekends || parse(d).dayOfWeek.value in 5..6) out += d; d = addDays(d, 1) }
        out
    } ?: emptyList()
    val booked = { d: String -> Maite.all().any { it.blocks && it.stay == stay && it.first <= d && it.until > d } }
    val scope = rememberCoroutineScope()

    Segmented(Maite.stays.map { it.id to it.short }, stay, { stay = it; sel = null })
    Card(Modifier.fillMaxWidth(), padding = PaddingValues(12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(monthTitle(month), style = Type.lg, modifier = Modifier.weight(1f))
            IconBtn(R.drawable.ic_chevron_left, "Mes anterior", { month = m.minusMonths(1).toString(); sel = null; scope.launch { runCatching { Maite.ensure(month, parse(month).plusMonths(1).toString()) } } }, enabled = month > TODAY.take(7) + "-01")
            IconBtn(R.drawable.ic_chevron_right, "Mes següent", { month = m.plusMonths(1).toString(); sel = null; scope.launch { runCatching { Maite.ensure(month, parse(month).plusMonths(1).toString()) } } })
        }
        Row { listOf("dl", "dt", "dc", "dj", "dv", "ds", "dg").forEach { Text(it, style = Type.xs, color = T.muted, modifier = Modifier.weight(1f).padding(vertical = 4.dp), textAlign = androidx.compose.ui.text.style.TextAlign.Center) } }
        val cells = List(lead) { null } + days
        cells.chunked(7).forEach { week ->
            Row(Modifier.padding(vertical = 2.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                (0 until 7).forEach { i ->
                    val d = week.getOrNull(i)
                    Box(Modifier.weight(1f)) {
                        if (d != null) {
                            val (price, special) = nightOf(S, stay, d); val min = S.days[stay]?.get(d)?.min
                            val past = d < TODAY; val on = d in dates; val bk = booked(d)
                            Column(
                                Modifier.fillMaxWidth().height(58.dp).clip(RoundedCornerShape(10.dp)).alpha(if (past) 0.35f else 1f)
                                    .background(when { on -> T.accent.copy(alpha = 0.22f); bk -> T.accent.copy(alpha = 0.12f); special -> T.cava.copy(alpha = 0.25f); else -> T.default.copy(alpha = 0.45f) })
                                    .then(if (on) Modifier.border(2.dp, T.accent, RoundedCornerShape(10.dp)) else if (bk) Modifier.border(1.dp, T.accent.copy(alpha = 0.4f), RoundedCornerShape(10.dp)) else Modifier)
                                    .clickable(enabled = !past) { val s = sel; sel = if (s != null && s.b == null && !s.weekends && d >= s.a) s.copy(b = d) else PSel(d) }
                                    .padding(5.dp),
                                verticalArrangement = Arrangement.SpaceBetween,
                            ) {
                                Row { Text("${parse(d).dayOfMonth}", style = Type.xs, fontWeight = if (d == TODAY) FontWeight.Bold else FontWeight.Normal, color = if (d == TODAY) T.accent else T.muted, modifier = Modifier.weight(1f))
                                    if (min != null) Text("${min}n", style = Type.xs, fontWeight = FontWeight.SemiBold) }
                                Text("${plain(price)} €", style = Type.xs.copy(fontWeight = if (special) FontWeight.SemiBold else FontWeight.Normal), maxLines = 1)
                            }
                        }
                    }
                }
            }
        }
        FlowRow(Modifier.padding(top = 10.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Btn("Caps de setmana", { sel = PSel(maxOf(month, TODAY), m.plusMonths(1).minusDays(1).toString(), weekends = true) }, look = Look.Secondary)
            Btn("Tot el mes", { sel = PSel(maxOf(month, TODAY), m.plusMonths(1).minusDays(1).toString()) }, look = Look.Secondary)
        }
    }
    if (sel != null && dates.isNotEmpty()) DaysPanel(S, stay, dates, sel!!.weekends) { sel = null } else NormalPanel(S, stay)
}

@Composable
private fun NormalPanel(S: Settings, stay: String) {
    val st = S.stays.getValue(stay)
    var base by remember(stay, st) { mutableStateOf(plain(st.base)) }
    var weekend by remember(stay, st) { mutableStateOf(st.weekend?.let(::plain) ?: "") }
    var busy by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    Card(Modifier.fillMaxWidth(), padding = PaddingValues(18.dp)) {
        Text("Preu normal", style = Type.lg); Muted(Maite.stayName(stay))
        Field("Preu per nit (€)", base, { base = it }, Modifier.padding(top = 14.dp), type = KeyboardType.Decimal)
        Field("Divendres i dissabte (€)", weekend, { weekend = it }, Modifier.padding(top = 12.dp), type = KeyboardType.Decimal, placeholder = "El mateix")
        Btn("Desa", {
            busy = true
            scope.launch {
                try { Maite.settings = Api.put<Settings>("settings", mapOf("stays" to mapOf(stay to mapOf("base" to base, "weekend" to weekend.ifEmpty { null })))); Toasts.done("Preu desat") }
                catch (e: ApiError) { Toasts.error(e) }
                busy = false
            }
        }, Modifier.padding(top = 14.dp), busy = busy, full = true, small = false)
        Muted("Toca un dia del calendari, o el primer i l'últim d'un període, per posar-hi un preu especial o una estada mínima.", Modifier.padding(top = 10.dp))
    }
}

@Composable
private fun DaysPanel(S: Settings, stay: String, dates: List<String>, weekends: Boolean, onDone: () -> Unit) {
    val specials = dates.map { S.days[stay]?.get(it)?.price }.toSet()
    val mins = dates.map { S.days[stay]?.get(it)?.min }.toSet()
    val prices = dates.map { nightOf(S, stay, it).first }.toSet()
    val price0 = if (specials.size == 1 && specials.first() != null) plain(specials.first()!!) else ""
    val min0 = if (mins.size == 1 && mins.first() != null) "${mins.first()}" else "normal"
    var price by remember(dates, stay) { mutableStateOf(price0) }
    var min by remember(dates, stay) { mutableStateOf(min0) }
    var also by remember(stay) { mutableStateOf(listOf<String>()) }
    var busy by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    val a = dates.first(); val z = dates.last()
    val title = if (weekends) "Divendres i dissabtes (${dates.size} nits)" else if (dates.size == 1) cap(longDay(a)) else "${dayMonth(a)} – ${dayMonth(z)} (${dates.size} dies)"
    val now = "${Maite.stayName(stay)}. Ara: ${if (prices.size == 1) euros(prices.first()) else "entre ${euros(prices.min())} i ${euros(prices.max())}"} la nit${if (mins.size == 1 && mins.first() != null) ", mínim ${nitsTxt(mins.first()!!)}" else ""}."
    fun send(body: Map<String, Any?>, kind: String, msg: String) {
        busy = kind
        scope.launch {
            try { val r = Api.post<DaysResponse>("days", mapOf("stays" to listOf(stay) + also, "dates" to dates) + body); Maite.settings = S.copy(days = r.days); Toasts.done(msg); onDone() }
            catch (e: ApiError) { Toasts.error(e) }
            busy = ""
        }
    }
    Card(Modifier.fillMaxWidth(), padding = PaddingValues(18.dp)) {
        Text(title, style = Type.lg); Muted(now)
        Field("Preu per nit (€)", price, { price = it }, Modifier.padding(top = 14.dp), type = KeyboardType.Decimal, placeholder = "Preu normal")
        Choice("Estada mínima si s'arriba aquests dies", min, listOf("normal" to "Normal (${nitsTxt(S.rules.minNights)})") + (1..14).map { "$it" to nitsTxt(it) }, { min = it }, Modifier.padding(top = 12.dp))
        Text("Aplica-ho també a", style = Type.xs, color = T.muted, modifier = Modifier.padding(top = 12.dp))
        Maite.stays.filter { it.id != stay }.forEach { s -> CheckRow(s.id in also, { v -> also = if (v) also + s.id else also - s.id }, s.name) }
        Row(Modifier.padding(top = 10.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Btn("Aplica", { send(mapOf("price" to price.ifEmpty { null }, "min" to if (min == "normal") null else min), "save", "Dies actualitzats") }, busy = busy == "save")
            Btn("Torna al normal", { send(mapOf("price" to null, "min" to null), "reset", "Dies tornats al preu normal") }, look = Look.Secondary, busy = busy == "reset")
            IconBtn(R.drawable.ic_x, "Desfés la selecció", onDone)
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
/** Descomptes: longer stays pay less; the highest discount that applies wins */
@Composable
private fun Discounts(S: Settings) {
    var tiers by remember(S.discounts) { mutableStateOf(S.discounts.map { "${it.nights}" to "${it.pct}" }) }
    var busy by remember { mutableStateOf(false) }; var err by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    val s = Maite.stays.firstOrNull(); val base = s?.let { S.stays[it.id]?.base } ?: 0.0
    fun pctFor(n: Int) = tiers.filter { n >= (it.first.toIntOrNull() ?: 999) }.maxOfOrNull { it.second.toIntOrNull() ?: 0 } ?: 0
    Card(Modifier.fillMaxWidth(), padding = PaddingValues(18.dp)) {
        Text("Descomptes per estada llarga", style = Type.lg)
        Muted("Com més nits, més descompte. S'aplica el més alt que toqui. A la web, els textos que en parlen s'actualitzen sols.", Modifier.padding(top = 4.dp, bottom = 14.dp))
        if (tiers.isEmpty()) Panel(Modifier.fillMaxWidth()) { Muted("Sense descomptes: totes les estades paguen el preu per nit.") }
        tiers.forEachIndexed { i, t ->
            Panel(Modifier.fillMaxWidth().padding(bottom = 8.dp)) {
                Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Field("A partir de (nits)", t.first, { v -> tiers = tiers.mapIndexed { j, x -> if (j == i) v to x.second else x } }, Modifier.weight(1f), type = KeyboardType.Number)
                    Field("Descompte (%)", t.second, { v -> tiers = tiers.mapIndexed { j, x -> if (j == i) x.first to v else x } }, Modifier.weight(1f), type = KeyboardType.Number)
                    IconBtn(R.drawable.ic_trash_2, "Treu aquest descompte", { tiers = tiers.filterIndexed { j, _ -> j != i } })
                }
            }
        }
        ErrorNote(err)
        FlowRow(Modifier.padding(top = 10.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Btn("Afegeix un descompte", { val last = tiers.lastOrNull(); tiers = tiers + ((last?.first?.toIntOrNull()?.plus(4) ?: 2).toString() to (last?.second?.toIntOrNull()?.plus(5)?.coerceAtMost(90) ?: 5).toString()) }, look = Look.Secondary, icon = R.drawable.ic_plus)
            Btn("Desa els descomptes", {
                busy = true; err = ""
                scope.launch {
                    try { Maite.settings = Api.put<Settings>("settings", mapOf("discounts" to tiers.map { mapOf("nights" to (it.first.toIntOrNull() ?: 0), "pct" to (it.second.toIntOrNull() ?: 0)) })); Toasts.done("Descomptes desats") }
                    catch (e: ApiError) { err = e.message.orEmpty() }
                    busy = false
                }
            }, busy = busy)
        }
    }
    if (s != null) Card(Modifier.fillMaxWidth(), padding = PaddingValues(18.dp)) {
        Text("Exemple", style = Type.xs, color = T.muted)
        Text("${s.name} a ${euros(base)} la nit", style = Type.base, fontWeight = FontWeight.SemiBold)
        listOf(1, 2, 3, 5, 7, 14).forEach { n ->
            val p = pctFor(n)
            Divider()
            Row(Modifier.padding(vertical = 10.dp)) {
                Text(nitsTxt(n), style = Type.sm, modifier = Modifier.weight(1f))
                if (p > 0) Text("−$p %   ", style = Type.sm, color = T.muted)
                Text(euro(Math.round(base * n * (100 - p))), style = Type.sm, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

private val PRESETS = listOf(
    "Flexible" to Policy(1, null, 0), "Moderada" to Policy(7, 2, 50), "Estricta" to Policy(30, 14, 50), "No reemborsable" to Policy(null, null, 0),
)
private fun same(a: Policy, b: Policy) = a.fullDays == b.fullDays && a.partialPct == b.partialPct && (a.partialPct == 0 || a.partialDays == b.partialDays)
private val ADVANCE = listOf("90" to "3 mesos abans", "180" to "6 mesos abans", "270" to "9 mesos abans", "365" to "1 any abans", "545" to "18 mesos abans", "730" to "2 anys abans")

/** Normes: minimum and maximum stay, how far ahead guests can book, times, and the cancellation policy */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun Rules() {
    val S = Maite.settings ?: return LoadingPage()
    val r = S.rules
    var minN by remember(r) { mutableStateOf("${r.minNights}") }; var maxN by remember(r) { mutableStateOf("${r.maxNights}") }
    var minA by remember(r) { mutableStateOf("${r.minAdvance}") }; var maxA by remember(r) { mutableStateOf("${r.maxAdvance}") }
    var cin by remember(r) { mutableStateOf(r.checkin) }; var cout by remember(r) { mutableStateOf(r.checkout) }
    var full by remember(S.cancel) { mutableStateOf(S.cancel.fullDays?.toString() ?: "") }
    var pct by remember(S.cancel) { mutableStateOf("${S.cancel.partialPct}") }
    var part by remember(S.cancel) { mutableStateOf(S.cancel.partialDays?.toString() ?: "") }
    var busy by remember { mutableStateOf(false) }; var err by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    val policy = Policy(full.toIntOrNull(), part.toIntOrNull(), pct.toIntOrNull() ?: 0)
    val advance = if (ADVANCE.any { it.first == maxA }) ADVANCE else ADVANCE + (maxA to "$maxA dies abans")
    fun choose(p: Policy) { full = p.fullDays?.toString() ?: ""; pct = "${p.partialPct}"; part = p.partialDays?.toString() ?: "" }
    Page {
        Card(Modifier.fillMaxWidth(), padding = PaddingValues(18.dp)) {
            Block("Estada", "El mínim es pot canviar per a dies concrets (agost, ponts…) des de Preus.") {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Field("Mínim de nits", minN, { minN = it }, Modifier.weight(1f), type = KeyboardType.Number)
                    Field("Màxim de nits", maxN, { maxN = it }, Modifier.weight(1f), type = KeyboardType.Number)
                }
            }
            Block("Antelació", "0 vol dir que es pot reservar el mateix dia. Per telèfon o des de Maite sempre es pot.") {
                Field("Com a mínim, dies abans", minA, { minA = it }, type = KeyboardType.Number)
                Choice("Com a molt", maxA, advance, { maxA = it }, Modifier.padding(top = 10.dp))
            }
            Block("Horari", null) {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Field("Check-in a partir de", cin, { cin = it }, Modifier.weight(1f), placeholder = "15:00")
                    Field("Check-out abans de", cout, { cout = it }, Modifier.weight(1f), placeholder = "11:00")
                }
            }
            Block("Política de cancel·lació", "Cada reserva de la web guarda la política que l'hoste va acceptar. En cancel·lar-la, Maite proposa el retorn segons aquella política.", last = true) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    (PRESETS.map { it.first to it.second as Policy? } + ("A mida" to null)).forEach { (name, p) ->
                        val on = if (p != null) same(p, policy) else PRESETS.none { same(it.second, policy) }
                        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(if (on) T.accent.copy(alpha = 0.14f) else T.default.copy(alpha = 0.45f))
                            .border(1.dp, if (on) T.accent else T.border, RoundedCornerShape(14.dp)).clickable { p?.let(::choose) }.padding(12.dp)) {
                            Text(name, style = Type.sm, fontWeight = FontWeight.SemiBold)
                            Text(if (p != null) policyText(p) else "Tria els dies i el percentatge a sota.", style = Type.xs, color = T.muted)
                        }
                    }
                }
                Row(Modifier.padding(top = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Field("Retorn complet fins a", full, { full = it }, Modifier.weight(1f), type = KeyboardType.Number, placeholder = "Mai", help = "Dies abans")
                    Field("Després (%)", pct, { pct = it }, Modifier.weight(1f), type = KeyboardType.Number)
                    Field("Fins a", part, { part = it }, Modifier.weight(1f), type = KeyboardType.Number, help = "Dies abans")
                }
                Panel(Modifier.fillMaxWidth().padding(top = 12.dp)) { Text("El que veu l'hoste", style = Type.xs, color = T.muted); Text(policyText(policy), style = Type.sm) }
            }
            ErrorNote(err)
            Btn("Desa les normes", {
                busy = true; err = ""
                scope.launch {
                    try {
                        Maite.settings = Api.put<Settings>("settings", mapOf(
                            "rules" to mapOf("minNights" to minN, "maxNights" to maxN, "minAdvance" to minA, "maxAdvance" to maxA, "checkin" to cin, "checkout" to cout),
                            "cancel" to mapOf("fullDays" to policy.fullDays, "partialDays" to policy.partialDays, "partialPct" to policy.partialPct)))
                        Toasts.done("Normes desades")
                    } catch (e: ApiError) { err = e.message.orEmpty() }
                    busy = false
                }
            }, Modifier.padding(top = 16.dp), busy = busy, full = true, small = false)
        }
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

