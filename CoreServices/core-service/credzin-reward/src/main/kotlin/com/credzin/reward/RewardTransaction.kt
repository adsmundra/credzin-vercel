package com.credzin.reward

import com.credzin.common.Amount
import java.time.LocalDateTime
import java.util.UUID

/**
 * Reward transaction result.
 * Corresponds to the GraphQL RewardTransaction type.
 */
data class RewardTransaction(
    val id: UUID,
    val createdDateTime: LocalDateTime,
    val amount: Amount,
    val card: Card,
    val user: User,
    val merchant: Merchant,
    val reward: List<Reward>,
    val location: Location? = null,
    val channel: TransactionChannelType? = null,
)
