package com.casavellarural.maite.ui.screens

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import com.casavellarural.maite.R
import com.casavellarural.maite.data.Booking
import com.casavellarural.maite.data.Maite
import com.casavellarural.maite.data.TODAY
import com.casavellarural.maite.data.addDays
import com.casavellarural.maite.data.atHome
import com.casavellarural.maite.data.day
import com.casavellarural.maite.data.dueList
import com.casavellarural.maite.data.euro
import com.casavellarural.maite.data.isBooking
import com.casavellarural.maite.data.longDay
import com.casavellarural.maite.data.missing
import com.casavellarural.maite.data.nightsBetween
import com.casavellarural.maite.data.parse
import com.casavellarural.maite.data.range
import com.casavellarural.maite.data.weekdayShort
import com.casavellarural.maite.data.who
import com.casavellarural.maite.ui.Btn
import com.casavellarural.maite.ui.Card
import com.casavellarural.maite.ui.Divider
import com.casavellarural.maite.ui.Ico
import com.casavellarural.maite.ui.Kpi
import com.casavellarural.maite.ui.LocalLayout
import com.casavellarural.maite.ui.Look
import com.casavellarural.maite.ui.Page
import com.casavellarural.maite.ui.Progress
import com.casavellarural.maite.ui.SectionTitle
import com.casavellarural.maite.ui.Status
import com.casavellarural.maite.ui.T
import com.casavellarural.maite.ui.Type
import com.casavellarural.maite.ui.Ui
import com.casavellarural.maite.ui.pagePadding

/** Inici: a greeting that says what happens today, four numbers, what is still to do, this week, and who is here or coming next */
@Composable
fun Home() {
    val all = remember(Maite.bookings) { Maite.all().filter(::isBooking).sortedBy { it.first } }
    if (!Maite.ready) return LoadingPage()
    val stays = Maite.stays
    val arrive = all.filter { it.first == TODAY }; val leave = all.filter { it.until == TODAY }
    val here = all.filter { it.first <= TODAY && it.until > TODAY }
    val next = all.firstOrNull { it.first > TODAY }
    val in30 = addDays(TODAY, 30)
    val occ = Math.round(all.sumOf { maxOf(0, nightsBetween(maxOf(it.first, TODAY), minOf(it.until, in30))) } / (30.0 * maxOf(1, stays.size)) * 100).toInt()
    val due = all.filter { it.kind == "manual" && !it.settled && it.until >= TODAY }.sumOf { it.amount ?: 0 }
    val h = java.time.LocalTime.now().hour
    val hello = if (h < 6 || h >= 21) "Bona nit" else if (h < 14) "Bon dia" else "Bona tarda"
    val l = LocalLayout.current

    LazyColumn(Modifier.fillMaxSize(), contentPadding = pagePadding(), verticalArrangement = Arrangement.spacedBy(20.dp)) {
        item { Errors() }
        item {
            Card(Modifier.fillMaxWidth()) {
                Box {
                    val glow = T.accent.copy(alpha = 0.16f)
                    Canvas(Modifier.matchParentSize()) { drawRect(Brush.radialGradient(listOf(glow, Color.Transparent), center = Offset.Zero, radius = size.maxDimension)) }
                    Column(Modifier.padding(if (l.rail) 18.dp else 22.dp)) {
                        Rise(0) { Text("$hello, Maite", style = if (l.rail) Type.xl else Type.xxl) }
                        Spacer(Modifier.height(if (l.rail) 14.dp else 28.dp))
                        Rise(250) { Text(say(arrive, leave, next), style = Type.base, color = T.muted) }
                    }
                }
            }
        }
        item {
            Rise(400) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Kpi("Arribades avui", "${arrive.size}", Modifier.weight(1f), hint = arrive.joinToString(", ") { Maite.shortName(it.stay) }.ifEmpty { "Cap" })
                        Kpi("A casa aquesta nit", "${here.map { it.stay }.toSet().size} de ${stays.size}", Modifier.weight(1f), hint = "allotjaments ocupats")
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Kpi("Ocupació 30 dies", "$occ %", Modifier.weight(1f)) {
                            Box(Modifier.padding(top = 10.dp).fillMaxWidth().height(6.dp).clip(CircleShape).background(T.border)) {
                                Box(Modifier.fillMaxWidth(minOf(1f, occ / 100f)).height(6.dp).clip(CircleShape).background(T.accent))
                            }
                        }
                        Kpi("Pendent de cobrar", euro(due).ifEmpty { "0 €" }, Modifier.weight(1f), hint = "reserves fetes a mà")
                    }
                }
            }
        }
        item { Rise(500) { Todo(all) } }
        item { Rise(580) { Week() } }
        item { Rise(660) { Upcoming(all) } }
    }
}

private fun say(arrive: List<Booking>, leave: List<Booking>, next: Booking?): androidx.compose.ui.text.AnnotatedString = buildAnnotatedString {
    fun names(list: List<Booking>, withStay: Boolean) = list.forEachIndexed { i, b ->
        if (i > 0) append(if (i == list.size - 1) " i " else ", ")
        withStyle(SpanStyle(fontWeight = FontWeight.SemiBold)) { append(who(b)) }
        if (withStay) append(" a ${Maite.shortName(b.stay)}")
    }
    if (arrive.isNotEmpty()) { append(if (arrive.size == 1) "Avui arriba " else "Avui arriben "); names(arrive, true); append(". ") } else append("Avui no arriba ningú. ")
    if (leave.isNotEmpty()) { append(if (leave.size == 1) "Marxa " else "Marxen "); names(leave, false); append(". ") }
    if (arrive.isEmpty() && next != null) { append("El proper check-in és el de "); withStyle(SpanStyle(fontWeight = FontWeight.SemiBold)) { append(who(next)) }; append(", ${longDay(next.first)}.") }
}

/** Content rises in once, a little after what comes before it (the web's home-up) */
@Composable
fun Rise(delay: Int, content: @Composable () -> Unit) {
    val a = remember { Animatable(if (risen) 1f else 0f) }
    LaunchedEffect(Unit) { if (a.value < 1f) a.animateTo(1f, tween(600, delay)); risen = true }
    Box(Modifier.alpha(a.value).offset(y = ((1 - a.value) * 14).dp)) { content() }
}
private var risen = false

@Composable
fun LoadingPage() = Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { com.casavellarural.maite.ui.Loading() }

@Composable
fun Errors() {
    val msg = Maite.error.ifEmpty { Maite.notice }
    if (msg.isEmpty()) return
    val bad = Maite.error.isNotEmpty()
    Row(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background((if (bad) T.danger else T.warning).copy(alpha = 0.12f)).padding(14.dp),
        verticalAlignment = Alignment.Top,
    ) {
        Ico(R.drawable.ic_triangle_alert, tint = if (bad) T.danger else T.warningText)
        Spacer(Modifier.width(10.dp))
        Text(msg, style = Type.sm, color = if (bad) T.danger else T.foreground, modifier = Modifier.weight(1f))
        if (bad) Text("Torna-hi", style = Type.sm, fontWeight = FontWeight.SemiBold, color = T.accent, modifier = Modifier.clickable { Maite.refresh() })
    }
}

private data class Group(val title: String, val color: @Composable () -> Color, val has: (String) -> Boolean)
private val TODO = listOf(
    Group("per cobrar", { T.danger }) { it == "pay" },
    Group("sense documents", { T.warning }) { it == "docs" },
    Group("sense correu o telèfon", { T.cava }) { it == "email" || it == "phone" },
    Group("sense el check-in fet", { T.accent }) { it == "checkin" },
    Group("sense el check-out fet", { T.accent }) { it == "checkout" },
)

@Composable
private fun Todo(all: List<Booking>) {
    val soon = all.filter { it.until >= TODAY && it.first < addDays(TODAY, 30) }
    val groups = TODO.map { g -> g to soon.filter { b -> missing(b).any { g.has(it.k) } } }.filter { it.second.isNotEmpty() }
    val open = soon.count { missing(it).isNotEmpty() }
    val pct = if (soon.isEmpty()) 1f else (soon.size - open) / soon.size.toFloat()
    Column {
        SectionTitle("Per fer") { Btn("Reserves", { Ui.go(Page.Bookings) }, look = Look.Ghost) }
        Card(Modifier.fillMaxWidth()) {
            Row(Modifier.fillMaxWidth().clickable(enabled = open > 0) { Ui.openBookings("todo") }.background(if (open > 0) T.accent.copy(alpha = 0.07f) else Color.Transparent).padding(18.dp), verticalAlignment = Alignment.CenterVertically) {
                Ring(pct)
                Spacer(Modifier.width(16.dp))
                if (open == 0) Column {
                    Text("Tot al dia", style = Type.lg)
                    Text(if (soon.isNotEmpty()) "No falta res per a les reserves dels propers 30 dies." else "No hi ha reserves els propers 30 dies.", style = Type.sm, color = T.muted)
                } else Column {
                    Text("$open", style = Type.xxl)
                    Text(if (open == 1) "reserva amb coses pendents" else "reserves amb coses pendents", style = Type.sm, color = T.muted)
                    Text("Veure-les", style = Type.xs, fontWeight = FontWeight.Medium, color = T.accent, modifier = Modifier.padding(top = 2.dp))
                }
            }
            groups.forEach { (g, list) ->
                Divider()
                Row(Modifier.fillMaxWidth().clickable { Ui.detail = list.first().key }.padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.width(4.dp).height(34.dp).clip(CircleShape).background(g.color()))
                    Text("${list.size}", style = Type.lg, modifier = Modifier.padding(horizontal = 14.dp).width(28.dp))
                    Column(Modifier.weight(1f)) {
                        Text("${if (list.size == 1) "Reserva" else "Reserves"} ${g.title}", style = Type.sm, fontWeight = FontWeight.Medium)
                        Text("${if (list.size == 1) "" else "La més propera: "}${who(list.first())}, ${day(list.first().first)}", style = Type.xs, color = T.muted, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                    Ico(R.drawable.ic_chevron_right, tint = T.muted, size = 16.dp)
                }
            }
        }
    }
}

@Composable
private fun Ring(pct: Float) {
    val track = T.border; val fill = T.accent
    Canvas(Modifier.size(64.dp)) {
        val s = Stroke(width = 6.dp.toPx(), cap = StrokeCap.Round)
        drawArc(track, 0f, 360f, false, style = s)
        if (pct > 0) drawArc(fill, -90f, 360f * pct, false, style = s)
    }
}

/** The next seven nights for every stay; tap a stay to open its file */
@Composable
private fun Week() {
    val days = (0 until 7).map { addDays(TODAY, it) }; val end = addDays(TODAY, 7)
    val rows = Maite.all().filter { it.blocks && it.first < end && it.until > TODAY }
    val col = 64.dp; val names = 92.dp
    Column {
        SectionTitle("Aquesta setmana") { Btn("Calendari", { Ui.go(Page.Calendar) }, look = Look.Ghost) }
        Card(Modifier.fillMaxWidth()) {
            Column(Modifier.horizontalScroll(rememberScrollState())) {
                Row {
                    Spacer(Modifier.width(names))
                    days.forEach { d -> DayHead(d, col) }
                }
                Divider()
                Maite.stays.forEachIndexed { i, s ->
                    if (i > 0) Box(Modifier.width(names + col * 7).height(1.dp).background(T.separator))
                    Box(Modifier.height(52.dp)) {
                        Row { Text(Maite.shortName(s.id), style = Type.sm, fontWeight = FontWeight.SemiBold, modifier = Modifier.width(names).padding(start = 14.dp).align(Alignment.CenterVertically), maxLines = 1, overflow = TextOverflow.Ellipsis)
                            days.forEach { Box(Modifier.width(col).height(52.dp).background(T.separator.copy(alpha = 0f))) } }
                        rows.filter { it.stay == s.id }.forEach { b ->
                            val a = maxOf(0, nightsBetween(TODAY, b.first)); val z = minOf(7, nightsBetween(TODAY, b.until))
                            BookingBar(b, Modifier.offset(x = names + col * a + 3.dp, y = 8.dp).width(col * (z - a) - 6.dp).height(36.dp), compact = true)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun DayHead(d: String, col: androidx.compose.ui.unit.Dp) {
    Column(Modifier.width(col).padding(vertical = 8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Text(weekdayShort(d), style = Type.xs, color = T.muted)
        Box(Modifier.padding(top = 3.dp).size(26.dp).clip(CircleShape).background(if (d == TODAY) T.accent else Color.Transparent), contentAlignment = Alignment.Center) {
            Text("${parse(d).dayOfMonth}", style = Type.sm, fontWeight = FontWeight.SemiBold, color = if (d == TODAY) T.onAccent else T.foreground)
        }
    }
}

@Composable
fun BookingBar(b: Booking, modifier: Modifier, compact: Boolean = false) {
    val k = toneKey(b)
    Column(
        modifier.clip(RoundedCornerShape(12.dp)).background(barFill(k)).clickable { Ui.detail = b.key }.padding(start = 10.dp, end = 6.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(7.dp).clip(CircleShape).background(barDot(k)))
            Spacer(Modifier.width(6.dp))
            Text(who(b), style = Type.sm, fontWeight = FontWeight.SemiBold, color = barText(k), maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        if (!compact && b.kind != "block" && b.kind != "other" && (b.guests != null || b.amount != null)) {
            Row(Modifier.padding(start = 13.dp, top = 1.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                b.guests?.let { Ico(R.drawable.ic_users, tint = T.muted, size = 12.dp); Text("$it", style = Type.xs, color = T.muted) }
                b.amount?.let { Text(euro(it), style = Type.xs, color = T.muted, maxLines = 1) }
            }
        }
    }
}

/** Who is staying now and who comes next */
@Composable
private fun Upcoming(all: List<Booking>) {
    val rows = all.filter { it.until >= TODAY }.take(6)
    Column {
        SectionTitle("Ara i properes") { Btn("Totes", { Ui.go(Page.Bookings) }, look = Look.Ghost) }
        Card(Modifier.fillMaxWidth()) {
            if (rows.isEmpty()) Text("No hi ha cap reserva a la vista.", style = Type.sm, color = T.muted, modifier = Modifier.padding(28.dp).fillMaxWidth())
            rows.forEachIndexed { i, b ->
                if (i > 0) Divider()
                val list = dueList(b)
                Row(Modifier.fillMaxWidth().clickable { Ui.detail = b.key }.padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(who(b), style = Type.sm, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Text("${Maite.shortName(b.stay)}, ${if (atHome(b)) "a casa fins ${day(b.until)}" else range(b.first, b.until)}", style = Type.xs, color = T.muted, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Row(Modifier.padding(top = 6.dp), verticalAlignment = Alignment.CenterVertically) { Status(b); Spacer(Modifier.width(10.dp)); Progress(list.count { it.ok }, list.size, width = 40.dp) }
                    }
                }
            }
        }
    }
}

