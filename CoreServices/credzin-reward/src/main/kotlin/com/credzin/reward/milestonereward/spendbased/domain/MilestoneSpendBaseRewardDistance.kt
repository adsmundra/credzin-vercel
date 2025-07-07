package com.credzin.reward.milestonereward.spendbased.domain

import com.credzin.reward.RewardValue

data class MilestoneSpendBaseRewardDistance(
    val currentMilestoneSpendBased: MilestoneSpendBased?, //in case it's not yet started or has ended
    val previousMilestoneSpendBased: MilestoneSpendBased?,
    val nextMilestoneSpendBased: MilestoneSpendBased?,
)
