package com.casavellarural.maite

import android.content.Intent
import android.os.Bundle
import android.graphics.Color
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.casavellarural.maite.data.Auth
import com.casavellarural.maite.ui.MaiteRoot
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import com.casavellarural.maite.ui.Opening
import com.casavellarural.maite.ui.Ui

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Light only: dark icons on the bars even when the phone is in dark mode
        enableEdgeToEdge(SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT), SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT))
        Auth.init(applicationContext)
        Auth.attach(this)
        setContent { MaiteRoot() }
        // The hidden view that draws the Instagram templates
        com.casavellarural.maite.ui.social.Renderer.attach(this)
        if (savedInstanceState == null) opened(intent)
        // The reminders follow the plan each time the app opens, not only when Xarxes socials is visited (data/Reminders.kt)
        lifecycleScope.launch {
            kotlinx.coroutines.delay(4000)
            runCatching {
                val r = com.casavellarural.maite.data.Api.get<com.casavellarural.maite.data.PlanResponse>("plan")
                com.casavellarural.maite.data.Maite.social = r.social
                com.casavellarural.maite.data.Reminders.schedule(applicationContext, r.social, r.plan.bot?.alive == true)
            }
            // Tables to note, the morning after each restaurant day (from yesterday to two months out)
            runCatching {
                val from = com.casavellarural.maite.data.addDays(com.casavellarural.maite.data.TODAY, -1)
                val to = com.casavellarural.maite.data.addDays(com.casavellarural.maite.data.TODAY, 60)
                val t = com.casavellarural.maite.data.Api.get<com.casavellarural.maite.data.TablesResponse>("restaurant?from=$from&to=$to")
                com.casavellarural.maite.data.Reminders.scheduleTables(applicationContext, t.tables, from, to)
            }
        }
    }
    override fun onResume() {
        super.onResume(); Auth.attach(this)
        // Back to the app: a version published meanwhile is asked for at once (data/Update.kt)
        lifecycleScope.launch { com.casavellarural.maite.data.Update.check() }
    }
    override fun onNewIntent(intent: Intent) { super.onNewIntent(intent); setIntent(intent); opened(intent) }

    /** A tapped notification says which screen to open: a reminder set on the phone (data/Reminders.kt, extra open: a tab of
     *  Xarxes socials, or cobrat:<day>) or a push from the server (PushService, extra type, and open for Xarxes socials) */
    private fun opened(i: Intent?) {
        if (i == null || (i.flags and Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY) != 0) return
        i.getStringExtra("open")?.let { tab ->
            i.removeExtra("open")
            if (tab.startsWith("cobrat:")) return Ui.openRestaurant(tab.removePrefix("cobrat:"), "paid")
            com.casavellarural.maite.ui.social.openSocialTab = tab
            return Ui.go(com.casavellarural.maite.ui.Page.Social)
        }
        val type = i.getStringExtra("type") ?: return
        i.removeExtra("type")
        Ui.opening = Opening(type, i.getStringExtra("stay").orEmpty(), i.getStringExtra("id").orEmpty(), i.getStringExtra("date").orEmpty())
    }
}
