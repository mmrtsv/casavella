package com.casavellarural.maite.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

/** Maite's tokens (maite-app/src/styles.css): the brand greens, Cava and neutrals mixed from them, light and dark */
@Immutable
data class Tok(
    val dark: Boolean,
    val background: Color, val foreground: Color, val surface: Color, val overlay: Color, val muted: Color,
    val default: Color, val accent: Color, val onAccent: Color, val field: Color, val fieldBorder: Color,
    val border: Color, val separator: Color, val warning: Color, val warningText: Color, val danger: Color,
    val paid: Color, val paidText: Color, val cava: Color, val glowA: Color, val glowB: Color, val rowHover: Color,
)

val Deep = Color(0xFF1A3F20); val Basil = Color(0xFF2E6D2E); val Sage = Color(0xFF79A57A); val Cava = Color(0xFFC6BFAF)

val LightTok = Tok(
    dark = false, background = Color(0xFFF6F4EF), foreground = Color(0xFF121A14), surface = Color.White, overlay = Color.White,
    muted = Color(0xFF586257), default = Color(0xFFEAE6DD), accent = Basil, onAccent = Color.White, field = Color.White,
    fieldBorder = Color(0x291A3F20), border = Color(0x1F1A3F20), separator = Color(0x1A1A3F20), warning = Color(0xFFE5A00D),
    warningText = Color(0xFF8A5A00), danger = Color(0xFFD13B2F), paid = Color(0x3879A57A), paidText = Deep, cava = Cava,
    glowA = Color(0x5779A57A), glowB = Color(0x99C6BFAF), rowHover = Color(0x0A1A3F20),
)
val DarkTok = Tok(
    dark = true, background = Color(0xFF0A110C), foreground = Color(0xFFEEF1EC), surface = Color(0xFF111B13), overlay = Color(0xFF142016),
    muted = Color(0xFFA3ADA2), default = Color(0xFF1C251C), accent = Sage, onAccent = Color(0xFF08100A), field = Color(0xFF151C15),
    fieldBorder = Color(0x2E79A57A), border = Color(0x2979A57A), separator = Color(0x2479A57A), warning = Color(0xFFF2B53A),
    warningText = Color(0xFFF2C46A), danger = Color(0xFFF0705F), paid = Color(0x3879A57A), paidText = Color(0xFFB9D6B9), cava = Cava,
    glowA = Color(0x8C2E6D2E), glowB = Color(0xCC1A3F20), rowHover = Color(0x09FFFFFF),
)

val LocalTok = staticCompositionLocalOf { LightTok }
val T: Tok @Composable get() = LocalTok.current

/** Type: the system font, five steps, as the web (system UI font, text-xs to text-2xl) */
object Type {
    val xs = TextStyle(fontSize = 12.sp, lineHeight = 16.sp)
    val sm = TextStyle(fontSize = 14.sp, lineHeight = 20.sp)
    val base = TextStyle(fontSize = 16.sp, lineHeight = 22.sp)
    val lg = TextStyle(fontSize = 18.sp, lineHeight = 24.sp, fontWeight = FontWeight.SemiBold, letterSpacing = (-0.2).sp)
    val xl = TextStyle(fontSize = 24.sp, lineHeight = 30.sp, fontWeight = FontWeight.SemiBold, letterSpacing = (-0.4).sp)
    val xxl = TextStyle(fontSize = 32.sp, lineHeight = 38.sp, fontWeight = FontWeight.SemiBold, letterSpacing = (-0.6).sp)
}

@Composable
fun MaiteTheme(dark: Boolean, content: @Composable () -> Unit) {
    val t = if (dark) DarkTok else LightTok
    val scheme = if (dark) darkColorScheme(
        primary = t.accent, onPrimary = t.onAccent, background = t.background, onBackground = t.foreground, surface = t.surface,
        onSurface = t.foreground, surfaceVariant = t.default, onSurfaceVariant = t.muted, outline = t.fieldBorder, outlineVariant = t.separator,
        surfaceContainer = t.overlay, surfaceContainerHigh = t.overlay, surfaceContainerHighest = t.default, surfaceContainerLow = t.surface,
        secondaryContainer = t.paid, onSecondaryContainer = t.foreground, error = t.danger,
    ) else lightColorScheme(
        primary = t.accent, onPrimary = t.onAccent, background = t.background, onBackground = t.foreground, surface = t.surface,
        onSurface = t.foreground, surfaceVariant = t.default, onSurfaceVariant = t.muted, outline = t.fieldBorder, outlineVariant = t.separator,
        surfaceContainer = t.overlay, surfaceContainerHigh = t.overlay, surfaceContainerHighest = t.default, surfaceContainerLow = t.surface,
        secondaryContainer = t.paid, onSecondaryContainer = t.foreground, error = t.danger,
    )
    CompositionLocalProvider(LocalTok provides t) {
        MaterialTheme(colorScheme = scheme, content = content)
    }
}
