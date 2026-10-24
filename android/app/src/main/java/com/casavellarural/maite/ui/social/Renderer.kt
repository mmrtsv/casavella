package com.casavellarural.maite.ui.social

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Bitmap
import android.graphics.Canvas
import android.os.Handler
import android.os.Looper
import android.util.LruCache
import android.view.View
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import com.casavellarural.maite.data.Api
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.Request
import org.json.JSONObject
import java.lang.ref.WeakReference
import java.util.concurrent.atomic.AtomicInteger

@Serializable data class Template(val id: String, val title: String, val desc: String, val w: Int, val h: Int, val kind: String, val photo: String, val variants: Int)
@Serializable data class LibCopy(val label: String, val caption: String, val note: String = "", val hashtags: String = "")
@Serializable data class Style(val id: String, val label: String, val kind: String, val tpls: List<String>)
@Serializable data class Photo(val src: String, val alt: String)
/** A menu made in Menús, as maite-app/src/social/catalog.ts Menu */
@Serializable data class Menu(val photo: String, val kicker: String, val title: String, val subtitle: String, val dates: String, val name: String, val dishes: List<String>, val drinks: String, val price: String, val link: String = "")
@Serializable data class MenuDefaults(val example: Menu, val dishes: Int = 4)
/** carousels: the templates that can open a carousel, and the templates of the slides after them. library: the photos to
 *  choose from. menu: the menu Menús starts from */
@Serializable data class Catalog(val templates: List<Template>, val copies: List<LibCopy>, val styles: List<Style> = emptyList(), val carousels: Map<String, List<String>> = emptyMap(),
    val library: List<Photo> = emptyList(), val menu: MenuDefaults? = null)

/**
 * The Instagram templates are HTML (maite-app/src/social). A hidden web view draws them at full size with the brand fonts and
 * photos bundled in the app (assets/social, made by android/tools/social-assets.mjs), and each drawing becomes a bitmap the
 * native screens show, and the image that is downloaded or published.
 */
object Renderer {
    var catalog: Catalog? = null; private set
    val byId get() = catalog?.templates?.associateBy { it.id }.orEmpty()

    private var web: WebView? = null
    private var host = WeakReference<Activity>(null)
    private val ready = CompletableDeferred<Unit>()
    private val lock = Mutex()
    private val seq = AtomicInteger()
    private val waiting = mutableMapOf<Int, CompletableDeferred<Pair<Int, Int>>>()
    private val main = Handler(Looper.getMainLooper())
    private val thumbs = object : LruCache<String, Bitmap>(48 * 1024 * 1024) { override fun sizeOf(key: String, value: Bitmap) = value.byteCount }

    fun loadCatalog(c: android.content.Context) {
        if (catalog == null) catalog = Json { ignoreUnknownKeys = true }.decodeFromString(Catalog.serializer(), c.assets.open("social/templates.json").bufferedReader().readText())
    }

    /** Attaches the hidden web view to the activity, out of sight (a web view only draws when it is in a window) */
    @SuppressLint("SetJavaScriptEnabled")
    fun attach(a: Activity) {
        loadCatalog(a)
        if (web != null && host.get() === a) return
        host = WeakReference(a)
        (web?.parent as? ViewGroup)?.removeView(web)
        val w = web ?: WebView(a.applicationContext).also { v ->
            v.settings.javaScriptEnabled = true
            v.settings.useWideViewPort = true; v.settings.loadWithOverviewMode = true
            v.settings.allowFileAccess = false
            v.setBackgroundColor(0)
            v.isVerticalScrollBarEnabled = false; v.isHorizontalScrollBarEnabled = false
            v.setLayerType(View.LAYER_TYPE_SOFTWARE, null)
            v.addJavascriptInterface(Bridge, "Maite")
            v.webViewClient = Client(a)
            v.loadUrl(Api.base + "/__social/renderer.html")
            web = v
        }
        val root = a.window.decorView as ViewGroup
        root.addView(w, FrameLayout.LayoutParams(1080, 1920).apply { leftMargin = -4000 })
        w.translationX = -4000f
    }

    private object Bridge {
        @JavascriptInterface fun done(req: Int, w: Int, h: Int) { synchronized(waiting) { waiting.remove(req) }?.complete(w to h) }
    }

    /** Serves the renderer, the bundled fonts and photos, and fetches uploads (/photos/…) with the app's credentials */
    private class Client(val a: Activity) : WebViewClient() {
        override fun onPageFinished(view: WebView?, url: String?) { if (!ready.isCompleted) ready.complete(Unit) }
        override fun shouldInterceptRequest(view: WebView, req: WebResourceRequest): WebResourceResponse? {
            val u = req.url
            if (u.host != Api.base.removePrefix("https://")) return null
            val p = u.path.orEmpty()
            fun asset(name: String, type: String) = runCatching { WebResourceResponse(type, if (type.startsWith("text") || type.endsWith("javascript")) "utf-8" else null, a.assets.open(name)) }.getOrNull()
            return when {
                p.startsWith("/__social/") -> asset("social/" + p.removePrefix("/__social/"), if (p.endsWith(".js")) "application/javascript" else "text/html")
                p.startsWith("/fonts/") || p.startsWith("/img/") || p.startsWith("/maite/social/") -> {
                    val name = p.substringAfterLast('/')
                    asset("social/files/$name", when { name.endsWith(".png") -> "image/png"; name.endsWith(".jpg") -> "image/jpeg"; name.endsWith(".otf") -> "font/otf"; else -> "font/ttf" })
                }
                p.startsWith("/photos/") -> runCatching {
                    val res = Api.client.newCall(Request.Builder().url(u.toString()).build()).execute()
                    WebResourceResponse(res.header("content-type") ?: "image/jpeg", null, res.body!!.byteStream())
                }.getOrNull()
                else -> null
            }
        }
    }

    private suspend fun js(script: String): String = withContext(Dispatchers.Main) {
        val out = CompletableDeferred<String>()
        web!!.evaluateJavascript(script) { out.complete(it ?: "null") }
        out.await()
    }

    /** Draws and returns a bitmap at full size (w × h px) */
    private suspend fun drawNow(call: (Int) -> String): Bitmap = lock.withLock {
        if (web == null) throw IllegalStateException("Renderer not attached")
        withTimeout(20_000) { ready.await() }
        val req = seq.incrementAndGet()
        val done = CompletableDeferred<Pair<Int, Int>>()
        synchronized(waiting) { waiting[req] = done }
        js(call(req))
        val (w, h) = withTimeout(20_000) { done.await() }
        withContext(Dispatchers.Main) {
            val v = web!!
            if (v.height < h) { v.layoutParams = v.layoutParams.apply { height = h }; v.requestLayout() }
            // Wait for the frame with the new drawing before copying it
            val shown = CompletableDeferred<Unit>()
            v.postVisualStateCallback(req.toLong(), object : WebView.VisualStateCallback() { override fun onComplete(requestId: Long) { shown.complete(Unit) } })
            withTimeout(5_000) { shown.await() }
            val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
            v.draw(Canvas(bmp))
            bmp
        }
    }

    private fun q(s: String) = JSONObject.quote(s)
    private fun q(texts: List<String?>?) = texts?.let { org.json.JSONArray(it).toString() } ?: "null"

    /** texts: the post's own words on the image, one per text line of the template (null keeps the template's) */
    suspend fun full(id: String, v: Int, photo: String, texts: List<String?>? = null): Bitmap = drawNow { r -> "draw($r, ${q(id)}, $v, ${q(photo)}, ${q(texts)})" }

    /** A small version for the screens, kept in memory */
    suspend fun thumb(id: String, v: Int, photo: String, texts: List<String?>? = null, width: Int = 420): Bitmap {
        val key = "$id|$v|$photo|${texts?.joinToString("\u0000")}|$width"
        thumbs.get(key)?.let { return it }
        val big = full(id, v, photo, texts)
        val small = Bitmap.createScaledBitmap(big, width, big.height * width / big.width, true)
        if (small !== big) big.recycle()
        thumbs.put(key, small)
        return small
    }

    suspend fun profile(width: Int = 720): Bitmap {
        thumbs.get("profile|$width")?.let { return it }
        val big = drawNow { r -> "drawProfile($r)" }
        val small = Bitmap.createScaledBitmap(big, width, big.height * width / big.width, true)
        thumbs.put("profile|$width", small)
        return small
    }

    /** The words on the image and what the photo shows, for the caption request */
    suspend fun words(id: String, v: Int, photo: String, texts: List<String?>?): Pair<String, String> {
        if (web == null) return "" to ""
        withTimeout(20_000) { ready.await() }
        val raw = js("words(${q(id)}, $v, ${q(photo)}, ${q(texts)})")
        val o = JSONObject(JSONObject("{\"x\":$raw}").getString("x"))
        return o.getString("onImage") to o.getString("photo")
    }

    /** The words on a template that can be changed, as it draws them with variation v (paint.ts, fields) */
    suspend fun fields(id: String, v: Int): List<String> {
        if (web == null) return emptyList()
        withTimeout(20_000) { ready.await() }
        val raw = js("fields(${q(id)}, $v)")
        val a = org.json.JSONArray(JSONObject("{\"x\":$raw}").getString("x"))
        return List(a.length()) { a.getString(it) }
    }

    fun main(block: () -> Unit) { main.post(block) }
}
