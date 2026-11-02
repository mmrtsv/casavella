package com.casavellarural.maite.data

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.casavellarural.maite.MainActivity
import com.casavellarural.maite.R
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

/**
 * Reminders on the phone, so the owner doesn't have to remember: send a menu to her WhatsApp broadcast list (when it goes out,
 * and again two days before its last day), and post a story with its link sticker by hand when nothing posts it on its own.
 * They are worked out from the plan each time Xarxes socials loads (ui/social/Social.kt) and set as alarms here; the phone shows
 * them even with the app closed. Tapping one opens Maite on the right tab. Nothing leaves the phone.
 */
object Reminders {
    private const val CHANNEL = "recordatoris"
    private val BCN: ZoneId = ZoneId.of("Europe/Madrid")
    /** The alarms set last time, to take away the ones no longer needed */
    private const val PREFS = "reminders"

    private data class One(val key: String, val at: Long, val title: String, val text: String, val tab: String)

    fun schedule(context: Context, social: Social, storiesGoAlone: Boolean) {
        val now = System.currentTimeMillis()
        val list = mutableListOf<One>()
        for (p in social.posts) {
            val m = p.menu as? JsonObject ?: continue
            if (p.story || p.pack != null) continue
            val title = listOfNotNull(m["kicker"]?.jsonPrimitive?.content, m["title"]?.jsonPrimitive?.content).filter { it.isNotBlank() }.joinToString(" ").ifEmpty { "El menú" }
            val launch = (p.published?.at ?: p.schedule?.at)?.let { runCatching { Instant.parse(it).toEpochMilli() }.getOrNull() } ?: continue
            val sent = p.whatsapp?.at?.let { runCatching { Instant.parse(it).toEpochMilli() }.getOrNull() }
            val last = (m["until"]?.jsonPrimitive?.content?.takeIf { it.isNotEmpty() } ?: m["from"]?.jsonPrimitive?.content)?.let { runCatching { LocalDate.parse(it) }.getOrNull() }
            // When it goes out (half an hour after), if it hasn't been sent yet
            if (sent == null && (last == null || !last.isBefore(LocalDate.now(BCN))))
                list += One("wa1:${p.id}", maxOf(launch + 30 * 60_000L, now + 60_000L), "Envia $title per WhatsApp", "Toca per obrir-lo a Maite i enviar-lo a la llista de difusió.", "menus")
            // Two days before the last day, at 11:00, if the last send was more than four days before
            if (last != null) {
                val at = last.minusDays(2).atTime(11, 0).atZone(BCN).toInstant().toEpochMilli()
                if (at > now && (sent == null || sent < at - 4 * 86_400_000L))
                    list += One("wa2:${p.id}", at, "Recorda $title a la llista de WhatsApp", "Queden pocs dies. Toca per obrir-lo a Maite i tornar-lo a enviar.", "menus")
            }
        }
        // Stories that wait for her to post them with the link sticker (when nothing posts them on its own)
        if (!storiesGoAlone) for (p in social.posts) {
            if (!p.story || p.published != null || p.hand == null || p.link == null) continue
            val at = p.schedule?.at?.let { runCatching { Instant.parse(it).toEpochMilli() }.getOrNull() } ?: continue
            if (at > now) list += One("st:${p.id}", at, "Story per penjar", (p.auto?.why ?: "Una story del pla") + ". Toca per penjar-la amb l'enllaç.", "plan")
        }
        val alarms = context.getSystemService(AlarmManager::class.java)
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val before = prefs.getStringSet("keys", emptySet()).orEmpty()
        for (gone in before - list.map { it.key }.toSet()) alarms.cancel(pending(context, gone, null))
        for (r in list) alarms.set(AlarmManager.RTC_WAKEUP, r.at, pending(context, r.key, r))
        prefs.edit().putStringSet("keys", list.map { it.key }.toSet()).apply()
    }

    /** A test reminder in a minute, to see that they reach this phone (Com planifica, Prova un avís) */
    fun test(context: Context) {
        val r = One("test", System.currentTimeMillis() + 60_000L, "Prova de Maite", "Així t'arribaran els avisos: menús per enviar per WhatsApp i stories per penjar.", "plan")
        context.getSystemService(AlarmManager::class.java).set(AlarmManager.RTC_WAKEUP, r.at, pending(context, r.key, r))
    }

    private fun pending(context: Context, key: String, r: One?): PendingIntent {
        val i = Intent(context, ReminderReceiver::class.java).setAction("maite.reminder.$key")
        if (r != null) i.putExtra("key", r.key).putExtra("title", r.title).putExtra("text", r.text).putExtra("tab", r.tab)
        return PendingIntent.getBroadcast(context, key.hashCode(), i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    fun show(context: Context, key: String, title: String, text: String, tab: String) {
        val nm = context.getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(NotificationChannel(CHANNEL, "Recordatoris", NotificationManager.IMPORTANCE_HIGH).apply { description = "Menús per enviar per WhatsApp i stories per penjar" })
        val open = PendingIntent.getActivity(context, key.hashCode(), Intent(context, MainActivity::class.java).putExtra("open", tab).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val n = NotificationCompat.Builder(context, CHANNEL).setSmallIcon(R.drawable.ic_message_circle).setContentTitle(title).setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text)).setContentIntent(open).setAutoCancel(true).setPriority(NotificationCompat.PRIORITY_HIGH).build()
        runCatching { NotificationManagerCompat.from(context).notify(key.hashCode(), n) } // without the permission, nothing shows
    }
}

/** An alarm set by Reminders: shows its notification */
class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        Reminders.show(context, intent.getStringExtra("key") ?: return, intent.getStringExtra("title").orEmpty(), intent.getStringExtra("text").orEmpty(), intent.getStringExtra("tab") ?: "plan")
    }
}
