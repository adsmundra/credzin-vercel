package com.credzin.reward.milestonereward.spendbased.domain

import java.util.UUID

data class MilestoneSpendBasedRewardEntityCreateInput(
    val distance: MilestoneSpendBaseRewardDistance,
    val transactionId: UUID,
)
