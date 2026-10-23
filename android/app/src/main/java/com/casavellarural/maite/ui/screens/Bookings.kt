package com.casavellarural.maite.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.casavellarural.maite.data.Booking
import com.casavellarural.maite.data.Maite
import com.casavellarural.maite.data.TODAY
import com.casavellarural.maite.data.addDays
import com.casavellarural.maite.data.atHome
import com.casavellarural.maite.data.day
import com.casavellarural.maite.data.dueList
import com.casavellarural.maite.data.euro
import com.casavellarural.maite.data.isBooking
import com.casavellarural.maite.data.missing
import com.casavellarural.maite.data.nightsBetween
import com.casavellarural.maite.data.who
import com.casavellarural.maite.ui.Card
import com.casavellarural.maite.ui.Divider
import com.casavellarural.maite.ui.Field
import com.casavellarural.maite.ui.Kpi
import com.casavellarural.maite.ui.Progress
import com.casavellarural.maite.ui.Segmented
import com.casavellarural.maite.ui.Status
import com.casavellarural.maite.ui.T
import com.casavellarural.maite.ui.Type
import com.casavellarural.maite.ui.Ui
import com.casavellarural.maite.ui.pagePadding

private val FILTERS = listOf("today" to "Avui", "todo" to "Per fer", "next" to "Properes", "past" to "Passades", "cancelled" to "Cancel·lades", "block" to "Tancaments")

/** Reserves: the next 30 days at a glance, then every booking (tap one for its file) */
@Composable
fun Bookings() {
    if (!Maite.ready) return LoadingPage()
    var filter by remember { mutableStateOf(Ui.bookingsFilter.ifEmpty { "next" }.also { Ui.bookingsFilter = "" }) }
    var q by remember { mutableStateOf("") }
    val all = Maite.all()
    val in30 = addDays(TODAY, 30)
    val rows = remember(Maite.bookings, filter, q) {
        var r = all.filter { b ->
            when (filter) {
                "today" -> isBooking(b) && b.first <= TODAY && b.until >= TODAY
                "todo" -> isBooking(b) && b.until >= TODAY && b.first < in30 && missing(b).isNotEmpty()
                "next" -> (isBooking(b) || (b.kind == "other" && b.blocks)) && b.until >= TODAY
                "past" -> (isBooking(b) || (b.kind == "other" && b.blocks)) && b.until < TODAY
                "cancelled" -> b.kind == "cancelled" || b.kind == "refunded"
                else -> b.kind == "block" && b.until >= TODAY
            }
        }
        val t = q.trim().lowercase()
        if (t.isNotEmpty()) r = r.filter { listOf(it.name, it.phone, it.email, it.title, Maite.stayName(it.stay)).joinToString(" ").lowercase().contains(t) }
        if (filter == "past" || filter == "cancelled") r.sortedByDescending { it.first } else r.sortedBy { it.first }
    }
    val bk = all.filter(::isBooking)
    val nights = bk.sumOf { maxOf(0, nightsBetween(maxOf(it.first, TODAY), minOf(it.until, in30))) }
    val occ = Math.round(nights / (30.0 * maxOf(1, Maite.stays.size)) * 100)

    LazyColumn(Modifier.fillMaxSize(), contentPadding = pagePadding(), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item {
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                val w = Modifier.width(150.dp)
                Kpi("Arribades avui", "${bk.count { it.first == TODAY }}", w)
                Kpi("Arribades en 30 dies", "${bk.count { it.first >= TODAY && it.first < in30 }}", w)
                Kpi("Ocupació 30 dies", "$occ %", w)
                Kpi("Pendent de cobrar", euro(bk.filter { it.kind == "manual" && !it.settled && it.until >= TODAY }.sumOf { it.amount ?: 0 }).ifEmpty { "0 €" }, w)
                Kpi("Amb coses pendents", "${bk.count { it.until >= TODAY && it.first < in30 && missing(it).isNotEmpty() }}", w)
            }
        }
        item { Segmented(FILTERS, filter, { filter = it }) }
        item { Field("Cerca", q, { q = it }, placeholder = "Nom, telèfon o correu") }
        if (filter == "today") {
            val groups = listOf("Arriben avui" to rows.filter { it.first == TODAY }, "A casa" to rows.filter { it.first < TODAY && it.until > TODAY }, "Marxen avui" to rows.filter { it.until == TODAY })
            groups.forEach { (t, g) ->
                item {
                    Card(Modifier.fillMaxWidth()) {
                        Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp)) { Text(t, style = Type.sm, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f)); Text("${g.size}", style = Type.sm, color = T.muted) }
                        if (g.isEmpty()) Text("Ningú.", style = Type.sm, color = T.muted, modifier = Modifier.padding(start = 16.dp, bottom = 14.dp))
                        g.forEach { b -> Divider(); BookingRow(b) }
                    }
                }
            }
        } else {
            item {
                Card(Modifier.fillMaxWidth()) {
                    if (rows.isEmpty()) Text("No hi ha res aquí.", style = Type.sm, color = T.muted, modifier = Modifier.padding(28.dp).fillMaxWidth())
                    rows.forEachIndexed { i, b -> if (i > 0) Divider(); BookingRow(b) }
                }
            }
        }
    }
}

@Composable
fun BookingRow(b: Booking) {
    val todo = if (isBooking(b) && b.until >= addDays(TODAY, -3)) missing(b) else emptyList()
    Row(Modifier.fillMaxWidth().clickable { Ui.detail = b.key }.padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.Top) {
        Column(Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(who(b), style = Type.base, fontWeight = FontWeight.Medium, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f, fill = false))
                if (isBooking(b) && atHome(b)) Text("  A casa", style = Type.xs, fontWeight = FontWeight.Medium, color = T.accent)
            }
            Text("${Maite.shortName(b.stay)}, ${if (isBooking(b) && atHome(b)) "a casa fins ${day(b.until)}" else "${day(b.first)} – ${day(b.until)}"}", style = Type.sm, color = T.muted, maxLines = 1, overflow = TextOverflow.Ellipsis)
            if (todo.isNotEmpty()) Text("Falta: ${todo.joinToString(", ") { it.label.lowercase() }}", style = Type.xs, color = T.warningText, modifier = Modifier.padding(top = 2.dp))
        }
        Spacer(Modifier.width(10.dp))
        Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(6.dp)) {
            if (b.amount != null) Text(euro(b.amount), style = Type.sm, fontWeight = FontWeight.Medium)
            Status(b)
            if (isBooking(b)) { val l = dueList(b); Progress(l.count { it.ok }, l.size, width = 36.dp) }
        }
    }
    Spacer(Modifier.height(0.dp))
}
