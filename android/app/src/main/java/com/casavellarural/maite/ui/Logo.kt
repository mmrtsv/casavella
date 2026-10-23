package com.casavellarural.maite.ui

import android.content.Context
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.keyframes
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathFillType
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.casavellarural.maite.R
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

/** The brand logo as vector paths (res/raw/logo.json, traced by android/tools/logo.py): sharp at any size */
object LogoArt {
    @Serializable private data class Raw(val w: Float, val h: Float, val parts: List<RawPart>)
    @Serializable private data class RawPart(val kind: String, val box: List<Float>, val d: String)
    class Part(val kind: String, val left: Float, val top: Float, val right: Float, val bottom: Float, val path: Path)

    var w = 420f; private set
    var h = 491f; private set
    private var all: List<Part>? = null

    fun parts(context: Context): List<Part> = all ?: run {
        val raw = Json.decodeFromString(Raw.serializer(), context.resources.openRawResource(R.raw.logo).bufferedReader().readText())
        w = raw.w; h = raw.h
        raw.parts.map { p ->
            Part(p.kind, p.box[0], p.box[1], p.box[2], p.box[3], PathParser().parsePathString(p.d).toPath().apply { fillType = PathFillType.EvenOdd })
        }.also { all = it }
    }
}

/** Cava on dark, Verd fosc on light, like the PNGs it replaces */
private val ink @Composable get() = if (T.dark) Color(0xFFF3EFE4) else Deep

@Composable
private fun plant(): Pair<List<LogoArt.Part>, FloatArray> {
    val context = LocalContext.current
    return remember {
        val p = LogoArt.parts(context).filter { it.kind == "plant" }
        p to floatArrayOf(p.minOf { it.left }, p.minOf { it.top }, p.maxOf { it.right }, p.maxOf { it.bottom })
    }
}

/** Draws [parts] with the box [b] fitted in the canvas; [grow] (0 to 1) reveals the plant from the ground up */
private fun DrawScope.plantIn(parts: List<LogoArt.Part>, b: FloatArray, color: Color, grow: Float = 1f) {
    val s = minOf(size.width / (b[2] - b[0]), size.height / (b[3] - b[1]))
    translate((size.width - (b[2] - b[0]) * s) / 2 - b[0] * s, (size.height - (b[3] - b[1]) * s) / 2 - b[1] * s) {
        scale(s, s, Offset.Zero) { growing(parts, b[1], b[3], color, grow) }
    }
}

// The stem rises from its foot; a separate leaf opens once the stem reaches it
private fun DrawScope.growing(parts: List<LogoArt.Part>, top: Float, bottom: Float, color: Color, grow: Float) {
    val line = bottom - (bottom - top) * grow
    parts.forEach { p ->
        val big = (p.bottom - p.top) > (bottom - top) / 2
        if (big) clipRect(left = p.left - 1, top = line, right = p.right + 1, bottom = bottom + 1) { drawPath(p.path, color) }
        else {
            val k = ((p.bottom - line) / (p.bottom - p.top)).coerceIn(0f, 1f)
            if (k > 0f) scale(0.4f + 0.6f * k, 0.4f + 0.6f * k, Offset((p.left + p.right) / 2, p.bottom)) { drawPath(p.path, color.copy(alpha = color.alpha * k)) }
        }
    }
}

/** The isotype: the plant without the name */
@Composable
fun Iso(size: Dp) {
    val (parts, b) = plant()
    val color = ink
    Canvas(Modifier.size(size).semantics { contentDescription = "La Casa Vella" }) { plantIn(parts, b, color) }
}

/** Waiting inside a page: the plant grows, rests and fades, again and again */
@Composable
fun IsoGrow(size: Dp = 44.dp) {
    val (parts, b) = plant()
    val color = ink
    val t = rememberInfiniteTransition(label = "iso")
    val grow by t.animateFloat(0f, 1f, infiniteRepeatable(keyframes {
        durationMillis = 2000
        0f at 0; 1f at 1100 using FastOutSlowInEasing; 1f at 2000
    }), label = "grow")
    val fade by t.animateFloat(1f, 1f, infiniteRepeatable(keyframes {
        durationMillis = 2000
        1f at 1600; 0f at 2000
    }), label = "fade")
    Canvas(Modifier.size(size).semantics { contentDescription = "Carregant" }) { plantIn(parts, b, color.copy(alpha = fade), grow) }
}

/** The whole logo building itself while Maite loads: the plant grows, the name is written letter by letter, then
 *  1898 and El Bedorc. Once built it breathes until the page is ready. */
@Composable
fun LogoBuild(width: Dp = 168.dp) {
    val context = LocalContext.current
    val parts = remember { LogoArt.parts(context) }
    val (plantParts, b) = plant()
    val names = remember { parts.filter { it.kind == "name" } }
    val details = remember { parts.filter { it.kind == "detail" } }
    val color = ink
    val time = remember { Animatable(0f) }
    LaunchedEffect(Unit) { time.animateTo(BUILT, tween(BUILT.toInt(), easing = LinearEasing)) }
    val breathe by rememberInfiniteTransition(label = "logo").animateFloat(1f, 0.55f,
        infiniteRepeatable(tween(1100, easing = FastOutSlowInEasing), RepeatMode.Reverse), label = "breathe")
    Canvas(Modifier.width(width).aspectRatio(LogoArt.w / LogoArt.h).semantics { contentDescription = "Carregant" }) {
        val ms = time.value
        val s = size.width / LogoArt.w
        val a = if (ms >= BUILT) breathe else 1f
        scale(s, s, Offset.Zero) {
            val grow = FastOutSlowInEasing.transform((ms / 1500f).coerceIn(0f, 1f))
            growing(plantParts, b[1], b[3], color.copy(alpha = a), grow)
            names.forEachIndexed { i, p ->
                val k = FastOutSlowInEasing.transform(((ms - 1150 - i * 70) / 380f).coerceIn(0f, 1f))
                if (k > 0f) translate(0f, (1 - k) * 14f) { drawPath(p.path, color.copy(alpha = a * k)) }
            }
            val k = ((ms - 2050) / 450f).coerceIn(0f, 1f)
            if (k > 0f) details.forEach { drawPath(it.path, color.copy(alpha = a * k)) }
        }
    }
}

private const val BUILT = 2600f
