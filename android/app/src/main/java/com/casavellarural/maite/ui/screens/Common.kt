package com.casavellarural.maite.ui.screens

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import com.casavellarural.maite.data.Booking
import com.casavellarural.maite.ui.T
import com.casavellarural.maite.ui.Toasts

/** Calendar bar colours by state, as tone/bar in pages/Calendar.tsx */
fun toneKey(b: Booking) = if (b.kind == "manual" && b.settled) "settled" else b.kind

@Composable
fun barFill(k: String): Color = when (k) {
    "paid", "settled" -> T.accent.copy(alpha = if (T.dark) 0.34f else 0.3f)
    "pending", "manual" -> T.warning.copy(alpha = 0.3f)
    "other" -> T.cava.copy(alpha = 0.34f)
    else -> T.foreground.copy(alpha = 0.12f)
}

@Composable
fun barDot(k: String): Color = when (k) {
    "paid", "settled" -> T.accent
    "pending", "manual" -> T.warning
    "other" -> T.cava
    else -> T.muted.copy(alpha = 0.6f)
}

@Composable
fun barText(k: String): Color = if (k == "block") T.muted else T.foreground

fun open(context: Context, url: String) {
    runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }
        .onFailure { Toasts.error("No s'ha pogut obrir l'enllaç") }
}

fun persones(n: Int) = "$n ${if (n == 1) "persona" else "persones"}"
