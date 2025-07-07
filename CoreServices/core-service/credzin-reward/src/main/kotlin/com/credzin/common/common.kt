package com.credzin.common

/**
 * Amount data class representing monetary values.
 * Corresponds to the GraphQL Amount type.
 */
data class Amount(
    val amount: Float,
    val currency: CurrencyCode,
    ) {

    fun isLessThan(other: Amount): Boolean {
        if (this.currency != other.currency) {
            throw IllegalArgumentException("Cannot compare amount as currency is different.")
        }
        return if (this.amount < other.amount) {
            true
        } else {
            false
        }
    }
}

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
