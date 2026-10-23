package com.casavellarural.maite.ui

import android.app.Activity
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.focusable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
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
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.isAltPressed
import androidx.compose.ui.input.key.isCtrlPressed
import androidx.compose.ui.input.key.isShiftPressed
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.casavellarural.maite.R
import com.casavellarural.maite.data.Auth
import com.casavellarural.maite.data.Maite
import com.casavellarural.maite.ui.screens.BlockDates
import com.casavellarural.maite.ui.screens.BookingFile
import com.casavellarural.maite.ui.screens.Bookings
import com.casavellarural.maite.ui.screens.CalendarActions
import com.casavellarural.maite.ui.screens.CalendarScreen
import com.casavellarural.maite.ui.screens.CancelBooking
import com.casavellarural.maite.ui.screens.Discounts
import com.casavellarural.maite.ui.screens.Emails
import com.casavellarural.maite.ui.screens.Home
import com.casavellarural.maite.ui.screens.NewBooking
import com.casavellarural.maite.ui.screens.Prices
import com.casavellarural.maite.ui.screens.Rules
import com.casavellarural.maite.ui.screens.SearchSheet
import com.casavellarural.maite.ui.social.SocialScreen
import com.casavellarural.maite.ui.screens.Stays
import kotlinx.coroutines.launch

/** Shape of the screen: the Titan 2 Elite is nearly square and short, so the sections go in a side rail; tall phones get a bottom bar */
data class Layout(val rail: Boolean, val compact: Boolean, val wide: Boolean)
val LocalLayout = androidx.compose.runtime.staticCompositionLocalOf { Layout(rail = false, compact = true, wide = false) }

@Composable
fun MaiteRoot() {
    val dark = Ui.dark ?: isSystemInDarkTheme()
    MaiteTheme(dark) {
        Box(Modifier.fillMaxSize().background(T.background)) {
            Glow()
            when (Auth.state) {
                Auth.State.SignedIn -> App()
                Auth.State.NeedsConfig -> Connect()
                else -> SignIn()
            }
        }
    }
}

/** The soft brand light behind everything (the web's body::before) */
@Composable
fun Glow() {
    val a = T.glowA; val b = T.glowB
    Canvas(Modifier.fillMaxSize()) {
        drawRect(Brush.radialGradient(listOf(a, Color.Transparent), center = Offset(size.width * 0.05f, -size.height * 0.05f), radius = size.maxDimension * 0.75f))
        drawRect(Brush.radialGradient(listOf(b, Color.Transparent), center = Offset(size.width * 1.05f, size.height * 0.12f), radius = size.maxDimension * 0.6f))
    }
}

@Composable
fun Iso(size: androidx.compose.ui.unit.Dp) =
    Image(painterResource(if (T.dark) R.drawable.iso_light else R.drawable.iso_dark), contentDescription = null, modifier = Modifier.size(size))

// ---------- Sign-in ----------
@Composable
private fun Welcome(content: @Composable () -> Unit) {
    Column(
        Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing).verticalScroll(rememberScrollState()).padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center,
    ) {
        Iso(64.dp)
        Text("Maite", style = Type.xxl, modifier = Modifier.padding(top = 16.dp))
        Text("La Casa Vella", style = Type.sm, color = T.muted)
        Spacer(Modifier.height(28.dp))
        content()
    }
}

@Composable
fun SignIn() {
    val scope = rememberCoroutineScope()
    var busy by remember { mutableStateOf(false) }
    var err by remember { mutableStateOf("") }
    Welcome {
        Btn("Entra amb Google", { busy = true; err = ""; scope.launch { err = Auth.signIn().orEmpty(); busy = false } }, busy = busy, small = false, icon = R.drawable.ic_user)
        ErrorNote(err)
        Text("Amb un compte autoritzat de La Casa Vella.", style = Type.xs, color = T.muted, modifier = Modifier.padding(top = 14.dp), textAlign = TextAlign.Center)
    }
}

@Composable
fun Connect() {
    var code by remember { mutableStateOf("") }
    var err by remember { mutableStateOf("") }
    Welcome {
        Column(Modifier.widthIn360()) {
            Text("Connecta l'app", style = Type.lg)
            Muted("Enganxa el codi de connexió de Maite. Només cal fer-ho una vegada en aquest mòbil.", Modifier.padding(top = 4.dp, bottom = 14.dp))
            Field("Codi de connexió", code, { code = it }, area = true)
            ErrorNote(err)
            Spacer(Modifier.height(14.dp))
            Btn("Connecta", { if (!Auth.useCode(code)) err = "Aquest codi no és vàlid" }, full = true, small = false)
        }
    }
}
private fun Modifier.widthIn360() = this.then(Modifier.fillMaxWidth()).padding(horizontal = 0.dp)

// ---------- The app ----------
private val RAIL = listOf(Page.Home, Page.Calendar, Page.Bookings, Page.Prices, Page.Social)
private val BAR = listOf(Page.Home, Page.Calendar, Page.Bookings, Page.Prices)
private val MORE = listOf(Page.Social, Page.Discounts, Page.Stays, Page.Rules, Page.Emails)

@Composable
fun App() {
    val activity = LocalContext.current as? Activity
    LaunchedEffect(Unit) { Maite.reload() }
    BackHandler { if (!Ui.back()) activity?.finish() }
    val focus = remember { FocusRequester() }
    LaunchedEffect(Unit) { runCatching { focus.requestFocus() } }
    BoxWithConstraints(Modifier.fillMaxSize().focusRequester(focus).focusable().onPreviewKeyEvent { e ->
        if (e.type != KeyEventType.KeyDown || e.isCtrlPressed || e.isAltPressed) return@onPreviewKeyEvent false
        if (e.key == Key.Escape) return@onPreviewKeyEvent Ui.back()
        if (Keys.typing > 0) return@onPreviewKeyEvent false
        shortcut(e.key, e.isShiftPressed)
    }) {
        val rail = maxHeight < 600.dp || maxWidth > 840.dp
        val layout = Layout(rail = rail, compact = maxWidth < 600.dp, wide = maxWidth > 840.dp)
        androidx.compose.runtime.CompositionLocalProvider(LocalLayout provides layout) {
            Row(Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Horizontal))) {
                if (rail) Rail()
                Column(Modifier.weight(1f).fillMaxHeight()) {
                    TopBar(rail)
                    Box(Modifier.weight(1f).fillMaxWidth()) { Content() }
                }
            }
            if (!rail) BottomBar(Modifier.align(Alignment.BottomCenter))
            ToastHost(Modifier.align(Alignment.BottomCenter).navigationBarsPadding().imePadding().padding(bottom = if (rail) 12.dp else 92.dp))
        }
        Windows()
    }
}

private fun shortcut(k: Key, shift: Boolean): Boolean {
    val pages = Page.entries
    val digits = listOf(Key.One, Key.Two, Key.Three, Key.Four, Key.Five, Key.Six, Key.Seven, Key.Eight, Key.Nine)
    val i = digits.indexOf(k)
    when {
        i >= 0 && i < pages.size -> Ui.go(pages[i])
        k == Key.N -> Ui.book = BookDraft()
        k == Key.T -> Ui.block = BlockDraft()
        k == Key.S || (k == Key.Slash && !shift) -> Ui.search = true
        k == Key.Slash && shift -> Ui.keys = true
        k == Key.R -> Maite.refresh()
        k == Key.D -> Ui.dark = !(Ui.dark ?: false)
        else -> return false
    }
    return true
}

@Composable
private fun Content() {
    when (Ui.page) {
        Page.Home -> Home()
        Page.Calendar -> CalendarScreen()
        Page.Bookings -> Bookings()
        Page.Prices -> Prices()
        Page.Discounts -> Discounts()
        Page.Stays -> Stays()
        Page.Rules -> Rules()
        Page.Emails -> Emails()
        Page.Social -> SocialScreen()
    }
}

@Composable
private fun TopBar(rail: Boolean) {
    Row(
        Modifier.fillMaxWidth().statusBarsPadding().padding(start = if (rail) 4.dp else 16.dp, end = 8.dp, top = 6.dp, bottom = 4.dp).height(48.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (!rail) { Iso(26.dp); Spacer(Modifier.width(10.dp)) }
        Text(Ui.page.title, style = Type.xl, modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
        if (Ui.page == Page.Calendar) CalendarActions()
        IconBtn(R.drawable.ic_search, "Cerca", { Ui.search = true })
        val dark = T.dark
        if (!rail) IconBtn(if (dark) R.drawable.ic_sun else R.drawable.ic_moon, if (dark) "Mode clar" else "Mode fosc", { Ui.dark = !dark })
    }
}

@Composable
private fun Rail() {
    Column(
        Modifier.fillMaxHeight().width(76.dp).statusBarsPadding().navigationBarsPadding().padding(vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Box(Modifier.padding(top = 6.dp, bottom = 10.dp)) { Iso(30.dp) }
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(2.dp)) {
            RAIL.forEach { p -> NavItem(p.icon, if (p == Page.Social) "Xarxes" else p.title, Ui.page == p) { Ui.go(p) } }
            NavItem(R.drawable.ic_ellipsis, "Més", Ui.page in MORE - Page.Social || Ui.more) { Ui.more = true }
        }
    }
}

@Composable
private fun BottomBar(modifier: Modifier) {
    Row(
        modifier.navigationBarsPadding().padding(horizontal = 12.dp, vertical = 10.dp).fillMaxWidth()
            .shadow(16.dp, RoundedCornerShape(26.dp), ambientColor = Color(0x401A3F20), spotColor = Color(0x401A3F20))
            .clip(RoundedCornerShape(26.dp)).background(T.overlay.copy(alpha = 0.96f)).border(1.dp, T.border, RoundedCornerShape(26.dp)).padding(6.dp),
        horizontalArrangement = Arrangement.SpaceEvenly,
    ) {
        BAR.forEach { p -> Box(Modifier.weight(1f)) { NavItem(p.icon, p.title, Ui.page == p) { Ui.go(p) } } }
        Box(Modifier.weight(1f)) { NavItem(R.drawable.ic_ellipsis, "Més", Ui.page in MORE || Ui.more) { Ui.more = true } }
    }
}

@Composable
private fun NavItem(icon: Int, label: String, on: Boolean, onClick: () -> Unit) {
    Column(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp)).clickable(role = Role.Tab, onClick = onClick).padding(vertical = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Box(Modifier.width(48.dp).height(28.dp).clip(CircleShape).background(if (on) T.accent.copy(alpha = 0.2f) else Color.Transparent), contentAlignment = Alignment.Center) {
            Ico(icon, tint = if (on) T.accent else T.muted, size = 19.dp)
        }
        Text(label, style = Type.xs, fontWeight = FontWeight.Medium, color = if (on) T.foreground else T.muted, maxLines = 1, modifier = Modifier.padding(top = 3.dp))
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun Windows() {
    if (Ui.detail != null) BookingFile()
    if (Ui.book != null) NewBooking()
    if (Ui.block != null) BlockDates()
    if (Ui.cancel != null) CancelBooking()
    if (Ui.search) SearchSheet()
    if (Ui.more) MoreSheet()
    if (Ui.keys) KeysSheet()
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Sheet(onClose: () -> Unit, full: Boolean = false, content: @Composable () -> Unit) {
    val state = rememberModalBottomSheetState(skipPartiallyExpanded = full)
    ModalBottomSheet(onDismissRequest = onClose, sheetState = state, containerColor = T.overlay, contentColor = T.foreground,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp), dragHandle = { Box(Modifier.padding(top = 10.dp, bottom = 6.dp).width(36.dp).height(4.dp).clip(CircleShape).background(T.border)) }) {
        content()
    }
}

@Composable
private fun MoreSheet() {
    val scope = rememberCoroutineScope()
    val dark = T.dark
    Sheet({ Ui.more = false }) {
        Column(Modifier.padding(horizontal = 12.dp).padding(bottom = 24.dp).verticalScroll(rememberScrollState())) {
            MORE.forEach { p -> MenuRow(p.icon, p.title, p.hint, Ui.page == p) { Ui.go(p) } }
            Divider()
            MenuRow(if (T.dark) R.drawable.ic_sun else R.drawable.ic_moon, if (T.dark) "Mode clar" else "Mode fosc", null, false) { Ui.dark = !dark; Ui.more = false }
            MenuRow(R.drawable.ic_keyboard, "Dreceres de teclat", "Per al teclat del Titan", false) { Ui.more = false; Ui.keys = true }
            MenuRow(R.drawable.ic_refresh_cw, "Torna a carregar", null, false) { Ui.more = false; Maite.refresh() }
            MenuRow(R.drawable.ic_log_out, "Surt", Auth.email.ifEmpty { Maite.user }, false) { Ui.more = false; scope.launch { Auth.signOut() } }
        }
    }
}

@Composable
fun MenuRow(icon: Int, label: String, hint: String?, on: Boolean, onClick: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(if (on) T.accent.copy(alpha = 0.14f) else Color.Transparent)
            .clickable(onClick = onClick).padding(horizontal = 12.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Ico(icon, tint = if (on) T.accent else T.muted)
        Spacer(Modifier.width(14.dp))
        Column(Modifier.weight(1f)) {
            Text(label, style = Type.base, fontWeight = FontWeight.Medium)
            if (hint != null) Text(hint, style = Type.xs, color = T.muted, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

@Composable
private fun KeysSheet() {
    val rows = Page.entries.mapIndexed { i, p -> "${i + 1}" to p.title } + listOf(
        "N" to "Nova reserva", "T" to "Tancar dates", "S  o  /" to "Cerca", "R" to "Torna a carregar", "D" to "Mode clar o fosc", "Esc" to "Tanca o enrere", "?" to "Aquesta llista",
    )
    Sheet({ Ui.keys = false }) {
        Column(Modifier.padding(horizontal = 20.dp).padding(bottom = 28.dp).verticalScroll(rememberScrollState())) {
            Text("Dreceres de teclat", style = Type.lg, modifier = Modifier.padding(bottom = 10.dp))
            rows.forEach { (k, v) ->
                Row(Modifier.fillMaxWidth().padding(vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(k, style = Type.sm, fontWeight = FontWeight.SemiBold, modifier = Modifier.clip(RoundedCornerShape(6.dp)).background(T.default).padding(horizontal = 8.dp, vertical = 2.dp))
                    Spacer(Modifier.width(14.dp))
                    Text(v, style = Type.sm)
                }
            }
        }
    }
}

/** Page padding: tighter on the small square screen */
@Composable
fun pagePadding(): PaddingValues {
    val l = LocalLayout.current
    return PaddingValues(start = if (l.rail) 8.dp else 16.dp, end = if (l.rail) 12.dp else 16.dp, top = 8.dp, bottom = if (l.rail) 24.dp else 112.dp)
}
