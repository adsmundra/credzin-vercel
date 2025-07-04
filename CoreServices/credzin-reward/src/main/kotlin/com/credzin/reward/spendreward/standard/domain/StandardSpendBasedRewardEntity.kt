package com.credzin.reward.spendreward.standard.domain

import com.credzin.reward.Reward
import java.util.*

/**
 * Standard spend reward implementation.
 * Corresponds to the GraphQL StandardSpendReward type.
 */
data class StandardSpendBasedRewardEntity(
    val id: UUID? = null,
    val transactionId: UUID,
    val reward: Reward,
)
