package com.credzin.common

import java.util.UUID

/**
 * Amount input for transactions.
 * Corresponds to the GraphQL AmountInput type.
 */
data class AmountInput(
    val amount: Float,
    val currency: CurrencyCode,
)

/**
 * Card input for transactions.
 * Corresponds to the GraphQL CardInput type.
 */
data class CardInput(
    val id: UUID,
)

/**
 * Merchant input for transactions.
 * Corresponds to the GraphQL MerchantInput type.
 */
data class MerchantInput(
    val id: UUID,
)

/**
 * User input for transactions.
 * Corresponds to the GraphQL UserInput type.
 */
data class UserInput(
    val id: UUID,
)

/**
 * Location input for transactions.
 * Corresponds to the GraphQL LocationInput type.
 */
data class LocationInput(
    val longitude: Float,
    val latitude: Float,
)
