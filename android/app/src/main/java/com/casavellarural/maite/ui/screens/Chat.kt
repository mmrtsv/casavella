package com.casavellarural.maite.ui.screens

import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
import androidx.compose.ui.unit.dp
import com.casavellarural.maite.R
import com.casavellarural.maite.data.Api
import com.casavellarural.maite.data.ApiError
import com.casavellarural.maite.data.CA
import com.casavellarural.maite.data.DaysResponse
import com.casavellarural.maite.data.Maite
import com.casavellarural.maite.data.json
import com.casavellarural.maite.data.parse
import com.casavellarural.maite.ui.Btn
import com.casavellarural.maite.ui.Card
import com.casavellarural.maite.ui.Field
import com.casavellarural.maite.ui.IconBtn
import com.casavellarural.maite.ui.Look
import com.casavellarural.maite.ui.Muted
import com.casavellarural.maite.ui.Page as AppPage
import com.casavellarural.maite.ui.T
import com.casavellarural.maite.ui.Toasts
import com.casavellarural.maite.ui.Type
import com.casavellarural.maite.ui.Ui
import kotlinx.coroutines.launch
import kotlinx.serialization.encodeToString
import kotlinx.serialization.Serializable
import java.time.format.DateTimeFormatter

@Serializable private data class Proposal(val kind: String, val label: String, val why: String = "", val stays: List<String> = emptyList(), val dates: List<String> = emptyList(),
    val price: Double? = null, val min: Int? = null, val page: String? = null, val done: Boolean = false)
@Serializable private data class Msg(val role: String, val text: String, val proposals: List<Proposal> = emptyList())
@Serializable private data class Answer(val text: String, val proposals: List<Proposal> = emptyList())

private fun prefs(c: Context) = c.getSharedPreferences("maite-chat", Context.MODE_PRIVATE)
private fun read(c: Context): List<Msg> = runCatching { json.decodeFromString<List<Msg>>(prefs(c).getString("messages", "[]")!!) }.getOrDefault(emptyList())
private fun keep(c: Context, m: List<Msg>) = prefs(c).edit().putString("messages", json.encodeToString(m.takeLast(60))).apply()
private fun dm(s: String) = parse(s).format(DateTimeFormatter.ofPattern("d MMMM", CA))

/** Pregunta: a conversation with Claude about the house (/api/maite/chat, lib/chat.js), like the web. Each proposal has its
 *  button; a price or a minimum stay goes through /api/maite/days as in Preus. The conversation stays on this phone */
@Composable
fun Chat() {
    val context = LocalContext.current; val scope = rememberCoroutineScope()
    var msgs by remember { mutableStateOf(read(context)) }
    var text by remember { mutableStateOf("") }; var busy by remember { mutableStateOf(false) }
    fun set(m: List<Msg>) { msgs = m; keep(context, m) }
    fun send() {
        val q = text.trim(); if (q.isEmpty() || busy) return
        val before = msgs; val next = msgs + Msg("user", q)
        set(next); text = ""; busy = true
        scope.launch {
            try {
                val r = Api.post<Answer>("chat", mapOf("messages" to next.map { mapOf("role" to it.role, "text" to it.text) }))
                set(next + Msg("assistant", r.text, r.proposals))
            } catch (e: ApiError) { Toasts.error(e); set(before); text = q }
            busy = false
        }
    }
    suspend fun act(i: Int, j: Int) {
        val p = msgs[i].proposals[j]
        if (p.kind == "open") { AppPage.entries.find { it.name.equals(p.page, ignoreCase = true) }?.let { Ui.go(it) }; return }
        try {
            val r = Api.post<DaysResponse>("days", mapOf("stays" to p.stays, "dates" to p.dates) + (if (p.kind == "price") mapOf("price" to p.price) else mapOf("min" to p.min)))
            Maite.settings?.let { Maite.settings = it.copy(days = r.days) }; Toasts.done("Fet")
            set(msgs.mapIndexed { k, m -> if (k != i) m else m.copy(proposals = m.proposals.mapIndexed { l, x -> if (l == j) x.copy(done = true) else x }) })
        } catch (e: ApiError) { Toasts.error(e) }
    }
    Page {
        Card(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                if (msgs.isEmpty()) Muted("Pregunta el que vulguis de la casa: reserves, el restaurant, preus, Instagram o els números.")
                msgs.forEachIndexed { i, m ->
                    if (m.role == "user") Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterEnd) {
                        Text(m.text, style = Type.sm, modifier = Modifier.widthIn(max = 300.dp).clip(RoundedCornerShape(16.dp)).background(T.default).padding(horizontal = 14.dp, vertical = 10.dp))
                    } else Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(m.text, style = Type.sm)
                        m.proposals.forEachIndexed { j, p -> ProposalRow(p) { scope.launch { act(i, j) } } }
                    }
                }
                if (busy) Muted("Mirant-ho…")
            }
        }
        Card(Modifier.fillMaxWidth()) {
            Row(Modifier.padding(12.dp), verticalAlignment = Alignment.Bottom) {
                Field("Pregunta", text, { text = it }, Modifier.weight(1f), placeholder = "Com anem de reserves pel pont de desembre?", area = true)
                IconBtn(R.drawable.ic_send, "Envia", { send() }, enabled = text.isNotBlank(), busy = busy)
            }
        }
        if (msgs.isNotEmpty()) Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) { Btn("Comença de nou", { set(emptyList()) }, look = Look.Ghost, enabled = !busy) }
    }
}

@Composable
private fun ProposalRow(p: Proposal, onPress: () -> Unit) {
    val nights = when (p.dates.size) { 0 -> ""; 1 -> dm(p.dates[0]); else -> "${p.dates.size} nits, del ${dm(p.dates.first())} al ${dm(p.dates.last())}" }
    Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(T.default.copy(alpha = 0.6f)).padding(horizontal = 14.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text(p.label, style = Type.sm, fontWeight = FontWeight.Medium)
            if (p.why.isNotEmpty()) Text(p.why, style = Type.xs, color = T.muted)
            if (nights.isNotEmpty()) Text(nights, style = Type.xs, color = T.muted)
        }
        if (p.done) Text("Fet", style = Type.sm, color = T.accent)
        else Btn(if (p.kind == "open") "Obre-ho" else "Fes-ho", onPress, look = if (p.kind == "open") Look.Secondary else Look.Primary)
    }
}
