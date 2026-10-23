package com.casavellarural.maite.ui

import androidx.annotation.DrawableRes
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.casavellarural.maite.R
import com.casavellarural.maite.data.Booking
import com.casavellarural.maite.data.KIND
import kotlinx.coroutines.delay

// Shared pieces, the native counterparts of the web's HeroUI parts: card, buttons, status chip, fields, selects, tabs, toasts

val CardShape = RoundedCornerShape(16.dp)

@Composable
fun Ico(@DrawableRes id: Int, modifier: Modifier = Modifier, tint: Color = T.foreground, size: Dp = 18.dp, label: String? = null) =
    Icon(painterResource(id), contentDescription = label, modifier = modifier.size(size), tint = tint)

/** Cards: a plain surface with its border and a soft shadow; one radius for all */
@Composable
fun Card(modifier: Modifier = Modifier, padding: PaddingValues = PaddingValues(0.dp), content: @Composable ColumnScope.() -> Unit) {
    Column(
        modifier
            .shadow(if (T.dark) 0.dp else 6.dp, CardShape, ambientColor = Color(0x331A3F20), spotColor = Color(0x261A3F20))
            .clip(CardShape).background(T.surface).border(1.dp, T.border, CardShape).padding(padding),
        content = content,
    )
}

/** A muted inner panel, for a block inside a card */
@Composable
fun Panel(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) =
    Column(modifier.clip(RoundedCornerShape(14.dp)).background(T.default.copy(alpha = 0.6f)).padding(horizontal = 14.dp, vertical = 12.dp), content = content)

@Composable
fun Divider() = Box(Modifier.fillMaxWidth().height(1.dp).background(T.separator))

enum class Look { Primary, Secondary, Ghost, Danger, DangerSoft }

@Composable
fun Btn(
    text: String, onClick: () -> Unit, modifier: Modifier = Modifier, look: Look = Look.Primary, @DrawableRes icon: Int? = null,
    busy: Boolean = false, enabled: Boolean = true, small: Boolean = true, full: Boolean = false,
) {
    val t = T
    val (bg, fg) = when (look) {
        Look.Primary -> t.accent to t.onAccent
        Look.Secondary -> t.default to t.foreground
        Look.Ghost -> Color.Transparent to t.foreground
        Look.Danger -> t.danger to Color.White
        Look.DangerSoft -> t.danger.copy(alpha = 0.12f) to t.danger
    }
    Row(
        modifier.then(if (full) Modifier.fillMaxWidth() else Modifier).heightIn(min = if (small) 36.dp else 44.dp)
            .clip(CircleShape).background(bg).alpha(if (enabled) 1f else 0.45f)
            .clickable(enabled = enabled && !busy, role = Role.Button, onClick = onClick)
            .padding(horizontal = if (small) 14.dp else 18.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp, Alignment.CenterHorizontally),
    ) {
        if (busy) CircularProgressIndicator(Modifier.size(15.dp), color = fg, strokeWidth = 2.dp)
        else if (icon != null) Ico(icon, tint = fg, size = 16.dp)
        Text(text, style = Type.sm, fontWeight = FontWeight.Medium, color = fg, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
fun IconBtn(@DrawableRes icon: Int, label: String, onClick: () -> Unit, modifier: Modifier = Modifier, tint: Color = T.foreground, on: Boolean = false, enabled: Boolean = true, busy: Boolean = false) {
    Box(
        modifier.size(40.dp).clip(CircleShape).background(if (on) T.default else Color.Transparent).alpha(if (enabled) 1f else 0.35f)
            .clickable(enabled = enabled && !busy, role = Role.Button, onClick = onClick).semantics { contentDescription = label },
        contentAlignment = Alignment.Center,
    ) {
        if (busy) CircularProgressIndicator(Modifier.size(16.dp), color = tint, strokeWidth = 2.dp) else Ico(icon, tint = tint)
    }
}

enum class Tone { Paid, Due, Other, Neutral, Danger }

/** Status chips: a dot and a word, the brand green for done things and amber for things still owed */
@Composable
fun Tag(text: String, tone: Tone = Tone.Neutral) {
    val t = T
    val (bg, fg) = when (tone) {
        Tone.Paid -> t.paid to t.paidText
        Tone.Due -> t.warning.copy(alpha = 0.2f) to t.warningText
        Tone.Other -> t.cava.copy(alpha = 0.22f) to (if (t.dark) Color(0xFFE2DCCF) else Color(0xFF5E584A))
        Tone.Neutral -> t.default to t.muted
        Tone.Danger -> t.danger.copy(alpha = 0.14f) to t.danger
    }
    Row(Modifier.clip(CircleShape).background(bg).padding(horizontal = 10.dp, vertical = 3.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(6.dp).clip(CircleShape).background(fg))
        Spacer(Modifier.width(6.dp))
        Text(text, style = Type.xs, fontWeight = FontWeight.SemiBold, color = fg, maxLines = 1)
    }
}

@Composable
fun Status(b: Booking) = when (b.kind) {
    "paid" -> Tag("Pagada a la web", Tone.Paid)
    "pending" -> Tag("Pendent del banc", Tone.Due)
    "manual" -> if (b.settled) Tag("Cobrada", Tone.Paid) else Tag("Per cobrar", Tone.Due)
    "other" -> Tag("Google Calendar", Tone.Other)
    "cancelled", "refunded" -> Tag(KIND.getValue(b.kind), Tone.Danger)
    else -> Tag(KIND[b.kind] ?: b.kind, Tone.Neutral)
}

/** Shortcut keys only act when no text field has the focus */
object Keys { var typing by mutableStateOf(0) }

@Composable
fun Field(
    label: String, value: String, onChange: (String) -> Unit, modifier: Modifier = Modifier, help: String? = null,
    placeholder: String? = null, area: Boolean = false, type: KeyboardType = KeyboardType.Text, onBlur: (() -> Unit)? = null, error: Boolean = false,
) {
    var focused by remember { mutableStateOf(false) }
    Column(modifier) {
        Text(label, style = Type.sm, fontWeight = FontWeight.Medium, color = T.foreground, modifier = Modifier.padding(bottom = 6.dp))
        OutlinedTextField(
            value = value, onValueChange = onChange, singleLine = !area, minLines = if (area) 3 else 1,
            placeholder = placeholder?.let { { Text(it, style = Type.base, color = T.muted) } },
            textStyle = Type.base.copy(color = T.foreground), shape = RoundedCornerShape(12.dp), isError = error,
            keyboardOptions = KeyboardOptions(keyboardType = type),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = T.field, unfocusedContainerColor = T.field, focusedBorderColor = T.accent, unfocusedBorderColor = T.fieldBorder,
                cursorColor = T.accent,
            ),
            modifier = Modifier.fillMaxWidth().onFocusChanged { f ->
                if (f.isFocused != focused) { Keys.typing += if (f.isFocused) 1 else -1; if (!f.isFocused) onBlur?.invoke() }
                focused = f.isFocused
            },
        )
        if (help != null) Text(help, style = Type.xs, color = T.muted, modifier = Modifier.padding(top = 4.dp))
    }
}

/** A labelled select (the web's Choice) */
@Composable
fun Choice(label: String?, value: String, items: List<Pair<String, String>>, onChange: (String) -> Unit, modifier: Modifier = Modifier, placeholder: String = "Tria…") {
    var open by remember { mutableStateOf(false) }
    Column(modifier) {
        if (label != null) Text(label, style = Type.sm, fontWeight = FontWeight.Medium, modifier = Modifier.padding(bottom = 6.dp))
        Box {
            Row(
                Modifier.fillMaxWidth().heightIn(min = 48.dp).clip(RoundedCornerShape(12.dp)).background(T.field)
                    .border(1.dp, T.fieldBorder, RoundedCornerShape(12.dp)).clickable(role = Role.DropdownList) { open = true }
                    .padding(horizontal = 14.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                val name = items.find { it.first == value }?.second
                Text(name ?: placeholder, style = Type.base, color = if (name == null) T.muted else T.foreground, modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
                Ico(R.drawable.ic_chevron_down, tint = T.muted, size = 16.dp)
            }
            DropdownMenu(open, { open = false }, modifier = Modifier.background(T.overlay)) {
                items.forEach { (id, name) ->
                    DropdownMenuItem(
                        text = { Text(name, style = Type.base, fontWeight = if (id == value) FontWeight.SemiBold else FontWeight.Normal) },
                        trailingIcon = if (id == value) ({ Ico(R.drawable.ic_check, tint = T.accent, size = 16.dp) }) else null,
                        onClick = { open = false; onChange(id) },
                    )
                }
            }
        }
    }
}

@Composable
fun CheckRow(checked: Boolean, onChange: (Boolean) -> Unit, text: String, modifier: Modifier = Modifier, bold: Boolean = false) {
    Row(
        modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).clickable(role = Role.Checkbox) { onChange(!checked) }.padding(vertical = 2.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Checkbox(checked, onCheckedChange = onChange, colors = CheckboxDefaults.colors(checkedColor = T.accent, uncheckedColor = T.foreground.copy(alpha = 0.45f), checkmarkColor = T.onAccent))
        Text(text, style = Type.sm, fontWeight = if (bold) FontWeight.SemiBold else FontWeight.Normal)
    }
}

/** Filters read as one segmented control: a soft track and a solid brand pill for the chosen option */
@Composable
fun Segmented(options: List<Pair<String, String>>, selected: String, onSelect: (String) -> Unit, modifier: Modifier = Modifier) {
    Row(
        modifier.horizontalScroll(rememberScrollState()).clip(CircleShape).background(T.default.copy(alpha = 0.85f))
            .border(1.dp, T.border, CircleShape).padding(3.dp),
        horizontalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        options.forEach { (id, label) ->
            val on = id == selected
            Box(
                Modifier.clip(CircleShape).background(if (on) T.accent else Color.Transparent).clickable(role = Role.Tab) { onSelect(id) }
                    .padding(horizontal = 14.dp, vertical = 8.dp),
            ) { Text(label, style = Type.sm, fontWeight = if (on) FontWeight.SemiBold else FontWeight.Medium, color = if (on) T.onAccent else T.foreground, maxLines = 1) }
        }
    }
}

/** Tabs: a track with the chosen tab as a raised pill, like HeroUI's */
@Composable
fun Tabs(options: List<Pair<String, String>>, selected: String, onSelect: (String) -> Unit, modifier: Modifier = Modifier) {
    Row(
        modifier.horizontalScroll(rememberScrollState()).clip(RoundedCornerShape(14.dp)).background(T.default.copy(alpha = 0.7f)).padding(3.dp),
        horizontalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        options.forEach { (id, label) ->
            val on = id == selected
            Box(
                Modifier.clip(RoundedCornerShape(11.dp)).background(if (on) T.surface else Color.Transparent)
                    .then(if (on) Modifier.border(1.dp, T.border, RoundedCornerShape(11.dp)) else Modifier)
                    .clickable(role = Role.Tab) { onSelect(id) }.padding(horizontal = 14.dp, vertical = 8.dp),
            ) { Text(label, style = Type.sm, fontWeight = if (on) FontWeight.SemiBold else FontWeight.Medium, color = if (on) T.foreground else T.muted, maxLines = 1) }
        }
    }
}

@Composable
fun Progress(done: Int, total: Int, modifier: Modifier = Modifier, width: Dp = 48.dp) {
    val f by animateFloatAsState(if (total == 0) 0f else done / total.toFloat(), label = "progress")
    Row(modifier, verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.width(width).height(6.dp).clip(CircleShape).background(T.border)) {
            Box(Modifier.fillMaxWidth(f).height(6.dp).clip(CircleShape).background(T.accent))
        }
        Spacer(Modifier.width(8.dp))
        Text("$done/$total", style = Type.xs, color = T.muted)
    }
}

@Composable
fun SectionTitle(text: String, modifier: Modifier = Modifier, action: @Composable RowScope.() -> Unit = {}) {
    Row(modifier.fillMaxWidth().padding(bottom = 10.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(text, style = Type.lg, modifier = Modifier.weight(1f))
        action()
    }
}

@Composable
fun Muted(text: String, modifier: Modifier = Modifier) = Text(text, style = Type.sm, color = T.muted, modifier = modifier)

@Composable
fun ErrorNote(msg: String) {
    if (msg.isNotEmpty()) Text(msg, style = Type.sm, color = T.danger, modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
        .clip(RoundedCornerShape(12.dp)).background(T.danger.copy(alpha = 0.1f)).padding(horizontal = 12.dp, vertical = 8.dp))
}

@Composable
fun Loading(modifier: Modifier = Modifier) = Box(modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
    CircularProgressIndicator(Modifier.size(28.dp), color = T.accent, strokeWidth = 3.dp)
}

// ---------- Toasts ----------
object Toasts {
    data class Toast(val id: Long, val text: String, val error: Boolean)
    val list = mutableStateListOf<Toast>()
    fun done(text: String) { list += Toast(System.nanoTime(), text, false) }
    fun error(e: Throwable) { list += Toast(System.nanoTime(), e.message ?: "Alguna cosa no ha anat bé", true) }
    fun error(text: String) { list += Toast(System.nanoTime(), text, true) }
}

@Composable
fun ToastHost(modifier: Modifier = Modifier) {
    val toast = Toasts.list.lastOrNull()
    LaunchedEffect(toast?.id) { if (toast != null) { delay(if (toast.error) 6000 else 3200); Toasts.list.remove(toast) } }
    AnimatedVisibility(toast != null, modifier, enter = fadeIn() + slideInVertically { it / 2 }, exit = fadeOut() + slideOutVertically { it / 2 }) {
        val t = toast ?: return@AnimatedVisibility
        Row(
            Modifier.padding(horizontal = 16.dp).shadow(12.dp, RoundedCornerShape(18.dp)).clip(RoundedCornerShape(18.dp)).background(T.overlay)
                .border(1.dp, T.border, RoundedCornerShape(18.dp)).clickable(interactionSource = remember { MutableInteractionSource() }, indication = null) { Toasts.list.remove(t) }
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Ico(if (t.error) R.drawable.ic_triangle_alert else R.drawable.ic_circle_check, tint = if (t.error) T.danger else T.accent, size = 18.dp)
            Spacer(Modifier.width(10.dp))
            Text(t.text, style = Type.sm, color = T.foreground)
        }
    }
}

@Composable
fun Kpi(label: String, value: String, modifier: Modifier = Modifier, hint: String? = null, extra: @Composable () -> Unit = {}) {
    Card(modifier, padding = PaddingValues(horizontal = 16.dp, vertical = 14.dp)) {
        Text(label, style = Type.xs, fontWeight = FontWeight.Medium, color = T.muted, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(value, style = Type.xl, modifier = Modifier.padding(top = 4.dp), maxLines = 1)
        if (hint != null) Text(hint, style = Type.xs, color = T.muted, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(top = 4.dp))
        extra()
    }
}
