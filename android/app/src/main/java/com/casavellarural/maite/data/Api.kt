package com.casavellarural.maite.data

import com.casavellarural.maite.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.Call
import okhttp3.Callback
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import java.io.IOException
import java.util.concurrent.TimeUnit
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class ApiError(message: String, val code: String = "") : Exception(message)

val json = Json { ignoreUnknownKeys = true; explicitNulls = false; encodeDefaults = true; coerceInputValues = true }

/** The same calls to /api/maite/... as the web; errors become the same Catalan messages */
object Api {
    val base: String get() = BuildConfig.BASE_URL
    private val host get() = base.removePrefix("https://")

    // Cloudflare Access lets the app through with its service token; the server learns who it is from the Google ID token
    private val auth = Interceptor { chain ->
        val req = chain.request()
        if (req.url.host != host) return@Interceptor chain.proceed(req)
        val c = Auth.config
        val b = req.newBuilder()
        if (c.cfId.isNotEmpty()) b.header("CF-Access-Client-Id", c.cfId).header("CF-Access-Client-Secret", c.cfSecret)
        Auth.idToken?.let { b.header("x-maite-google", it) }
        chain.proceed(b.build())
    }

    val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS).readTimeout(90, TimeUnit.SECONDS).writeTimeout(90, TimeUnit.SECONDS)
        .addInterceptor(auth).build()

    /** Fake answers for screenshots and previews; null goes to the network */
    var fake: ((method: String, path: String, body: String?) -> String?)? = null

    suspend fun raw(method: String, path: String, body: String? = null, bytes: ByteArray? = null, type: String = "application/json"): String {
        fake?.invoke(method, path, body)?.let { return it }
        Auth.fresh()
        val url = if (path.startsWith("http")) path else "$base/api/maite/$path"
        fun build() = Request.Builder().url(url).method(method, when {
            bytes != null -> bytes.toRequestBody(type.toMediaType())
            body != null -> body.toRequestBody("application/json".toMediaType())
            method == "POST" || method == "PUT" -> ByteArray(0).toRequestBody(null)
            else -> null
        }).build()
        var res = client.newCall(build()).await()
        // An expired Google token (or Access session) gets one silent renewal and a second try
        if (res.code == 401 || res.code == 403) { res.close(); if (Auth.renew()) res = client.newCall(build()).await() }
        val text = withContext(Dispatchers.IO) { res.body?.string().orEmpty() }
        if (!res.isSuccessful) {
            val e = runCatching { json.decodeFromString(ErrorBody.serializer(), text) }.getOrNull()
            if (res.code == 401 || text.contains("cloudflareaccess")) { Auth.signedOut(); throw ApiError(ERRORS.getValue("access"), "access") }
            var msg = ERRORS[e?.error] ?: e?.detail?.let { d -> "Error: " + ((d as? JsonPrimitive)?.content ?: d.toString()) }
                ?: "Alguna cosa no ha anat bé (error ${res.code}). Torna-ho a provar."
            if (e != null && e.with.isNotEmpty()) msg += ": " + e.with.joinToString("; ") { b -> "${Maite.stayName(b.stay)}, ${if (b.kind == "block") "tancat" else b.name.ifEmpty { b.title }} (${range(b.first, b.until)})" }
            throw ApiError(msg, e?.error.orEmpty())
        }
        return text
    }

    suspend inline fun <reified T> get(path: String): T = json.decodeFromString(raw("GET", path))
    suspend inline fun <reified T> post(path: String, body: Any? = null): T = json.decodeFromString(raw("POST", path, encode(body)))
    suspend inline fun <reified T> put(path: String, body: Any? = null): T = json.decodeFromString(raw("PUT", path, encode(body)))

    fun encode(body: Any?): String? = when (body) {
        null -> null
        is String -> body
        is kotlinx.serialization.json.JsonElement -> body.toString()
        is Map<*, *> -> toJson(body).toString()
        else -> error("Unsupported body")
    }

    /** Builds a JSON object from plain Kotlin maps, lists and values */
    fun toJson(v: Any?): kotlinx.serialization.json.JsonElement = when (v) {
        null -> kotlinx.serialization.json.JsonNull
        is kotlinx.serialization.json.JsonElement -> v
        is Map<*, *> -> kotlinx.serialization.json.JsonObject(v.entries.associate { (k, x) -> k.toString() to toJson(x) })
        is Iterable<*> -> kotlinx.serialization.json.JsonArray(v.map { toJson(it) })
        is Boolean -> JsonPrimitive(v)
        is Number -> JsonPrimitive(v)
        else -> JsonPrimitive(v.toString())
    }
}

suspend fun Call.await(): Response = suspendCancellableCoroutine { cont ->
    enqueue(object : Callback {
        override fun onFailure(call: Call, e: IOException) { if (!cont.isCancelled) cont.resumeWithException(ApiError("No hi ha connexió. Torna-ho a provar.", "network")) }
        override fun onResponse(call: Call, response: Response) { cont.resume(response) }
    })
    cont.invokeOnCancellation { runCatching { cancel() } }
}

fun JsonPrimitive.str() = this.jsonPrimitive.content
