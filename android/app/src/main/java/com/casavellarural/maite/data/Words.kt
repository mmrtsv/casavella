package com.casavellarural.maite.data

// Labels and rules, as in maite-app/src/lib/words.ts
val KIND = mapOf("paid" to "Pagada a la web", "pending" to "Pendent del banc", "manual" to "Reserva directa", "block" to "Tancat",
    "cancelled" to "Cancel·lada", "refunded" to "Reemborsada", "other" to "Google Calendar")
val SOURCE = mapOf("calendar" to "Google Calendar", "web" to "Web", "phone" to "Telèfon", "whatsapp" to "WhatsApp", "email" to "Correu", "door" to "En persona", "other" to "Altres")
val METHOD = linkedMapOf("cash" to "Efectiu", "transfer" to "Transferència", "bizum" to "Bizum", "card" to "Targeta (TPV)", "other" to "Altres")
val PAYTYPE = mapOf("card" to "Targeta", "sepa_debit" to "Domiciliació SEPA", "customer_balance" to "Transferència", "bancontact" to "Bancontact",
    "ideal" to "iDEAL", "paypal" to "PayPal", "klarna" to "Klarna", "link" to "Link", "revolut_pay" to "Revolut Pay", "amazon_pay" to "Amazon Pay")
val WALLET = mapOf("apple_pay" to "Apple Pay", "google_pay" to "Google Pay", "samsung_pay" to "Samsung Pay", "link" to "Link")
val SOURCES = listOf("phone" to "Telèfon", "whatsapp" to "WhatsApp", "email" to "Correu", "door" to "En persona", "other" to "Altres")

val ERRORS = mapOf(
    "unavailable" to "Aquestes nits ja estan ocupades", "dates" to "Revisa les dates", "name" to "Falta el nom", "stay" to "Tria un allotjament",
    "amount" to "L'import no és vàlid", "rules" to "Revisa les normes: algun valor no és vàlid",
    "cancel" to "Revisa la política: els dies del retorn parcial han de ser menys que els del retorn complet",
    "min" to "Revisa l'estada mínima", "max" to "Revisa la capacitat", "photos" to "Cal almenys una foto", "type" to "Aquest format d'imatge no es pot pujar",
    "size" to "La foto és massa gran", "pending" to "El banc encara no ha confirmat aquest pagament. Espera que es confirmi per cancel·lar-la.",
    "refund_amount" to "No es pot retornar més del que es va pagar", "not_configured" to "Aquest allotjament no té el calendari connectat",
    "no_payment" to "No trobo el pagament a Stripe", "access" to "La sessió ha caducat. Torna a entrar.",
    "discount" to "Revisa els descomptes: de 2 nits en amunt, entre 1 i 90 %, sense repetir nits", "price" to "Revisa els preus",
    "email" to "Revisa el correu", "note" to "Escriu el motiu", "doc_type" to "Només es poden pujar fotos (JPG, PNG, HEIC) o PDF",
    "restaurant" to "Revisa els horaris del restaurant: cada servei necessita nom, algun dia, les hores i les places",
    "restaurant_not_configured" to "Falta connectar el calendari del restaurant (CAL_RESTAURANT)", "calendar" to "Google Calendar no deixa llegir el calendari del restaurant: comprova que CAL_RESTAURANT és l'ID bo i que el calendari està compartit amb el compte de servei amb permís per fer canvis", "time" to "Revisa l'hora", "people" to "Revisa el nombre de persones",
    "doc_size" to "El document és massa gran (màxim 15 MB)", "docs_not_configured" to "Falta connectar la carpeta de Google Drive dels documents",
    "drive" to "Google Drive no ha deixat desar el document", "social_full" to "La graella ja té 150 posts: treu-ne algun abans de confirmar-ne més",
    "ai_busy" to "Massa peticions seguides. Espera un moment i torna-ho a provar.", "ai_not_configured" to "Falta la clau de Claude (ANTHROPIC_API_KEY)",
    "ai" to "Claude no ha pogut escriure el copy", "ai_make" to "Claude no ha pogut fer el post. Torna-ho a provar.", "ig_not_configured" to "Falta connectar el compte d'Instagram", "ig_published" to "Aquest post ja està publicat",
)

fun isBooking(b: Booking) = b.kind == "paid" || b.kind == "pending" || b.kind == "manual"
fun atHome(b: Booking) = b.checkin.isNotEmpty() && b.checkout.isEmpty()
fun hasDocs(b: Booking) = b.docs && b.docsFolder.isNotEmpty()
fun who(b: Booking) = when (b.kind) { "block" -> b.title.ifEmpty { "Tancat" }; "other" -> b.title; else -> b.name.ifEmpty { b.title } }

data class Check(val k: String, val label: String, val ok: Boolean)
fun checklist(b: Booking) = listOf(
    Check("pay", "Pagament", b.kind == "paid" || (b.kind == "manual" && b.settled)),
    Check("email", "Correu", b.email.isNotEmpty()),
    Check("phone", "Telèfon", b.phone.isNotEmpty()),
    Check("docs", "Documents", hasDocs(b)),
    Check("checkin", "Check-in", b.checkin.isNotEmpty()),
    Check("checkout", "Check-out", b.checkout.isNotEmpty()),
)
/** What already matters: the paperwork always, the check-in from arrival day, the check-out from departure day */
fun dueList(b: Booking): List<Check> {
    val due = mapOf("pay" to true, "email" to true, "phone" to true, "docs" to true, "checkin" to (b.first <= TODAY), "checkout" to (b.until <= TODAY))
    return checklist(b).filter { it.ok || due[it.k] == true }
}
fun missing(b: Booking) = dueList(b).filter { !it.ok }

fun policyText(c: Policy): String {
    fun days(n: Int) = if (n == 1) "1 dia" else "$n dies"
    if (c.fullDays == null && c.partialPct == 0) return "No es retorna l'import si es cancel·la."
    val out = mutableListOf<String>()
    c.fullDays?.let { out += if (it == 0) "Cancel·lació gratuïta fins al dia abans del check-in" else "Cancel·lació gratuïta fins a ${days(it)} abans del check-in" }
    if (c.partialPct > 0 && c.partialDays != null) out += "es retorna el ${c.partialPct} % fins a ${if (c.partialDays == 0) "el check-in" else days(c.partialDays) + " abans"}"
    return out.joinToString("; ") + ". Després no es retorna res."
}
fun refundDue(c: Policy, paid: Long, before: Int): Long {
    if (c.fullDays != null && before >= c.fullDays) return paid
    if (c.partialPct > 0 && c.partialDays != null && before >= c.partialDays) return Math.round(paid * c.partialPct / 100.0)
    return 0
}
