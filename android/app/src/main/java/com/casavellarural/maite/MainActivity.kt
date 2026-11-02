package com.casavellarural.maite

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
        opened(intent)
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
    override fun onNewIntent(intent: android.content.Intent) { super.onNewIntent(intent); opened(intent) }
    /** A reminder's notification (data/Reminders.kt) opens Xarxes socials on its tab, or Restaurant on Cobrat on its day */
    private fun opened(intent: android.content.Intent?) {
        val tab = intent?.getStringExtra("open") ?: return
        intent.removeExtra("open")
        if (tab.startsWith("cobrat:")) return com.casavellarural.maite.ui.Ui.openRestaurant(tab.removePrefix("cobrat:"), "paid")
        com.casavellarural.maite.ui.social.openSocialTab = tab
        com.casavellarural.maite.ui.Ui.go(com.casavellarural.maite.ui.Page.Social)
    }
    override fun onResume() { super.onResume(); Auth.attach(this) }
}
