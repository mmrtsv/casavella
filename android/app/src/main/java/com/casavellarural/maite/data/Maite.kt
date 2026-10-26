package com.casavellarural.maite.data

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/** One shared store for what Maite reads: stays, settings, calendar entries (loaded by date windows and merged by id). Like store.ts */
object Maite {
    val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    var stays by mutableStateOf<List<Stay>>(emptyList())
    var settings by mutableStateOf<Settings?>(null)
    var bookings by mutableStateOf<Map<String, Booking>>(emptyMap())
    var user by mutableStateOf("")
    var notice by mutableStateOf("")
    var ready by mutableStateOf(false)
    var error by mutableStateOf("")
    var content by mutableStateOf<Content?>(null)
    var social by mutableStateOf<Social?>(null)
    /** The restaurant's tables, loaded by date windows and merged by id (lib/tables.ts) */
    var tables by mutableStateOf<Map<String, Table>>(emptyMap())
    var tablesConfigured by mutableStateOf(true)
    private val tablesLoaded = mutableListOf<Pair<String, String>>()

    private val loaded = mutableListOf<Pair<String, String>>()
    private var extra: Pair<String, String>? = null

    fun stayName(id: String) = stays.find { it.id == id }?.name ?: id
    fun shortName(id: String) = stays.find { it.id == id }?.short ?: stayName(id)
    fun all() = bookings.values.toList()

    suspend fun load(from: String, to: String) {
        val d = Api.get<BookingsResponse>("bookings?from=$from&to=$to")
        val map = bookings.toMutableMap()
        map.entries.removeAll { (_, b) -> b.first < to && b.until > from }
        d.bookings.forEach { map[it.key] = it }
        loaded += from to to
        fun name(id: String) = d.stays.find { it.id == id }?.name ?: id
        val off = d.errors.filter { it.error == "not_configured" }.map { name(it.stay) }
        val bad = d.errors.filter { it.error != "not_configured" }.map { "${name(it.stay)} (${it.error})" }
        stays = d.stays; user = d.user; bookings = map
        notice = listOfNotNull(
            off.takeIf { it.isNotEmpty() }?.let { "Calendari no connectat: ${it.joinToString(", ")}." },
            bad.takeIf { it.isNotEmpty() }?.let { "No s'ha pogut llegir: ${it.joinToString(", ")}." },
        ).joinToString(" ")
    }
    private fun covered(from: String, to: String) = loaded.any { (a, b) -> a <= from && b >= to }
    suspend fun ensure(from: String, to: String) { if (!covered(from, to)) load(from, to) }

    suspend fun reload(window: Pair<String, String>? = null) {
        if (window != null) extra = window
        Today.value = java.time.LocalDate.now().toString()
        // A busy moment at Google or Cloudflare (often right after a save) gets one more try before it shows
        for (attempt in 0..1) {
            loaded.clear()
            try {
                settings = Api.get<Settings>("settings")
                load(addDays(TODAY, -120), addDays(TODAY, 280))
                extra?.let { (a, b) -> if (!covered(a, b)) load(a, b) }
                ready = true; error = ""; return
            } catch (e: ApiError) {
                if (attempt < 1 && e.code != "access") { delay(1200); continue }
                ready = true; error = e.message.orEmpty(); return
            }
        }
    }
    fun refresh() { scope.launch { reload() } }

    fun setBooking(b: Booking) { bookings = bookings + (b.key to b) }
    suspend fun ensureTables(from: String, to: String) {
        if (tablesLoaded.any { (a, b) -> a <= from && b >= to }) return
        tablesLoaded += from to to
        try {
            val d = Api.get<TablesResponse>("restaurant?from=$from&to=$to")
            tables = tables.filterValues { it.date < from || it.date >= to } + d.tables.associateBy { it.id }; tablesConfigured = d.configured
        } catch (e: ApiError) { tablesLoaded.remove(from to to); throw e }
    }
    fun setTable(t: Table) { tables = tables + (t.id to t) }
    /** The next ensureTables reads the calendar again (a new table arrived) */
    fun forgetTables() { tablesLoaded.clear() }
    suspend fun loadContent(): Content { content?.let { return it }; return Api.get<Content>("stays").also { content = it } }
    suspend fun loadSocial(): Social = Api.get<Social>("social").also { social = it }
}
