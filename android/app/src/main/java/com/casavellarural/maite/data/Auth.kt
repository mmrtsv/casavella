package com.casavellarural.maite.data

import android.app.Activity
import android.content.Context
import android.content.SharedPreferences
import android.util.Base64
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.casavellarural.maite.BuildConfig
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.serialization.Serializable
import java.lang.ref.WeakReference

/**
 * Sign-in: the Google account on the phone (Android's own account picker), and the app's Cloudflare Access service token.
 * The connection values come built in, or once as a "connection code" (base64 JSON { id, secret, google }) pasted in the app.
 */
object Auth {
    @Serializable data class Config(val cfId: String = "", val cfSecret: String = "", val google: String = "") {
        val ready get() = cfId.isNotEmpty() && cfSecret.isNotEmpty() && google.isNotEmpty()
    }
    @Serializable private data class Code(val id: String = "", val secret: String = "", val google: String = "")

    var config by mutableStateOf(Config(BuildConfig.CF_CLIENT_ID, BuildConfig.CF_CLIENT_SECRET, BuildConfig.GOOGLE_CLIENT_ID))
        private set
    var email by mutableStateOf("")
        private set
    var state by mutableStateOf(State.Unknown)
    enum class State { Unknown, NeedsConfig, SignedOut, SignedIn }

    @Volatile var idToken: String? = null
        private set
    private var expires = 0L
    /** Signed in with a token that still works for a few minutes, so a call needs no renewal (which needs the app open) */
    val valid get() = state == State.SignedIn && idToken != null && System.currentTimeMillis() < expires - 5 * 60_000
    private var prefs: SharedPreferences? = null
    private var activity = WeakReference<Activity>(null)
    private val lock = Mutex()

    fun init(context: Context) {
        if (prefs != null) return
        prefs = runCatching {
            val key = MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build()
            EncryptedSharedPreferences.create(context, "maite", key, EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV, EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM)
        }.getOrElse { context.getSharedPreferences("maite-plain", Context.MODE_PRIVATE) }
        val p = prefs!!
        if (!config.ready) config = Config(p.getString("cfId", "")!!, p.getString("cfSecret", "")!!, p.getString("google", "")!!)
        email = p.getString("email", "")!!
        idToken = p.getString("token", null); expires = p.getLong("expires", 0)
        state = when { !config.ready -> State.NeedsConfig; email.isEmpty() -> State.SignedOut; else -> State.SignedIn }
    }
    fun attach(a: Activity) { activity = WeakReference(a) }

    /** Accepts the connection code; false if it doesn't read as one */
    fun useCode(text: String): Boolean {
        val c = runCatching { json.decodeFromString(Code.serializer(), String(Base64.decode(text.trim(), Base64.DEFAULT))) }.getOrNull() ?: return false
        if (c.id.isEmpty() || c.secret.isEmpty() || c.google.isEmpty()) return false
        config = Config(c.id, c.secret, c.google)
        prefs?.edit()?.putString("cfId", c.id)?.putString("cfSecret", c.secret)?.putString("google", c.google)?.apply()
        state = State.SignedOut
        return true
    }

    private fun exp(token: String): Long = runCatching {
        val body = String(Base64.decode(token.split(".")[1], Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP))
        Regex("\"exp\"\\s*:\\s*(\\d+)").find(body)!!.groupValues[1].toLong() * 1000
    }.getOrDefault(0)

    private fun keep(token: String, mail: String) {
        idToken = token; expires = exp(token); email = mail
        prefs?.edit()?.putString("token", token)?.putLong("expires", expires)?.putString("email", mail)?.apply()
    }

    /** Asks Google for a token: silently for the account already chosen, or with the picker */
    private suspend fun request(silent: Boolean): Boolean {
        val a = activity.get() ?: return false
        val option = GetGoogleIdOption.Builder().setServerClientId(config.google)
            .setFilterByAuthorizedAccounts(silent).setAutoSelectEnabled(silent).build()
        val res = CredentialManager.create(a).getCredential(a, GetCredentialRequest.Builder().addCredentialOption(option).build())
        val cred = res.credential
        if (cred !is CustomCredential || cred.type != GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) return false
        val g = GoogleIdTokenCredential.createFrom(cred.data)
        keep(g.idToken, g.id)
        return true
    }

    suspend fun signIn(): String? = try {
        if (request(silent = false)) { state = State.SignedIn; null } else "No s'ha pogut entrar amb Google"
    } catch (e: Exception) { e.message ?: "No s'ha pogut entrar amb Google" }

    /** Before a call: a token that ends in less than five minutes is renewed without asking */
    suspend fun fresh() {
        if (Api.fake != null || !config.ready || state != State.SignedIn) return
        if (System.currentTimeMillis() < expires - 5 * 60_000) return
        renew()
    }
    suspend fun renew(): Boolean = lock.withLock {
        if (System.currentTimeMillis() < expires - 5 * 60_000 && idToken != null) return true
        runCatching { request(silent = true) }.getOrDefault(false)
    }

    fun signedOut() { if (state == State.SignedIn) state = State.SignedOut }
    suspend fun signOut() {
        Push.unregister()
        activity.get()?.let { runCatching { CredentialManager.create(it).clearCredentialState(ClearCredentialStateRequest()) } }
        idToken = null; expires = 0; email = ""
        prefs?.edit()?.remove("token")?.remove("email")?.remove("expires")?.apply()
        state = if (config.ready) State.SignedOut else State.NeedsConfig
    }
}
