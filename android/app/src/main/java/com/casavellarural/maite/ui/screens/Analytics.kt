package com.casavellarural.maite.ui.screens

import androidx.compose.foundation.layout.Arrangement
import com.casavellarural.maite.ui.Ico
import androidx.compose.ui.draw.rotate
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.casavellarural.maite.R
import com.casavellarural.maite.data.Api
import com.casavellarural.maite.data.ApiError
import com.casavellarural.maite.data.CA
import com.casavellarural.maite.data.TODAY
import com.casavellarural.maite.data.addDays
import com.casavellarural.maite.data.euro
import com.casavellarural.maite.data.parse
import com.casavellarural.maite.ui.Btn
import com.casavellarural.maite.ui.Card
import com.casavellarural.maite.ui.Divider
import com.casavellarural.maite.ui.Field
import com.casavellarural.maite.ui.Look
import com.casavellarural.maite.ui.Muted
import com.casavellarural.maite.ui.Segmented
import com.casavellarural.maite.ui.T
import com.casavellarural.maite.ui.Toasts
import com.casavellarural.maite.ui.Type
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import java.time.format.DateTimeFormatter

/** A line of the statement; lines opens it into the ones under it (an accommodation into its bookings, a category into its rows) */
@Serializable private data class PLine(val label: String, val cents: Long, val sub: String? = null, val auto: Boolean = false, val lines: List<PLine> = emptyList())
@Serializable private data class PMonth(val month: String, val label: String, val income: Long, val expenses: Long, val profit: Long)
@Serializable private data class PItem(val date: String, val concept: String = "", val category: String = "", val cents: Long)
@Serializable private data class PSheet(val connected: Boolean = false, val url: String = "", val error: String? = null, val share: String = "")
@Serializable private data class Pnl(val from: String, val to: String, val income: List<PLine>, val incomeTotal: Long, val expenses: List<PLine>, val expensesTotal: Long,
    val profit: Long, val margin: Int? = null, val months: List<PMonth>? = null, val items: List<PItem> = emptyList(), val unpaidTables: Int = 0, val sheet: PSheet = PSheet())

private val SPANS = listOf("week" to "Setmana passada", "month" to "Aquest mes", "last" to "Mes passat", "year" to "Aquest any", "custom" to "Dates")
private fun rangeOf(s: String): Pair<String, String> {
    val t = parse(TODAY)
    return when (s) {
        "week" -> { val mon = addDays(TODAY, -(t.dayOfWeek.value - 1)); addDays(mon, -7) to mon }
        "last" -> t.withDayOfMonth(1).minusMonths(1).toString() to t.withDayOfMonth(1).toString()
        "year" -> t.withDayOfYear(1).toString() to addDays(TODAY, 1)
        else -> t.withDayOfMonth(1).toString() to addDays(TODAY, 1)
    }
}
private val SHEET_ERRORS = mapOf(
    "no_sheet" to "Encara no hi ha cap full de despeses connectat.",
    "sheet_access" to "Maite no pot llegir el full: comparteix-lo amb el compte de sota (només lectura).",
    "sheet_columns" to "El full no té les columnes Data i Import a la primera pestanya.",
    "sheet" to "No s'ha pogut llegir el full. Torna-ho a provar més tard.",
)
private fun dm(s: String, year: Boolean = false) = parse(s).format(DateTimeFormatter.ofPattern(if (year) "d MMMM yyyy" else "d MMMM", CA))

/** Analítica: the P&L of a period (/api/maite/analytics, lib/pnl.js), like the web; the expenses sheet is linked here */
@Composable
fun Analytics() {
    var span by remember { mutableStateOf("month") }
    var data by remember { mutableStateOf<Pnl?>(null) }
    var n by remember { mutableIntStateOf(0) }
    // Dates: from and the last day, both included; the API takes the day after
    var ownFrom by remember { mutableStateOf(TODAY.take(8) + "01") }; var ownLast by remember { mutableStateOf(TODAY) }
    val (from, to) = if (span == "custom") ownFrom to (if (ownLast.isNotEmpty()) addDays(ownLast, 1) else "") else rangeOf(span)
    val ok = from.isNotEmpty() && to.isNotEmpty() && from < to
    LaunchedEffect(from, to, n) { if (!ok) return@LaunchedEffect; data = null; runCatching { Api.get<Pnl>("analytics?from=$from&to=$to") }.onSuccess { data = it }.onFailure { Toasts.error(it) } }
    Page {
        Row(Modifier.horizontalScroll(rememberScrollState())) { Segmented(SPANS, span, { span = it }) }
        if (span == "custom") {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                DateField("Des de", ownFrom, { ownFrom = it }, Modifier.weight(1f))
                DateField("Fins a", ownLast, { ownLast = it }, Modifier.weight(1f))
            }
            if (!ok) Text("El primer dia ha de ser abans de l'últim.", style = Type.sm, color = T.warning)
        }
        val p = data ?: return@Page Muted("Carregant…")
        Statement(p)
        p.months?.let { Months(it) }
        Sheet(p) { n++ }
    }
}

/** A line of the statement; with lines under it, it opens and closes. depth indents the ones under */
@Composable
private fun StatementLine(line: PLine, depth: Int = 0) {
    var open by remember { mutableStateOf(false) }; val can = line.lines.isNotEmpty()
    Row(Modifier.fillMaxWidth().clickable(enabled = can) { open = !open }.padding(start = (depth * 18).dp, top = 9.dp, bottom = 9.dp), verticalAlignment = Alignment.Top) {
        if (can) Ico(R.drawable.ic_chevron_right, tint = T.muted, size = 15.dp, modifier = Modifier.padding(top = 2.dp).rotate(if (open) 90f else 0f)) else Spacer(Modifier.width(15.dp))
        Spacer(Modifier.width(8.dp))
        Column(Modifier.weight(1f)) {
            Text(line.label, style = Type.sm)
            line.sub?.let { Text(it, style = Type.xs, color = T.muted) }
        }
        Text(euro(line.cents).ifEmpty { "0 €" }, style = Type.sm)
    }
    Divider()
    if (open) line.lines.forEach { StatementLine(it, depth + 1) }
}

@Composable
private fun Total(label: String, cents: Long) {
    Row(Modifier.fillMaxWidth().padding(start = 23.dp, top = 9.dp, bottom = 9.dp)) {
        Text(label, style = Type.sm, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
        Text(euro(cents).ifEmpty { "0 €" }, style = Type.sm, fontWeight = FontWeight.SemiBold)
    }
    Divider()
}

/** Month by month, when the period has more than one */
@Composable
private fun Months(list: List<PMonth>) {
    Card(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp)) {
            Text("Mes a mes", style = Type.base, fontWeight = FontWeight.SemiBold)
            list.forEach { m ->
                Column(Modifier.padding(vertical = 9.dp)) {
                    Row { Text(m.label, style = Type.sm, modifier = Modifier.weight(1f)); Text(euro(m.profit).ifEmpty { "0 €" }, style = Type.sm, fontWeight = FontWeight.SemiBold, color = if (m.profit < 0) T.danger else T.foreground) }
                    Text("${euro(m.income).ifEmpty { "0 €" }} d'ingressos, ${euro(m.expenses).ifEmpty { "0 €" }} de despeses", style = Type.xs, color = T.muted)
                }
                Divider()
            }
        }
    }
}

@Composable
private fun Statement(p: Pnl) {
    Card(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp)) {
            Text("Pèrdues i guanys", style = Type.base, fontWeight = FontWeight.SemiBold)
            Muted("${dm(p.from).replaceFirstChar { it.uppercase() }} a ${dm(addDays(p.to, -1), true)}")
            Spacer(Modifier.height(8.dp))
            p.income.forEach { StatementLine(it) }
            Total("Ingressos", p.incomeTotal)
            if (p.unpaidTables > 0) Text(if (p.unpaidTables == 1) "1 taula del període no té l'import apuntat a Cobrat." else "${p.unpaidTables} taules del període no tenen l'import apuntat a Cobrat.", style = Type.sm, color = T.warning, modifier = Modifier.padding(vertical = 8.dp))
            Spacer(Modifier.height(10.dp))
            p.expenses.forEach { StatementLine(it) }
            if (p.expenses.isEmpty()) { Muted("Cap despesa en aquest període.", Modifier.padding(vertical = 9.dp)); Divider() }
            Total("Despeses", p.expensesTotal)
            Text("Benefici brut", style = Type.sm, color = T.muted, modifier = Modifier.padding(top = 16.dp))
            Text(euro(p.profit).ifEmpty { "0 €" }, fontSize = 30.sp, fontWeight = FontWeight.SemiBold, color = if (p.profit < 0) T.danger else T.foreground)
            p.margin?.let { Muted("$it % dels ingressos") }
            if (!p.sheet.connected) Text("Sense el full de despeses, aquí només hi ha els anuncis.", style = Type.sm, color = T.warning, modifier = Modifier.padding(top = 6.dp))
        }
    }
}

@Composable
private fun Sheet(p: Pnl, onChange: () -> Unit) {
    var link by remember { mutableStateOf("") }; var busy by remember { mutableStateOf(false) }; var edit by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope(); val context = LocalContext.current
    fun save(sheet: String) {
        busy = true
        scope.launch {
            try { Api.put<kotlinx.serialization.json.JsonObject>("analytics", mapOf("sheet" to sheet)); Toasts.done(if (sheet.isEmpty()) "Full desconnectat" else "Full de despeses connectat"); edit = false; link = ""; onChange() }
            catch (e: ApiError) { Toasts.error(e) }
            busy = false
        }
    }
    Card(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Full de despeses", style = Type.base, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                if (p.sheet.url.isNotEmpty()) Btn("Obre el full", { open(context, p.sheet.url) }, look = Look.Ghost, icon = R.drawable.ic_external_link)
            }
            p.sheet.error?.let { Text(SHEET_ERRORS[it] ?: SHEET_ERRORS.getValue("sheet"), style = Type.sm, color = if (it == "no_sheet") T.muted else T.warning, modifier = Modifier.padding(top = 4.dp)) }
            if (p.sheet.url.isEmpty() || edit) {
                Text("La primera pestanya ha de tenir les columnes Data, Concepte, Categoria i Import. Comparteix el full amb ${p.sheet.share.ifEmpty { "el compte de servei de Maite" }} (només lectura).", style = Type.sm, modifier = Modifier.padding(vertical = 10.dp))
                Field("Enllaç del full", link, { link = it }, placeholder = "https://docs.google.com/spreadsheets/d/…")
                Row(Modifier.fillMaxWidth().padding(top = 10.dp), horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End)) {
                    if (edit) Btn("Cancel·la", { edit = false }, look = Look.Ghost)
                    Btn("Connecta", { save(link.trim()) }, busy = busy, enabled = link.isNotBlank())
                }
            } else {
                if (p.sheet.connected) Muted("Cada categoria de despeses s'obre amb els seus apunts.", Modifier.padding(top = 4.dp))
                Row(Modifier.fillMaxWidth().padding(top = 10.dp), horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End)) {
                    Btn("Desconnecta", { save("") }, look = Look.Ghost, busy = busy)
                    Btn("Canvia el full", { edit = true }, look = Look.Secondary)
                }
            }
        }
    }
}
