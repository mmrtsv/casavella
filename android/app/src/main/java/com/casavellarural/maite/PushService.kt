package com.casavellarural.maite

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.casavellarural.maite.data.Auth
import com.casavellarural.maite.data.Push
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/** Receives what lib/push.js sends (data only: title, body, type, stay, id, date) and shows it. A tap opens that screen. */
class PushService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        Auth.init(applicationContext)
        Push.renewed(token)
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val d = message.data
        val title = d["title"] ?: return
        // Android 13 and later: only if Maite was allowed to (Push.shouldAsk)
        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return
        val nm = NotificationManagerCompat.from(this)
        nm.createNotificationChannel(NotificationChannel(CHANNEL, "Reserves i restaurant", NotificationManager.IMPORTANCE_HIGH))
        // MainActivity reads the extras; one PendingIntent per notification, so each opens its own booking or table
        val open = Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        listOf("type", "stay", "id", "date").forEach { k -> d[k]?.let { open.putExtra(k, it) } }
        val n = (d["type"] + d["id"] + System.currentTimeMillis()).hashCode()
        val tap = PendingIntent.getActivity(this, n, open, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val body = d["body"].orEmpty()
        nm.notify(n, NotificationCompat.Builder(this, CHANNEL)
            .setSmallIcon(R.drawable.ic_launcher_foreground).setColor(ContextCompat.getColor(this, R.color.brand))
            .setContentTitle(title).setContentText(body).setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH).setCategory(NotificationCompat.CATEGORY_EVENT)
            .setContentIntent(tap).setAutoCancel(true).build())
    }

    companion object { const val CHANNEL = "maite" }
}
