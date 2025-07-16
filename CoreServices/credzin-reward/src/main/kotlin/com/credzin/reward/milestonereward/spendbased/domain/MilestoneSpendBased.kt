package com.credzin.reward.milestonereward.spendbased.domain

import com.credzin.reward.AmountRange
import com.credzin.reward.RewardValue
import com.credzin.reward.TimePeriod

data class MilestoneSpendBased(
    val amountRange: AmountRange,
    val timePeriod: TimePeriod,
    val rewardValue: RewardValue,
    val order: MilestoneSpendBasedOrder,
)

data class MilestoneSpendBasedOrder(
    val order: Int,
): Comparable<MilestoneSpendBasedOrder> {
    override fun compareTo(other: MilestoneSpendBasedOrder): Int {
        return this.order.compareTo(other.order) // Ascending order
    }
}
