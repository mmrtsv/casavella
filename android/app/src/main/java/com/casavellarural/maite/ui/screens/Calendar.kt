package com.casavellarural.maite.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.casavellarural.maite.R
import com.casavellarural.maite.data.Maite
import com.casavellarural.maite.data.TODAY
import com.casavellarural.maite.data.addDays
import com.casavellarural.maite.data.dayMonth
import com.casavellarural.maite.data.longDay
import com.casavellarural.maite.data.nightsBetween
import com.casavellarural.maite.data.nitsTxt
import com.casavellarural.maite.data.parse
import com.casavellarural.maite.data.range
import com.casavellarural.maite.ui.BlockDraft
import com.casavellarural.maite.ui.BookDraft
import com.casavellarural.maite.ui.Btn
import com.casavellarural.maite.ui.Card
import com.casavellarural.maite.ui.IconBtn
import com.casavellarural.maite.ui.LocalLayout
import com.casavellarural.maite.ui.Look
import com.casavellarural.maite.ui.T
import com.casavellarural.maite.ui.Toasts
import com.casavellarural.maite.ui.Type
import com.casavellarural.maite.ui.Ui

@Composable
fun CalendarActions() {
    IconBtn(R.drawable.ic_lock, "Tancar dates", { Ui.block = BlockDraft() })
    IconBtn(R.drawable.ic_calendar_plus, "Nova reserva", { Ui.book = BookDraft() }, tint = T.accent)
}

private data class Sel(val stay: String, val a: String, val b: String? = null)

/** Calendar: one row per stay, one column per night. Tap the first night and then the last to close dates or add a booking */
@Composable
fun CalendarScreen() {
    if (!Maite.ready) return LoadingPage()
    val l = LocalLayout.current
    var from by remember { mutableStateOf(addDays(TODAY, -2)) }
    var sel by remember { mutableStateOf<Sel?>(null) }
    var busy by remember { mutableStateOf(false) }
    BoxWithConstraints(Modifier.fillMaxSize()) {
        val names: Dp = if (l.compact) 88.dp else 120.dp
        val col: Dp = if (l.compact) 54.dp else 70.dp
        val fit = ((maxWidth - names - 24.dp) / col).toInt()
        val span = if (l.compact) 21 else fit.coerceIn(7, 28)
        val step = maxOf(7, minOf(span, fit) - 2)
        val to = addDays(from, span); val last = addDays(to, -1)
        val days = remember(from, span) { (0 until span).map { addDays(from, it) } }
        val bookings = Maite.all().filter { it.blocks && it.first < to && it.until > from }
        fun busyNight(stay: String, d: String) = bookings.any { it.stay == stay && it.first <= d && it.until > d }
        LaunchedEffect(from, span) { busy = true; runCatching { Maite.ensure(from, to) }.onFailure { Toasts.error(it) }; busy = false }
        fun move(next: String) { from = next; sel = null }
        fun pick(stay: String, d: String) {
            val s = sel
            if (s == null || s.stay != stay || s.b != null || d < s.a) { sel = Sel(stay, d); return }
            var b = s.a // stop at the first taken night
            while (b < d && !busyNight(stay, addDays(b, 1))) b = addDays(b, 1)
            sel = s.copy(b = b)
        }
        val rowH = if (l.rail) 64.dp else 76.dp

        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(start = if (l.rail) 8.dp else 16.dp, end = if (l.rail) 12.dp else 16.dp, bottom = if (l.rail) 90.dp else 190.dp)) {
            Row(Modifier.fillMaxWidth().padding(vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                val sameYear = from.take(4) == last.take(4)
                Text("${dayMonth(from)}${if (sameYear) "" else " " + from.take(4)} – ${dayMonth(last)} ${last.take(4)}", style = Type.lg, modifier = Modifier.weight(1f), maxLines = 1)
                Row(Modifier.clip(CircleShape).background(T.default.copy(alpha = 0.7f)).padding(2.dp), verticalAlignment = Alignment.CenterVertically) {
                    IconBtn(R.drawable.ic_chevron_left, "Enrere", { move(addDays(from, -step)) })
                    Text("Avui", style = Type.sm, fontWeight = FontWeight.Medium, modifier = Modifier.clip(CircleShape).clickable { move(addDays(TODAY, -2)) }.padding(horizontal = 10.dp, vertical = 8.dp))
                    IconBtn(R.drawable.ic_chevron_right, "Endavant", { move(addDays(from, step)) })
                }
            }
            Card(Modifier.fillMaxWidth().padding(top = 6.dp).alpha(if (busy) 0.6f else 1f)) {
                Row {
                    // Stay names stay in place; the nights scroll sideways
                    Column(Modifier.width(names).background(T.surface)) {
                        Box(Modifier.height(58.dp))
                        Maite.stays.forEach { s ->
                            Box(Modifier.height(rowH).fillMaxWidth().border(0.5.dp, T.separator).padding(start = 12.dp), contentAlignment = Alignment.CenterStart) {
                                Text(s.short, style = Type.sm, fontWeight = FontWeight.SemiBold, maxLines = 2, overflow = TextOverflow.Ellipsis)
                            }
                        }
                    }
                    val scroll = rememberScrollState()
                    LaunchedEffect(from) { scroll.scrollTo(0) }
                    Column(Modifier.horizontalScroll(scroll)) {
                        Row { days.forEach { d -> Box(Modifier.background(if (weekend(d)) T.default.copy(alpha = 0.4f) else Color.Transparent)) { DayHead(d, col) } } }
                        Maite.stays.forEach { s ->
                            Box(Modifier.height(rowH)) {
                                Row {
                                    days.forEach { d ->
                                        val past = d < TODAY; val taken = busyNight(s.id, d)
                                        val on = sel?.let { it.stay == s.id && d >= it.a && d <= (it.b ?: it.a) } == true
                                        Box(
                                            Modifier.width(col).height(rowH).border(0.5.dp, T.separator)
                                                .background(when { on -> T.accent.copy(alpha = 0.25f); past -> T.foreground.copy(alpha = 0.04f); weekend(d) -> T.default.copy(alpha = 0.4f); else -> Color.Transparent })
                                                .then(if (!past && !taken) Modifier.clickable { pick(s.id, d) }.semantics { contentDescription = "${s.name}, ${longDay(d)}, lliure" } else Modifier),
                                        )
                                    }
                                }
                                bookings.filter { it.stay == s.id }.forEach { b ->
                                    val a = maxOf(0, nightsBetween(from, b.first)); val z = minOf(span, nightsBetween(from, b.until))
                                    BookingBar(b, Modifier.offset(x = col * a + 3.dp, y = 8.dp).width(col * (z - a) - 6.dp).height(rowH - 16.dp), compact = l.rail)
                                }
                            }
                        }
                    }
                }
            }
            Row(Modifier.padding(top = 14.dp).horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                Legend(T.accent, "Pagada"); Legend(T.warning, "Pendent de cobrar"); Legend(T.muted.copy(alpha = 0.6f), "Tancat"); Legend(T.cava, "Altres")
            }
            Text("Toca la primera nit i després l'última per tancar dates o afegir una reserva. Toca una reserva per veure'n la fitxa.", style = Type.xs, color = T.muted, modifier = Modifier.padding(top = 8.dp))
        }

        AnimatedVisibility(sel != null, Modifier.align(Alignment.BottomCenter)) {
            val s = sel ?: return@AnimatedVisibility
            val until = addDays(s.b ?: s.a, 1)
            Row(
                Modifier.navigationBarsPadding().padding(start = 12.dp, end = 12.dp, bottom = if (l.rail) 12.dp else 96.dp).fillMaxWidth()
                    .shadow(16.dp, RoundedCornerShape(18.dp)).clip(RoundedCornerShape(18.dp)).background(T.overlay).border(1.dp, T.border, RoundedCornerShape(18.dp))
                    .padding(start = 14.dp, end = 6.dp, top = 6.dp, bottom = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(Modifier.weight(1f)) {
                    Text(Maite.shortName(s.stay), style = Type.sm, fontWeight = FontWeight.SemiBold)
                    Text("${range(s.a, until)}, ${nitsTxt(nightsBetween(s.a, until))}", style = Type.xs, color = T.muted, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                IconBtn(R.drawable.ic_x, "Desfés la selecció", { sel = null })
                Btn("Tancar", { Ui.block = BlockDraft(listOf(s.stay), s.a, until) }, look = Look.Secondary)
                Spacer(Modifier.width(6.dp))
                Btn("Reserva", { Ui.book = BookDraft(s.stay, s.a, until); sel = null })
            }
        }
    }
}

private fun weekend(d: String) = parse(d).dayOfWeek.value >= 6

@Composable
private fun Legend(c: Color, t: String) = Row(verticalAlignment = Alignment.CenterVertically) {
    Box(Modifier.size(9.dp).clip(CircleShape).background(c)); Spacer(Modifier.width(6.dp)); Text(t, style = Type.xs, color = T.muted)
}
