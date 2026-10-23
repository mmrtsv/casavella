package com.casavellarural.maite.ui.screens

import android.annotation.SuppressLint
import android.webkit.WebView
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.casavellarural.maite.R
import com.casavellarural.maite.data.Api
import com.casavellarural.maite.data.Email
import com.casavellarural.maite.data.Emails as EmailList
import com.casavellarural.maite.ui.Card
import com.casavellarural.maite.ui.Ico
import com.casavellarural.maite.ui.Muted
import com.casavellarural.maite.ui.T
import com.casavellarural.maite.ui.Tabs
import com.casavellarural.maite.ui.Toasts
import com.casavellarural.maite.ui.Type

private val TO = mapOf("guest" to "A l'hoste", "house" to "A la Casa Vella")

/** Correus: the emails guests and the house receive, from the real templates with example data. Read only */
@Composable
fun Emails() {
    var list by remember { mutableStateOf<List<Email>?>(null) }
    var id by remember { mutableStateOf("") }
    var view by remember { mutableStateOf("html") }
    LaunchedEffect(Unit) { runCatching { Api.get<EmailList>("emails").emails }.onSuccess { list = it; id = it.firstOrNull()?.id.orEmpty() }.onFailure { Toasts.error(it) } }
    val all = list ?: return LoadingPage()
    val e = all.find { it.id == id } ?: all.firstOrNull() ?: return
    Page {
        Muted("Els correus que s'envien sols. Aquí només es poden llegir; el contingut és d'exemple, amb els horaris i la política d'ara.")
        Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            all.forEach { x ->
                val on = x.id == e.id
                Row(Modifier.width(220.dp).clip(RoundedCornerShape(16.dp)).background(if (on) T.accent.copy(alpha = 0.12f) else T.surface)
                    .border(1.dp, if (on) T.accent else T.border, RoundedCornerShape(16.dp)).clickable { id = x.id }.padding(12.dp)) {
                    Ico(if (x.audience == "guest") R.drawable.ic_user else R.drawable.ic_house, tint = if (on) T.accent else T.muted, size = 16.dp)
                    Spacer(Modifier.width(10.dp))
                    Column { Text(x.name, style = Type.sm, fontWeight = FontWeight.SemiBold, maxLines = 2); Text(TO[x.audience].orEmpty(), style = Type.xs, color = T.muted) }
                }
            }
        }
        Card(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(16.dp)) {
                Text(e.name, style = Type.lg)
                Muted(e.`when`)
                Row(Modifier.padding(top = 8.dp)) { Text("Per a  ", style = Type.sm, color = T.muted); Text(TO[e.audience].orEmpty(), style = Type.sm) }
                Row { Text("Assumpte  ", style = Type.sm, color = T.muted); Text(e.subject, style = Type.sm, fontWeight = FontWeight.Medium) }
                Tabs(listOf("html" to "Com es veu", "text" to "Text pla"), view, { view = it }, Modifier.padding(top = 12.dp))
            }
            if (view == "html") EmailView(e.html) else Text(e.text, style = Type.sm, modifier = Modifier.padding(16.dp))
        }
    }
}

/** The email in a web view of its own (it is an HTML email), no scripts */
@SuppressLint("SetJavaScriptEnabled")
@Composable
private fun EmailView(html: String) {
    AndroidView({ WebView(it).apply { settings.javaScriptEnabled = false; isVerticalScrollBarEnabled = false; setBackgroundColor(0xFFEFEBE3.toInt()) } },
        Modifier.fillMaxWidth().height(640.dp), update = { it.loadDataWithBaseURL(Api.base, html, "text/html", "utf-8", null) })
}

