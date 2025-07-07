package com.credzin.reward.milestonereward.spendbased.domain

import com.credzin.common.Amount

data class MilestoneSpendBaseRewardEntityMetadata(
    val currentMilestoneInformation: MilestoneSpendBased,
    val nextMilestoneInformation: MilestoneSpendBased
)
