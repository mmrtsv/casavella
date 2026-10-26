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
    }
    override fun onResume() { super.onResume(); Auth.attach(this) }
    override fun onNewIntent(intent: Intent) { super.onNewIntent(intent); setIntent(intent); opened(intent) }

    /** A tapped notification (PushService) says which screen to open */
    private fun opened(i: Intent?) {
        if (i == null || (i.flags and Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY) != 0) return
        val type = i.getStringExtra("type") ?: return
        Ui.opening = Opening(type, i.getStringExtra("stay").orEmpty(), i.getStringExtra("id").orEmpty(), i.getStringExtra("date").orEmpty())
    }
}
