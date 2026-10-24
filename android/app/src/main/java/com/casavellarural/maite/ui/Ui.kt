package com.casavellarural.maite.ui

import androidx.annotation.DrawableRes
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.casavellarural.maite.R

enum class Page(val title: String, @DrawableRes val icon: Int, val hint: String) {
    Home("Inici", R.drawable.ic_house, "El que passa avui i el que falta per fer"),
    Calendar("Calendari", R.drawable.ic_calendar_days, "Ocupació de les properes setmanes"),
    Bookings("Reserves", R.drawable.ic_table_2, "Totes les reserves i la seva llista"),
    Prices("Preus", R.drawable.ic_tag, "Preu per nit, dies especials i descomptes"),
    Stays("Allotjaments", R.drawable.ic_bed_double, "Textos, capacitat i fotos de la web"),
    Rules("Normes", R.drawable.ic_scroll_text, "Estada, antelació, horaris i cancel·lació"),
    Emails("Correus", R.drawable.ic_mail, "Els correus que reben els hostes i la casa"),
    Social("Xarxes socials", R.drawable.ic_layout_grid, "Plantilles d'Instagram, la graella del perfil i els copies"),
    Restaurant("Restaurant", R.drawable.ic_utensils_crossed, "Taules reservades, dies oberts i places"),
}

data class BookDraft(val stay: String? = null, val first: String? = null, val until: String? = null)
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

    fun go(p: Page) { page = p; more = false }
    fun openBookings(filter: String) { bookingsFilter = filter; go(Page.Bookings) }
    fun openCancel(key: String) { cancel = key; detail = null }
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
