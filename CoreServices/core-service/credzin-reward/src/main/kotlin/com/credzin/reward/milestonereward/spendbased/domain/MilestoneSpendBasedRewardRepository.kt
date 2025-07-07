package com.credzin.reward.milestonereward.spendbased.domain

import java.util.UUID

interface MilestoneSpendBasedRewardRepository {

    fun create(
        milestoneSpendBasedRewardEntityCreateInput: MilestoneSpendBasedRewardEntityCreateInput,
        distance: MilestoneSpendBaseRewardDistance
    ): MilestoneSpendBasedRewardEntity

    fun find(
        transactionId: UUID,
    ): MilestoneSpendBasedRewardEntity?

}