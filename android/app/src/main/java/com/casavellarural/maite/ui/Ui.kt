package com.casavellarural.maite.ui

import androidx.annotation.DrawableRes
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.casavellarural.maite.R

enum class Page(val title: String, @DrawableRes val icon: Int, val hint: String) {
    Home("Inici", R.drawable.ic_house, "El que passa avui i el que falta per fer"),
    Calendar("Calendari", R.drawable.ic_calendar_days, "Ocupació de les properes setmanes"),
    Bookings("Reserves", R.drawable.ic_calendar_days, "El calendari de les properes setmanes i la llista de reserves"),
    Prices("Preus", R.drawable.ic_tag, "Preu per nit, dies especials i descomptes"),
    Stays("Allotjaments", R.drawable.ic_bed_double, "Textos, fotos, preus i normes de cada allotjament"),
    Rules("Normes", R.drawable.ic_scroll_text, "Estada, antelació, horaris i cancel·lació"),
    Emails("Correus", R.drawable.ic_mail, "Els correus que reben els hostes i la casa"),
    Social("Xarxes socials", R.drawable.ic_layout_grid, "Instagram, el pla, la graella i els correus"),
    Restaurant("Restaurant", R.drawable.ic_utensils_crossed, "Taules reservades, dies oberts i places"),
    Analytics("Analítica", R.drawable.ic_chart_column, "Ingressos, despeses i benefici brut"),
    Chat("Pregunta", R.drawable.ic_message_circle, "Pregunta a Claude sobre la casa"),
}

data class BookDraft(val stay: String? = null, val first: String? = null, val until: String? = null)
/** What a tapped notification points to (lib/push.js): type booking, docs or cancelled (stay and id), table (date) or event */
data class Opening(val type: String, val stay: String, val id: String, val date: String)
data class BlockDraft(val stays: List<String> = emptyList(), val first: String? = null, val until: String? = null)

/** Which page and which window is open (booking file, new booking, close dates, cancel, search), like lib/ui.ts */
object Ui {
    var page by mutableStateOf(Page.Home)
    var detail by mutableStateOf<String?>(null)
    var book by mutableStateOf<BookDraft?>(null)
    var block by mutableStateOf<BlockDraft?>(null)
    var cancel by mutableStateOf<String?>(null)
    var search by mutableStateOf(false)
    var more by mutableStateOf(false)
    var keys by mutableStateOf(false)
    var bookingsFilter by mutableStateOf("")
    var restaurantDay by mutableStateOf("")
    var restaurantTab by mutableStateOf("")
    var restaurantMenu by mutableStateOf("")
    var opening by mutableStateOf<Opening?>(null)
    /** The tab Allotjaments, Reserves or Analítica opens on, and Preus's own tab inside Allotjaments, taken once */
    var pageTab by mutableStateOf("")
    var pricesTab by mutableStateOf("")

    fun go(p: Page) {
        // Calendari is a tab of Reserves; Preus and Normes of Allotjaments; Correus of Xarxes socials
        page = when (p) {
            Page.Calendar -> { pageTab = "calendar"; Page.Bookings }
            Page.Prices -> { pageTab = "prices"; Page.Stays }
            Page.Rules -> { pageTab = "rules"; Page.Stays }
            Page.Emails -> { com.casavellarural.maite.ui.social.openSocialTab = "emails"; Page.Social }
            else -> p
        }
        more = false
    }
    fun openBookings(filter: String) { bookingsFilter = filter; pageTab = "list"; go(Page.Bookings) }
    /** Calendari opens Restaurant on a day, and Inici (or a notification) on Cobrat on a day with tables to note; the page takes them once */
    fun openRestaurant(date: String, tab: String = "tables") { restaurantDay = date; restaurantTab = tab; go(Page.Restaurant) }
    /** Publicar (or a WhatsApp reminder) opens Restaurant › Menús, where menus are made and changed: on a menu's post, or on the list */
    fun openRestaurantMenu(id: String = "") { restaurantMenu = id; restaurantTab = "menus"; go(Page.Restaurant) }
    fun openCancel(key: String) { cancel = key; detail = null }
    /** A page, the tab on it and what to open there, as Pregunta's proposals give them (lib/chat.js), like openAt in lib/ui.ts.
     *  Normes and Correus are tabs of Allotjaments and Xarxes socials */
    fun openAt(name: String, tab: String = "", item: String = "") {
        when (name) {
            "social" -> { if (tab.isNotEmpty()) com.casavellarural.maite.ui.social.openSocialTab = tab; go(Page.Social) }
            "restaurant" -> if (tab == "menus") openRestaurantMenu(item) else openRestaurant(item, tab.ifEmpty { "tables" })
            "bookings" -> { if (tab == "calendar" || tab.isEmpty()) go(Page.Calendar) else openBookings(tab); if (item.isNotEmpty()) detail = item }
            "calendar" -> go(Page.Calendar)
            "prices" -> { pricesTab = tab; go(Page.Prices) }
            "stays" -> { pageTab = tab; if (tab == "prices") pricesTab = item; go(Page.Stays) }
            "analytics" -> { pageTab = tab; go(Page.Analytics) }
            "rules" -> go(Page.Rules)
            "emails" -> go(Page.Emails)
            else -> Page.entries.find { it.name.equals(name, ignoreCase = true) }?.let { go(it) }
        }
    }
    /** Back: closes the top window, then goes to Inici; false lets Android leave the app */
    fun back(): Boolean = when {
        keys -> { keys = false; true }
        search -> { search = false; true }
        cancel != null -> { cancel = null; true }
        book != null -> { book = null; true }
        block != null -> { block = null; true }
        detail != null -> { detail = null; true }
        more -> { more = false; true }
        page != Page.Home -> { page = Page.Home; true }
        else -> false
    }
}
