package com.credzin.reward.milestonereward.spendbased.domain

import java.util.*

data class MilestoneSpendBasedRewardEntity(
    val id: UUID? = null,
    val transactionId: UUID,
    val currentMilestoneDelta: MilestoneSpendBaseRewardDistance,
)