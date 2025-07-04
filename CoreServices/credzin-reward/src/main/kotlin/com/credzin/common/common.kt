package com.credzin.common

/**
 * Amount data class representing monetary values.
 * Corresponds to the GraphQL Amount type.
 */
data class Amount(
    val amount: Float,
    val currency: CurrencyCode,
)

/**
 * Currency code enum.
 * Corresponds to the GraphQL CurrencyCode enum.
 */
enum class CurrencyCode {
    INR,
    USD,
    EUR,
    GBP,
    AED,
    SGD,
}
