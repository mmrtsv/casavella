package com.casavellarural.maite

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onRoot
import com.casavellarural.maite.data.Api
import com.casavellarural.maite.data.Auth
import com.casavellarural.maite.data.Maite
import com.casavellarural.maite.data.Today
import com.casavellarural.maite.ui.MaiteRoot
import com.casavellarural.maite.ui.Page
import com.casavellarural.maite.ui.Ui
import com.github.takahirom.roborazzi.captureRoboImage
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/** Every screen at the two phones' sizes: Titan 2 Elite (1080 × 1200, about 411 × 457 dp) and a Xiaomi (1080 × 2400, about 393 × 873 dp) */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
abstract class Shots(private val device: String) {
    @get:Rule val compose = createComposeRule()

    @Before fun setUp() {
        Today.value = Fake.today
        Api.fake = { m, p, _ -> Fake.answer(m, p) }
        Auth.state = Auth.State.SignedIn
        Ui.page = Page.Home; Ui.detail = null; Ui.book = null; Ui.block = null; Ui.search = false; Ui.more = false; Ui.dark = false
        Maite.ready = false; Maite.content = null; Maite.social = null
    }

    private fun shot(name: String, dark: Boolean = false, setup: () -> Unit = {}) {
        Ui.dark = dark
        setup()
        compose.setContent { MaiteRoot() }
        compose.waitUntil(5_000) { Maite.ready }
        repeat(4) { compose.mainClock.advanceTimeBy(1000); compose.waitForIdle() }
        compose.onRoot().captureRoboImage("screenshots/$device/$name.png")
    }

    @Test fun home() = shot("01-inici")
    @Test fun homeDark() = shot("02-inici-fosc", dark = true)
    @Test fun calendar() = shot("03-calendari") { Ui.page = Page.Calendar }
    @Test fun bookings() = shot("04-reserves") { Ui.page = Page.Bookings }
    @Test fun file() = shot("05-fitxa") { Ui.page = Page.Bookings; Ui.detail = "montserrat|e1" }
    @Test fun fileBooking() = shot("06-fitxa-directa") { Ui.page = Page.Bookings; Ui.detail = "la-pineda|e2" }
    @Test fun newBooking() = shot("07-nova-reserva") { Ui.page = Page.Calendar; Ui.book = com.casavellarural.maite.ui.BookDraft("montserrat", Fake.today, com.casavellarural.maite.data.addDays(Fake.today, 2)) }
    @Test fun prices() = shot("08-preus") { Ui.page = Page.Prices }
    @Test fun discounts() = shot("09-descomptes") { Ui.page = Page.Discounts }
    @Test fun rules() = shot("10-normes") { Ui.page = Page.Rules }
    @Test fun stays() = shot("11-allotjaments") { Ui.page = Page.Stays }
    @Test fun more() = shot("12-mes") { Ui.more = true }
    @Test fun search() = shot("13-cerca") { Ui.search = true }
    @Test fun social() = shot("14-xarxes") { Ui.page = Page.Social }
}

@Config(qualifiers = "w411dp-h457dp-xxhdpi", sdk = [34])
class TitanShots : Shots("titan")

@Config(qualifiers = "w393dp-h873dp-xxhdpi", sdk = [34])
class XiaomiShots : Shots("xiaomi")
