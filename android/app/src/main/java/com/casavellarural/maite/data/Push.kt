package com.casavellarural.maite.data

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat
import com.casavellarural.maite.BuildConfig
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * Push notifications through Firebase Cloud Messaging: new bookings, documents, tables and cancellations (lib/push.js).
 * Firebase starts from the values built in (MAITE_FCM_*, no google-services.json); without them there is no push.
 * The phone's token goes to /api/maite/push while someone is signed in, and is removed when they sign out.
 */
object Push {
    val enabled get() = listOf(BuildConfig.FCM_APP_ID, BuildConfig.FCM_API_KEY, BuildConfig.FCM_PROJECT_ID, BuildConfig.FCM_SENDER_ID).all { it.isNotEmpty() }

    private var ready = false
    private var sent: String? = null

    fun init(context: Context) {
        if (!enabled || ready) return
        ready = runCatching {
            if (FirebaseApp.getApps(context).isEmpty()) FirebaseApp.initializeApp(context, FirebaseOptions.Builder()
                .setApplicationId(BuildConfig.FCM_APP_ID).setApiKey(BuildConfig.FCM_API_KEY)
                .setProjectId(BuildConfig.FCM_PROJECT_ID).setGcmSenderId(BuildConfig.FCM_SENDER_ID).build())
            true
        }.getOrDefault(false)
    }

    private suspend fun token(): String = suspendCancellableCoroutine { c ->
        FirebaseMessaging.getInstance().token.addOnCompleteListener { t ->
            if (t.isSuccessful && t.result != null) c.resume(t.result) else c.resumeWithException(t.exception ?: IllegalStateException("fcm"))
        }
    }

    /** After signing in and on every start: the server keeps the token with who is signed in. A failure waits for the next start. */
    suspend fun register(token: String? = null) {
        if (!ready || Api.fake != null || Auth.state != Auth.State.SignedIn) return
        runCatching {
            val t = token ?: token()
            Api.raw("POST", "push", Api.encode(mapOf("token" to t)))
            sent = t
        }
    }

    /** A new token from Firebase while the app may be in the background: sent only if the sign-in is still valid,
     *  since renewing it needs the app open (otherwise the next start sends it) */
    fun renewed(token: String) {
        if (Auth.valid) Maite.scope.launch { register(token) }
    }

    /** Before signing out, so this phone stops getting notifications */
    suspend fun unregister() {
        if (!ready || Api.fake != null) return
        val t = sent ?: runCatching { token() }.getOrNull() ?: return
        runCatching { Api.raw("DELETE", "push", Api.encode(mapOf("token" to t))) }
        // A new token next time, so nothing reaches this one even if the server still had it
        runCatching { FirebaseMessaging.getInstance().deleteToken() }
        sent = null
    }

    /** Android 13 and later ask before showing notifications. Asked once, after signing in; then it's in the phone's settings. */
    fun shouldAsk(context: Context): Boolean {
        if (!ready || Build.VERSION.SDK_INT < 33) return false
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) return false
        val prefs = context.getSharedPreferences("push", Context.MODE_PRIVATE)
        if (prefs.getBoolean("asked", false)) return false
        prefs.edit().putBoolean("asked", true).apply()
        return true
    }
}
