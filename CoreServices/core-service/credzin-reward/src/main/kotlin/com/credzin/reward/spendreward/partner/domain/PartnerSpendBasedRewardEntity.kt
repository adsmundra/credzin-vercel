package com.credzin.reward.spendreward.partner.domain

import com.credzin.reward.Reward
import java.util.*

/**
 * Partner spend reward implementation.
 * Corresponds to the GraphQL PartnerSpendReward type.
 */
data class PartnerSpendBasedRewardEntity(
    val id: UUID? = null,
    val transactionId: UUID,
    val partnerId: UUID,
    val rewards: List<Reward>,
    val rewardIds: List<UUID> = emptyList(), // IDs of the rewards in separate table
)
