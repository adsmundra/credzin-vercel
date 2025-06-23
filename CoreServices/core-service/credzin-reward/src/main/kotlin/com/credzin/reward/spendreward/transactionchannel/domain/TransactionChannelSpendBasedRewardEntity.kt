package com.credzin.reward.spendreward.transactionchannel.domain

import com.credzin.reward.Reward
import com.credzin.reward.TransactionChannelType
import java.util.*

/**
 * Transaction channel spend reward implementation.
 * Corresponds to the GraphQL TransactionChannelSpendReward type.
 */
data class TransactionChannelSpendBasedRewardEntity(
    val id: UUID? = null,
    val transactionId: UUID,
    val transactionChannelType: TransactionChannelType,
    val rewards: List<Reward>,
    val rewardIds: List<UUID> = emptyList(), // IDs of the rewards in separate table
)
