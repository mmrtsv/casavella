package com.casavellarural.maite

import com.casavellarural.maite.data.addDays
import java.time.LocalDate

/** Realistic answers from /api/maite/... for screenshots: the four stays, bookings around today, settings and social */
object Fake {
    val today: String = LocalDate.now().toString()
    private fun d(n: Int) = addDays(today, n)

    private fun b(id: String, stay: String, a: Int, z: Int, kind: String, name: String, extra: String = "") =
        """{"id":"$id","stay":"$stay","first":"${d(a)}","until":"${d(z)}","kind":"$kind","title":"${if (kind == "block") "Tancat: Obres" else name}","blocks":${kind != "cancelled"},"name":"${if (kind == "block") "" else name}"$extra}"""

    val bookings = listOf(
        b("e1", "montserrat", -2, 1, "paid", "Marta Vila", ""","email":"marta.vila@gmail.com","phone":"+34 639 21 44 80","guests":2,"amount":27900,"settled":true,"source":"web","checkin":"${d(-2)}T16:12:00Z","docs":true,"docsFolder":"https://drive.google.com/x","ref":"07""""),
        b("e2", "la-pineda", 0, 3, "manual", "Jordi Puig", ""","phone":"+34 650 33 12 09","guests":4,"amount":42000,"settled":false,"source":"phone","arrival":"Cap a les 18 h""""),
        b("e3", "les-vinyes", 2, 5, "paid", "Laura Ferrer", ""","email":"laura.ferrer@outlook.com","phone":"+34 617 88 02 41","guests":3,"amount":38500,"settled":true,"source":"web""""),
        b("e4", "figarot", 4, 6, "pending", "Pau Soler", ""","email":"pau.soler@gmail.com","guests":2,"amount":15960,"source":"web""""),
        b("e5", "montserrat", 6, 9, "manual", "Anna Casals", ""","email":"anna.casals@gmail.com","phone":"+34 609 12 77 30","guests":2,"amount":27000,"settled":true,"method":"bizum","source":"whatsapp""""),
        b("e6", "figarot", 9, 12, "block", ""),
        b("e7", "la-pineda", 11, 14, "other", "Família Roca"),
        b("e8", "les-vinyes", 14, 18, "paid", "Núria Batlle", ""","email":"nuria.b@gmail.com","phone":"+34 622 40 19 55","guests":4,"amount":51200,"settled":true,"source":"web""""),
        b("e9", "montserrat", -20, -17, "cancelled", "Marc Riba", ""","amount":27900,"refunded":27900"""),
    )

    private val settings = """{"stays":{"montserrat":{"base":90,"weekend":105},"la-pineda":{"base":90,"weekend":null},"les-vinyes":{"base":95,"weekend":110},"figarot":{"base":70,"weekend":80}},
      "days":{"montserrat":{"${d(8)}":{"price":120,"min":2},"${d(9)}":{"price":120}}},"discounts":[{"nights":2,"pct":5},{"nights":3,"pct":10}],
      "rules":{"minNights":1,"maxNights":30,"minAdvance":0,"maxAdvance":365,"checkin":"15:00","checkout":"11:00"},"cancel":{"fullDays":7,"partialDays":2,"partialPct":50},"policy":"",
      "restaurant":{"online":true,"maxParty":8,"minHours":2,"maxDays":60,"closed":["${d(10)}"],"services":[{"id":"lunch","name":"Dinar","days":[1,2,3,4,5,6,7],"from":"13:00","to":"15:00","seats":30},{"id":"dinner","name":"Sopar","days":[1,2,3,4,5,6,7],"from":"20:00","to":"22:00","seats":30}]}}"""

    private fun t(id: String, day: Int, time: String, people: Int, name: String, extra: String = "") =
        """{"id":"$id","date":"${d(day)}","time":"$time","people":$people,"name":"$name","service":"${if (time < "17:00") "lunch" else "dinner"}"$extra}"""
    val tables = listOf(
        t("t1", 0, "13:30", 4, "Montse Bosch", ""","phone":"+34 646 20 18 77","notes":"Un dels nens és celíac.","source":"web""""),
        t("t2", 0, "14:00", 2, "Xavier Soler", ""","phone":"+34 677 81 30 02","source":"phone""""),
        t("t3", 0, "21:00", 6, "Família Roca", ""","phone":"+34 619 55 41 90","notes":"Aniversari, porten pastís.","source":"whatsapp""""),
        t("t4", 2, "13:00", 3, "Gemma Puig", ""","source":"web""""),
    )

    private val stays = """[{"id":"montserrat","name":"Apartament Montserrat","short":"Montserrat","max":4},{"id":"la-pineda","name":"Apartament La Pineda","short":"La Pineda","max":5},
      {"id":"les-vinyes","name":"Habitació Les Vinyes","short":"Les Vinyes","max":3},{"id":"figarot","name":"Habitació Figarot","short":"Figarot","max":2}]"""

    private val social = """{"posts":[{"id":"grid01","tpl":"PostLogo","v":0,"photo":"","at":"2026-10-21T22:11:40Z","date":"${d(1)}"},{"id":"grid02","tpl":"CarouselSlide","v":0,"photo":"","at":"2026-10-21T22:12:44Z","date":"${d(4)}"},
      {"id":"grid03","tpl":"PostRoom","v":0,"photo":"","at":"2026-10-21T22:25:21Z"},{"id":"grid04","tpl":"PostSplit","v":0,"photo":"","at":"2026-10-21T22:29:15Z"},
      {"id":"grid05","tpl":"PostQuote","v":2,"photo":"","at":"2026-10-21T22:20:53Z"},{"id":"grid06","tpl":"PostGradient","v":1,"photo":"","at":"2026-10-21T22:18:20Z","published":{"at":"${d(-3)}T18:00:00Z","url":"https://www.instagram.com/p/x/"}}],
      "copies":{"grid01":"Hi ha cases que t'esperen. Aquesta ho fa des del 1898.\n\n~\n\nSome houses wait for you.\n\n#LaCasaVella #ElBedorc #Anoia #slowtravel #escapadarural"},"ai":true}"""

    fun answer(method: String, path: String): String? = when {
        path.startsWith("bookings?") -> """{"user":"info@casavellarural.com","stays":$stays,"bookings":[${bookings.joinToString(",")}],"errors":[]}"""
        path == "settings" -> settings
        path.startsWith("restaurant?") -> """{"configured":true,"tables":[${tables.joinToString(",")}]}"""
        path == "social" -> social
        path.startsWith("instagram") -> """{"connected":true,"username":"casavellarural","media":[]}"""
        path.startsWith("payment") -> """{"status":"succeeded","amount":27900,"received":27900,"refunded":0,"created":1792000000,"receipt":"https://pay.stripe.com/r","method":{"type":"card","brand":"visa","last4":"4242","wallet":"google_pay"}}"""
        path == "stays" -> """{"stays":{"montserrat":{"kind":"Apartament","name":"Montserrat","desc":"Dos dormitoris, cuina i sala amb vistes a les vinyes.","feats":[{"icon":"wifi","text":"Wifi gratuït"},{"icon":"bed","text":"2 dormitoris"}],"max":4,"photos":["img/apt-sala.jpg"]},
            "la-pineda":{"kind":"Apartament","name":"La Pineda","desc":"","feats":[],"max":5,"photos":["img/apt-cuina.jpg"]},"les-vinyes":{"kind":"Habitació","name":"Les Vinyes","desc":"","feats":[],"max":3,"photos":["img/hab-llit.jpg"]},
            "figarot":{"kind":"Habitació","name":"Figarot","desc":"","feats":[],"max":2,"photos":["img/hab-balco.jpg"]}},"icons":{"wifi":"<path d='M5 12.55a11 11 0 0 1 14.08 0'/>","bed":"<path d='M2 4v16'/>","star":"<path d='M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z'/>"},"iconNames":{"wifi":"Wifi","bed":"Llit","star":"Estrella"},"library":[],"uploads":true}"""
        path == "emails" -> """{"emails":[{"id":"confirmed","name":"Reserva confirmada","for":"guest","when":"Quan l'hoste paga una reserva a la web.","subject":"La teva reserva a La Casa Vella","html":"<p>Hola Anna</p>","text":"Hola Anna"}]}"""
        else -> null
    }
}
