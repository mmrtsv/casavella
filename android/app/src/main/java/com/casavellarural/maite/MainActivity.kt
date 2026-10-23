package com.casavellarural.maite

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.casavellarural.maite.data.Auth
import com.casavellarural.maite.ui.MaiteRoot

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        Auth.init(applicationContext)
        Auth.attach(this)
        setContent { MaiteRoot() }
        // The hidden view that draws the Instagram templates
        com.casavellarural.maite.ui.social.Renderer.attach(this)
    }
    override fun onResume() { super.onResume(); Auth.attach(this) }
}
