package com.credzin.reward.spendreward

import com.credzin.reward.Reward
import com.credzin.reward.TransactionChannelType
import java.util.UUID

/**
 * Interface for spend-based rewards.
 * Corresponds to the GraphQL SpendReward interface.
 */
interface SpendReward {
    val id: UUID?
    val rewards: List<Reward>
}

/**
 * Transaction channel-based spend reward implementation.
 * Corresponds to the GraphQL TransactionChannelSpendReward type.
 */
data class TransactionChannelSpendReward(
    override val id: UUID,
    val transactionChannelType: TransactionChannelType,
    override val rewards: List<Reward>,
) : SpendReward
