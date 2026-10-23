package com.casavellarural.maite.data

import android.content.Context
import android.content.Intent
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.core.content.FileProvider
import com.casavellarural.maite.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import okhttp3.Request
import java.io.File

/** New versions of the app: android/tools/release.mjs puts the APK and version.json in maite-app/public/android/, so they
 *  are published with Maite (behind Cloudflare Access, which lets the app through). Home offers the update. */
object Update {
    @Serializable data class Info(val versionCode: Int, val version: String, val notes: String = "")

    var available by mutableStateOf<Info?>(null); private set

    suspend fun check() {
        val info = runCatching { json.decodeFromString(Info.serializer(), Api.raw("GET", "${Api.base}/maite/android/version.json")) }.getOrNull()
        available = info?.takeIf { it.versionCode > BuildConfig.VERSION_CODE }
    }

    /** Downloads the APK and hands it to Android's installer, which asks before replacing the app */
    suspend fun install(context: Context) {
        val dir = File(context.cacheDir, "updates").apply { mkdirs() }
        val apk = File(dir, "Maite.apk")
        withContext(Dispatchers.IO) {
            Api.client.newCall(Request.Builder().url("${Api.base}/maite/android/Maite.apk").build()).execute().use { r ->
                if (!r.isSuccessful) throw ApiError("No s'ha pogut baixar la versió nova (error ${r.code}).", "update")
                apk.outputStream().use { r.body!!.byteStream().copyTo(it) }
            }
        }
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.files", apk)
        context.startActivity(Intent(Intent.ACTION_VIEW).setDataAndType(uri, "application/vnd.android.package-archive")
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK))
    }
}
