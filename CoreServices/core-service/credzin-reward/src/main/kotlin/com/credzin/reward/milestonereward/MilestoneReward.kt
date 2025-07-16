package com.credzin.reward.milestonereward

import com.credzin.reward.AmountRange
import com.credzin.reward.Reward
import com.credzin.reward.TimePeriod
import java.util.UUID

/**
 * Interface for milestone-based rewards.
 * Corresponds to the GraphQL MileStoneReward interface.
 */
interface MilestoneReward {
    val id: UUID?
    val rewards: List<Reward>
}

/**
 * Spend-based milestone reward implementation.
 * Corresponds to the GraphQL SpendMileStoneReward type.
 */
data class SpendMilestoneReward(
    override val id: UUID,
    val name: String,
    override val rewards: List<Reward>,
    val amountRange: AmountRange,
    val timePeriod: TimePeriod,
) : MilestoneReward

/**
 * Transaction count-based milestone reward implementation.
 * Corresponds to the GraphQL TransactionCountMileStoneReward type.
 */
data class TransactionCountMilestoneReward(
    override val id: UUID,
    val name: String,
    override val rewards: List<Reward>,
    val transactionCountRange: List<TransactionCountRange>,
    val timePeriod: TimePeriod,
    val transactionAmountRange: AmountRange,
) : MilestoneReward

data class TransactionCountRange(
    val start: Int,
    val end: Int,
)
