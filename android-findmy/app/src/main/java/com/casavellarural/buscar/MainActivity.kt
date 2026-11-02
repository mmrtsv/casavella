package com.casavellarural.buscar

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.WindowInsets
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView

/**
 * iCloud.com/find in a WebView. Apple has no public Find My API, so this is the official web app:
 * sign in with the Apple ID (and its two-factor code) once, and the cookies keep the session.
 * Apple and iCloud pages stay inside; any other link opens in the browser.
 */
class MainActivity : Activity() {

    private lateinit var web: WebView
    private lateinit var progress: ProgressBar
    private lateinit var offline: View

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        web = WebView(this)
        progress = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            max = 100
            visibility = View.GONE
        }
        offline = offlineView()

        val root = FrameLayout(this).apply {
            setBackgroundColor(Color.WHITE)
            addView(web, FrameLayout.LayoutParams(-1, -1))
            addView(offline, FrameLayout.LayoutParams(-1, -1))
            addView(progress, FrameLayout.LayoutParams(-1, dp(3)).apply { gravity = Gravity.TOP })
        }
        // From Android 15 the app draws behind the system bars: keep the page clear of them and of the keyboard
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            root.setOnApplyWindowInsetsListener { v, insets ->
                val bars = insets.getInsets(WindowInsets.Type.systemBars() or WindowInsets.Type.ime())
                v.setPadding(bars.left, bars.top, bars.right, bars.bottom)
                WindowInsets.CONSUMED
            }
        }
        setContentView(root)

        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            // The Apple ID sign-in is an idmsa.apple.com frame inside icloud.com
            setAcceptThirdPartyCookies(web, true)
        }

        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            setSupportMultipleWindows(false)
            javaScriptCanOpenWindowsAutomatically = true
            builtInZoomControls = false
            loadWithOverviewMode = true
            useWideViewPort = true
            // Present as Chrome rather than an embedded WebView, which some Apple pages turn away
            userAgentString = userAgentString.replace("; wv", "").replace(Regex(" Version/\\d+\\.\\d+"), "")
        }

        web.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView, newProgress: Int) {
                progress.progress = newProgress
                progress.visibility = if (newProgress < 100) View.VISIBLE else View.GONE
            }
        }

        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val uri = request.url
                if (uri.scheme == "https" && isApple(uri.host)) return false
                openOutside(uri)
                return true
            }

            override fun onPageFinished(view: WebView, url: String?) {
                CookieManager.getInstance().flush()
            }

            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                if (request.isForMainFrame) offline.visibility = View.VISIBLE
            }
        }

        if (savedInstanceState != null) web.restoreState(savedInstanceState)
        if (web.url == null) web.loadUrl(HOME)
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        web.saveState(outState)
    }

    override fun onPause() {
        super.onPause()
        CookieManager.getInstance().flush()
        web.onPause()
    }

    override fun onResume() {
        super.onResume()
        web.onResume()
    }

    override fun onDestroy() {
        web.destroy()
        super.onDestroy()
    }

    @Deprecated("Back still arrives here with targetSdk 35 unless predictive back is enabled")
    override fun onBackPressed() {
        if (web.canGoBack()) web.goBack() else @Suppress("DEPRECATION") super.onBackPressed()
    }

    private fun offlineView(): View = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        gravity = Gravity.CENTER
        setBackgroundColor(Color.WHITE)
        visibility = View.GONE
        addView(TextView(context).apply {
            setText(R.string.offline)
            textSize = 16f
            setTextColor(Color.rgb(0x1C, 0x1C, 0x1E))
            gravity = Gravity.CENTER
        })
        addView(Button(context).apply {
            setText(R.string.retry)
            isAllCaps = false
            setOnClickListener {
                offline.visibility = View.GONE
                if (web.url == null) web.loadUrl(HOME) else web.reload()
            }
        }, LinearLayout.LayoutParams(-2, -2).apply { topMargin = dp(16) })
    }

    private fun openOutside(uri: Uri) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, uri))
        } catch (_: ActivityNotFoundException) {
        }
    }

    private fun dp(v: Int) = (v * resources.displayMetrics.density).toInt()

    companion object {
        const val HOME = "https://www.icloud.com/find"

        private val APPLE = listOf("icloud.com", "apple.com", "icloud-content.com", "cdn-apple.com", "mzstatic.com")

        fun isApple(host: String?): Boolean =
            host != null && APPLE.any { host == it || host.endsWith(".$it") }
    }
}
