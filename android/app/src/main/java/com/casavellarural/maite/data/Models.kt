package com.casavellarural.maite.data

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

// The shapes /api/maite/* returns (see maite-app/src/lib/types.ts, lib/maite.js asBooking, lib/booking.js settings)

@Serializable
data class Policy(val fullDays: Int? = null, val partialDays: Int? = null, val partialPct: Int = 0)

@Serializable
data class Booking(
    val id: String, val stay: String, val first: String, val until: String, val kind: String, val title: String = "",
    val blocks: Boolean = true, val name: String = "", val email: String = "", val phone: String = "",
    val guests: Int? = null, val amount: Long? = null, val settled: Boolean = false, val refunded: Long = 0,
    val was: String = "", val source: String = "", val arrival: String = "", val notes: String = "",
    val stripe: String = "", val link: String = "", val checkin: String = "", val checkout: String = "",
    val docs: Boolean = false, val police: Boolean = false, val docsFolder: String = "", val ref: String = "",
    val method: String = "", val memo: String = "", val policy: Policy? = null,
) {
    val key get() = "$stay|$id"
}

@Serializable
data class Stay(val id: String, val name: String, val short: String, val max: Int)

@Serializable
data class StayPrice(val base: Double, val weekend: Double? = null)

@Serializable
data class DayRule(val price: Double? = null, val min: Int? = null)

@Serializable
data class Tier(val nights: Int, val pct: Int)

@Serializable
data class Rules(
    val minNights: Int, val maxNights: Int, val minAdvance: Int, val maxAdvance: Int,
    val checkin: String, val checkout: String,
)

@Serializable
data class Settings(
    val stays: Map<String, StayPrice>,
    val days: Map<String, Map<String, DayRule>> = emptyMap(),
    val discounts: List<Tier> = emptyList(),
    val rules: Rules,
    val cancel: Policy,
    val policy: String? = null,
)

@Serializable
data class BookingsResponse(val user: String = "", val stays: List<Stay>, val bookings: List<Booking>, val errors: List<StayError> = emptyList())

@Serializable
data class StayError(val stay: String, val error: String)

@Serializable
data class BookingResponse(val booking: Booking)

@Serializable
data class Feat(val icon: String, val text: String)

@Serializable
data class StayContent(val kind: String, val name: String, val desc: String, val feats: List<Feat>, val max: Int, val photos: List<String>)

@Serializable
data class Content(
    val stays: Map<String, StayContent>, val icons: Map<String, String>, val iconNames: Map<String, String> = emptyMap(),
    val library: List<String> = emptyList(), val uploads: Boolean = false,
)

@Serializable
data class PayMethod(val type: String = "", val brand: String = "", val last4: String = "", val wallet: String = "", val country: String = "", val bank: String = "")

@Serializable
data class Payment(
    val status: String = "", val amount: Long = 0, val received: Long = 0, val refunded: Long = 0, val created: Long = 0,
    val receipt: String = "", val livemode: Boolean = false, val link: String = "", val method: PayMethod = PayMethod(),
)

@Serializable
data class Quote(val total: Long = 0)

@Serializable
data class Email(val id: String, val name: String, @kotlinx.serialization.SerialName("for") val audience: String, val `when`: String, val subject: String, val html: String, val text: String)

@Serializable
data class Emails(val emails: List<Email>)

@Serializable
data class DaysResponse(val days: Map<String, Map<String, DayRule>>)

@Serializable
data class CancelResponse(val refunded: Long = 0)

// Xarxes socials
@Serializable
data class Published(val at: String, val url: String = "", val media: String? = null, val image: String? = null)

@Serializable
data class SocialPost(val id: String, val tpl: String, val v: Int = 0, val photo: String = "", val texts: List<String?>? = null, val at: String = "", val date: String? = null, val published: Published? = null, val schedule: Schedule? = null)

/** A post programmed for a moment: its JPEG is already uploaded and lib/instagram.js publishes it when due */
@Serializable
data class Schedule(val at: String, val image: String = "", val error: String? = null)

/** templates: the words changed on each template, which new posts start from (null keeps the template's) */
@Serializable
data class Social(val posts: List<SocialPost> = emptyList(), val copies: Map<String, String> = emptyMap(), val templates: Map<String, List<String?>> = emptyMap(), val ai: Boolean = false)

@Serializable
data class CaptionOption(val caption: String, val hashtags: String = "")

@Serializable
data class CaptionOptions(val options: List<CaptionOption>)

/** A post or story Claude made from a description (/api/maite/social-make): the template, its photo and words, and the caption */
@Serializable
data class Made(val tpl: String, val photo: String = "", val texts: List<String?> = emptyList(), val caption: String = "", val hashtags: String = "")

@Serializable
data class MadeOptions(val options: List<Made>)

@Serializable
data class LiveMedia(val id: String, val at: String, val url: String = "", val image: String = "", val caption: String = "")

@Serializable
data class Insta(val connected: Boolean = false, val username: String? = null, val detail: String? = null, val media: List<LiveMedia> = emptyList())

@Serializable
data class PhotoResponse(val src: String)

@Serializable
data class ErrorBody(val error: String = "", val detail: JsonElement? = null, val with: List<Booking> = emptyList())
