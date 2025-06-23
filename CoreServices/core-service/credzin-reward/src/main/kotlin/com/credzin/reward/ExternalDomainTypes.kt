package com.credzin.reward

import com.credzin.common.Amount
import java.time.LocalDate
import java.util.UUID

/**
 * Card data class from card domain.
 * Corresponds to the GraphQL Card type.
 */
data class Card(
    val id: UUID,
    val externalCardId: String? = null,
)

/**
 * User data class from user domain.
 * Corresponds to the GraphQL User type.
 */
data class User(
    val id: UUID,
)

/**
 * Partner data class from partner domain.
 * Corresponds to the GraphQL Partner type.
 */
data class Partner(
    val id: UUID,
)

/**
 * Bank data class from bank domain.
 * Corresponds to the GraphQL Bank type.
 */
data class Bank(
    val id: UUID,
    val name: String? = null,
)

/**
 * Merchant data class from merchant domain.
 * Corresponds to the GraphQL Merchant type.
 */
data class Merchant(
    val id: UUID,
    val legalName: String? = null,
    val displayName: String? = null,
    val merchantCategoryCode: String? = null,
)

/**
 * Transaction channel type enum.
 * Corresponds to the GraphQL TransactionChannelType enum.
 */
enum class TransactionChannelType {
    ONLINE,
    OFFLINE,
}

/**
 * Location data class.
 * Corresponds to the GraphQL Location type.
 */
data class Location(
    val longitude: Float,
    val latitude: Float,
)

/**
 * Amount range data class.
 * Corresponds to the GraphQL AmountRange type.
 */
data class AmountRange(
    val minAmount: Amount,
    val maxAmount: Amount,
)

/**
 * Time period data class.
 * Corresponds to the GraphQL TimePeriod type.
 */
data class TimePeriod(
    val startDate: LocalDate,
    val endDate: LocalDate,
)
