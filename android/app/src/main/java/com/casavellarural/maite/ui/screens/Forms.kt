package com.casavellarural.maite.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.DatePickerDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDatePickerState
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.casavellarural.maite.R
import com.casavellarural.maite.data.Api
import com.casavellarural.maite.data.ApiError
import com.casavellarural.maite.data.BookingResponse
import com.casavellarural.maite.data.CancelResponse
import com.casavellarural.maite.data.Maite
import com.casavellarural.maite.data.Quote
import com.casavellarural.maite.data.SOURCES
import com.casavellarural.maite.data.TODAY
import com.casavellarural.maite.data.addDays
import com.casavellarural.maite.data.cap
import com.casavellarural.maite.data.euro
import com.casavellarural.maite.data.plain
import com.casavellarural.maite.data.isBooking
import com.casavellarural.maite.data.longDay
import com.casavellarural.maite.data.nightsBetween
import com.casavellarural.maite.data.policyText
import com.casavellarural.maite.data.range
import com.casavellarural.maite.data.refundDue
import com.casavellarural.maite.data.who
import com.casavellarural.maite.ui.Btn
import com.casavellarural.maite.ui.CheckRow
import com.casavellarural.maite.ui.Choice
import com.casavellarural.maite.ui.ErrorNote
import com.casavellarural.maite.ui.Field
import com.casavellarural.maite.ui.Ico
import com.casavellarural.maite.ui.Look
import com.casavellarural.maite.ui.MenuRow
import com.casavellarural.maite.ui.Page
import com.casavellarural.maite.ui.Panel
import com.casavellarural.maite.ui.Sheet
import com.casavellarural.maite.ui.T
import com.casavellarural.maite.ui.Toasts
import com.casavellarural.maite.ui.Type
import com.casavellarural.maite.ui.Ui
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

/** A date field that opens the calendar picker; value is 'YYYY-MM-DD' */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DateField(label: String, value: String, onChange: (String) -> Unit, modifier: Modifier = Modifier, min: String? = null) {
    var open by remember { mutableStateOf(false) }
    Column(modifier) {
        Text(label, style = Type.sm, fontWeight = FontWeight.Medium, modifier = Modifier.padding(bottom = 6.dp))
        Row(
            Modifier.fillMaxWidth().heightIn(min = 48.dp).clip(RoundedCornerShape(12.dp)).background(T.field).border(1.dp, T.fieldBorder, RoundedCornerShape(12.dp))
                .clickable { open = true }.padding(horizontal = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(if (value.isEmpty()) "Tria un dia" else cap(longDay(value)), style = Type.base, color = if (value.isEmpty()) T.muted else T.foreground, modifier = Modifier.weight(1f))
            Ico(R.drawable.ic_calendar_days, tint = T.muted, size = 16.dp)
        }
    }
    if (open) {
        val ms = { s: String -> LocalDate.parse(s).atStartOfDay().toInstant(ZoneOffset.UTC).toEpochMilli() }
        val minMs = min?.let(ms)
        val state = rememberDatePickerState(initialSelectedDateMillis = value.takeIf { it.isNotEmpty() }?.let(ms),
            selectableDates = object : androidx.compose.material3.SelectableDates { override fun isSelectableDate(utcTimeMillis: Long) = minMs == null || utcTimeMillis >= minMs })
        DatePickerDialog(
            onDismissRequest = { open = false },
            confirmButton = { TextButton({ state.selectedDateMillis?.let { onChange(Instant.ofEpochMilli(it).atZone(ZoneOffset.UTC).toLocalDate().toString()) }; open = false }) { Text("D'acord", color = T.accent) } },
            dismissButton = { TextButton({ open = false }) { Text("Cancel·la", color = T.foreground) } },
            colors = DatePickerDefaults.colors(containerColor = T.overlay),
        ) { DatePicker(state, showModeToggle = false, colors = DatePickerDefaults.colors(containerColor = T.overlay, selectedDayContainerColor = T.accent, todayDateBorderColor = T.accent, todayContentColor = T.accent)) }
    }
}

@Composable
private fun FormSheet(title: String, sub: String?, onClose: () -> Unit, footer: @Composable () -> Unit, content: @Composable () -> Unit) {
    Sheet(onClose, full = true) {
        Column(Modifier.fillMaxWidth().imePadding().verticalScroll(rememberScrollState()).padding(horizontal = 20.dp).padding(bottom = 32.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Column { Text(title, style = Type.xl); if (sub != null) Text(sub, style = Type.sm, color = T.muted, modifier = Modifier.padding(top = 2.dp)) }
            content()
            Row(Modifier.fillMaxWidth().padding(top = 6.dp), horizontalArrangement = Arrangement.End, verticalAlignment = Alignment.CenterVertically) { footer() }
        }
    }
}

/** New booking taken by phone, WhatsApp or in person */
@Composable
fun NewBooking() {
    val draft = Ui.book ?: return
    val stays = Maite.stays
    val first0 = draft.first ?: TODAY
    var stay by remember { mutableStateOf(draft.stay ?: stays.firstOrNull()?.id.orEmpty()) }
    var first by remember { mutableStateOf(first0) }
    var until by remember { mutableStateOf(draft.until ?: addDays(first0, 1)) }
    var name by remember { mutableStateOf("") }; var guests by remember { mutableStateOf("2") }
    var phone by remember { mutableStateOf("") }; var email by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("") }; var source by remember { mutableStateOf("phone") }
    var arrival by remember { mutableStateOf("") }; var notes by remember { mutableStateOf("") }
    var settled by remember { mutableStateOf(false) }; var touched by remember { mutableStateOf(false) }
    var err by remember { mutableStateOf("") }; var busy by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val max = stays.find { it.id == stay }?.max ?: 2
    LaunchedEffect(max) { if ((guests.toIntOrNull() ?: 1) > max) guests = "$max" }
    // Suggests the web price for those nights (special prices and discounts included); it can be changed freely
    LaunchedEffect(stay, first, until) {
        if (stay.isEmpty() || until <= first || touched) return@LaunchedEffect
        runCatching { Api.get<Quote>("quote?stay=$stay&in=$first&out=$until") }.onSuccess { q -> if (!touched) amount = plain(q.total / 100.0) }
    }
    FormSheet("Nova reserva", "Telèfon, WhatsApp o en persona. Bloqueja les nits a la web.", { Ui.book = null }, {
        Btn("Cancel·la", { Ui.book = null }, look = Look.Ghost)
        Spacer(Modifier.width(8.dp))
        Btn("Desa la reserva", {
            busy = true; err = ""
            scope.launch {
                try {
                    val d = Api.post<BookingResponse>("bookings", mapOf("stay" to stay, "first" to first, "until" to until, "name" to name, "guests" to guests, "phone" to phone,
                        "email" to email, "amount" to amount, "source" to source, "arrival" to arrival, "notes" to notes, "settled" to settled))
                    Maite.setBooking(d.booking); Ui.book = null; Toasts.done("Reserva desada"); Maite.reload()
                } catch (e: ApiError) { err = e.message.orEmpty() }
                busy = false
            }
        }, busy = busy, small = false)
    }) {
        Choice("Allotjament", stay, stays.map { it.id to it.name }, { stay = it })
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            DateField("Check-in", first, { first = it; if (until <= it) until = addDays(it, 1) }, Modifier.weight(1f))
            DateField("Check-out", until, { until = it }, Modifier.weight(1f), min = addDays(first, 1))
        }
        Field("Nom", name, { name = it })
        Choice("Persones", guests, (1..max).map { "$it" to "$it" }, { guests = it })
        Field("Telèfon", phone, { phone = it }, type = KeyboardType.Phone)
        Field("Correu", email, { email = it }, type = KeyboardType.Email)
        Field("Import (€)", amount, { touched = true; amount = it }, type = KeyboardType.Decimal, help = "El preu de la web per a aquestes nits. Es pot canviar.")
        Choice("Via", source, SOURCES, { source = it })
        CheckRow(settled, { settled = it }, "Ja està cobrada")
        Field("Arribada prevista", arrival, { arrival = it }, placeholder = "Cap a les 18 h")
        Field("Comentaris", notes, { notes = it }, area = true)
        ErrorNote(err)
    }
}

/** Close dates on one or more stays; all or nothing */
@Composable
fun BlockDates() {
    val draft = Ui.block ?: return
    val stays = Maite.stays
    val a = draft.first ?: TODAY
    var pick by remember { mutableStateOf(draft.stays) }
    var first by remember { mutableStateOf(a) }; var until by remember { mutableStateOf(draft.until ?: addDays(a, 1)) }
    var note by remember { mutableStateOf("") }; var err by remember { mutableStateOf("") }; var busy by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    FormSheet("Tancar dates", "Si alguna nit ja està ocupada, no es tanca res.", { Ui.block = null }, {
        Btn("Cancel·la", { Ui.block = null }, look = Look.Ghost)
        Spacer(Modifier.width(8.dp))
        Btn("Tanca les nits", {
            err = ""
            when {
                pick.isEmpty() -> err = "Tria almenys un allotjament"
                note.isBlank() -> err = "Escriu el motiu"
                else -> { busy = true; scope.launch {
                    try { Api.raw("POST", "block", Api.encode(mapOf("stays" to pick, "first" to first, "until" to until, "note" to note))); Ui.block = null; Toasts.done("Nits tancades"); Maite.reload() }
                    catch (e: ApiError) { err = e.message.orEmpty() }
                    busy = false
                } }
            }
        }, busy = busy, small = false)
    }) {
        Column {
            stays.forEach { s -> CheckRow(s.id in pick, { v -> pick = if (v) pick + s.id else pick - s.id }, s.name) }
            CheckRow(stays.isNotEmpty() && pick.size == stays.size, { v -> pick = if (v) stays.map { it.id } else emptyList() }, "Tota la casa", bold = true)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            DateField("Primera nit", first, { first = it; if (until <= it) until = addDays(it, 1) }, Modifier.weight(1f))
            DateField("Fins al dia", until, { until = it }, Modifier.weight(1f), min = addDays(first, 1))
        }
        Field("Motiu", note, { note = it }, placeholder = "Obres, família, vacances…")
        ErrorNote(err)
    }
}

/** Cancel a booking, with the refund the policy says (web bookings) */
@Composable
fun CancelBooking() {
    val key = Ui.cancel ?: return
    val b = Maite.bookings[key] ?: run { Ui.cancel = null; return }
    val paid = b.kind == "paid"
    val pol = b.policy ?: Maite.settings?.cancel
    val before = nightsBetween(TODAY, b.first)
    val due = if (paid && pol != null && b.amount != null) refundDue(pol, b.amount, before) else null
    var refund by remember { mutableStateOf(due?.let { plain(it / 100.0) } ?: "") }
    var err by remember { mutableStateOf("") }; var busy by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    FormSheet("Cancel·lar la reserva", null, { Ui.cancel = null }, {
        Btn("No", { Ui.cancel = null }, look = Look.Ghost)
        Spacer(Modifier.width(8.dp))
        Btn("Cancel·la la reserva", {
            busy = true; err = ""
            scope.launch {
                try {
                    val cents = if (paid) Math.round((refund.replace(',', '.').toDoubleOrNull() ?: 0.0) * 100) else 0
                    val d = Api.post<CancelResponse>("cancel", mapOf("stay" to b.stay, "id" to b.id, "refund" to cents))
                    Ui.cancel = null; Toasts.done(if (d.refunded > 0) "Cancel·lada. Retornats ${euro(d.refunded)}." else "Reserva cancel·lada"); Maite.reload()
                } catch (e: ApiError) { err = e.message.orEmpty() }
                busy = false
            }
        }, look = Look.Danger, busy = busy, small = false)
    }) {
        Text("${b.name.ifEmpty { b.title }}, ${Maite.stayName(b.stay)}. Les nits del ${range(b.first, b.until)} quedaran lliures.", style = Type.sm)
        if (paid && pol != null) Panel(Modifier.fillMaxWidth()) {
            Text("${if (before <= 0) "Arriba avui o ja és aquí." else "Falten ${if (before == 1) "1 dia" else "$before dies"} per al check-in."} ${if (b.policy != null) "Política que va acceptar" else "Política actual"}: ${policyText(pol)}${due?.let { " Toca retornar ${euro(it)}." } ?: ""}", style = Type.sm, color = T.muted)
        }
        if (paid) Field("Retornar a la targeta (€)", refund, { refund = it }, type = KeyboardType.Decimal, help = "0 si no se li retorna res.")
        ErrorNote(err)
    }
}

/** Search: a section, an action, or a booking by guest, phone or email (the web's command palette) */
@Composable
fun SearchSheet() {
    var q by remember { mutableStateOf("") }
    Sheet({ Ui.search = false }, full = true) {
        Column(Modifier.fillMaxWidth().imePadding().padding(horizontal = 12.dp).padding(bottom = 24.dp)) {
            Field("Cerca", q, { q = it }, Modifier.padding(horizontal = 8.dp), placeholder = "Una secció, una acció o un hoste…")
            Spacer(Modifier.width(1.dp))
            Column(Modifier.verticalScroll(rememberScrollState()).padding(top = 8.dp)) {
                val t = q.trim().lowercase()
                Page.entries.filter { t.isEmpty() || (it.title + " " + it.hint).lowercase().contains(t) }.forEach { p -> MenuRow(p.icon, p.title, p.hint, false) { Ui.search = false; Ui.go(p) } }
                if (t.isEmpty() || "nova reserva".contains(t)) MenuRow(R.drawable.ic_calendar_plus, "Nova reserva", "Telèfon, WhatsApp o en persona", false) { Ui.search = false; Ui.book = com.casavellarural.maite.ui.BookDraft() }
                if (t.isEmpty() || "tancar dates".contains(t)) MenuRow(R.drawable.ic_lock, "Tancar dates", "Un allotjament o tota la casa", false) { Ui.search = false; Ui.block = com.casavellarural.maite.ui.BlockDraft() }
                val today = LocalDate.parse(TODAY)
                Maite.all().filter(::isBooking)
                    .filter { b -> t.isEmpty() || listOf(b.name, b.phone, b.email, Maite.shortName(b.stay)).joinToString(" ").lowercase().contains(t) }
                    .sortedBy { kotlin.math.abs(java.time.temporal.ChronoUnit.DAYS.between(today, LocalDate.parse(it.first))) }
                    .take(if (t.isEmpty()) 4 else 12)
                    .forEach { b -> MenuRow(R.drawable.ic_user, who(b), "${Maite.shortName(b.stay)}, ${range(b.first, b.until)}", false) { Ui.search = false; Ui.detail = b.key } }
            }
        }
    }
}
