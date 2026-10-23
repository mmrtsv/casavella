package com.casavellarural.maite.data

import java.text.NumberFormat
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.time.temporal.ChronoUnit
import java.util.Locale

// Dates are 'YYYY-MM-DD' strings in local time, like the API and the web
val CA: Locale = Locale.forLanguageTag("ca-ES")
object Today { var value: String = LocalDate.now().toString() }
val TODAY get() = Today.value

fun parse(s: String): LocalDate = LocalDate.parse(s)
fun addDays(s: String, n: Int): String = parse(s).plusDays(n.toLong()).toString()
fun nightsBetween(a: String, b: String): Int = ChronoUnit.DAYS.between(parse(a), parse(b)).toInt()
fun weekdayShort(s: String): String = parse(s).dayOfWeek.getDisplayName(TextStyle.SHORT, CA).trimEnd('.')
fun monthShort(m: Int): String = java.time.Month.of(m).getDisplayName(TextStyle.SHORT, CA).trimEnd('.')

/** "dl. 3 de nov." like toLocaleDateString('ca-ES', { weekday: 'short', day: 'numeric', month: 'short' }) */
fun day(s: String): String { val d = parse(s); return "${weekdayShort(s)} ${d.dayOfMonth} ${monthShort(d.monthValue)}" }
fun dayMonth(s: String): String { val d = parse(s); return "${d.dayOfMonth} ${monthShort(d.monthValue)}" }
fun longDay(s: String): String = parse(s).format(DateTimeFormatter.ofPattern("EEEE, d MMMM", CA))
fun monthTitle(s: String): String = cap(parse(s).format(DateTimeFormatter.ofPattern("LLLL 'del' yyyy", CA)))
fun range(a: String, b: String) = "${day(a)} – ${day(b)}"
fun nitsTxt(n: Int) = "$n ${if (n == 1) "nit" else "nits"}"
fun cap(s: String) = s.replaceFirstChar { it.titlecase(CA) }

fun stamp(iso: String): String = runCatching {
    Instant.parse(iso).atZone(ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("EEE d MMM, HH:mm", CA))
}.getOrDefault(iso)
fun stampMillis(ms: Long): String = Instant.ofEpochMilli(ms).atZone(ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("EEE d MMM, HH:mm", CA))
fun localDayOf(iso: String): String = runCatching { Instant.parse(iso).atZone(ZoneId.systemDefault()).toLocalDate().toString() }
    .getOrElse { runCatching { java.time.OffsetDateTime.parse(iso.replace(Regex("([+-]\\d{2})(\\d{2})$"), "$1:$2")).atZoneSameInstant(ZoneId.systemDefault()).toLocalDate().toString() }.getOrDefault(iso.take(10)) }

/** Cents as euros: 1 234,50 € (no decimals when round) */
fun euro(c: Long?): String {
    if (c == null) return ""
    val f = NumberFormat.getNumberInstance(CA).apply { minimumFractionDigits = if (c % 100 != 0L) 2 else 0; maximumFractionDigits = 2 }
    return f.format(c / 100.0) + " €"
}
fun euros(v: Double): String = euro(Math.round(v * 100))
fun plain(v: Double): String = if (v == Math.floor(v)) v.toLong().toString() else v.toString()
