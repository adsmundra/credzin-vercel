package com.credzin.reward.spendreward.partner.domain

import com.credzin.reward.RewardTransactionCreateInput
import com.credzin.reward.RewardValue

interface PartnerSpendBasedRewardRepository {
    fun create(
        input: RewardTransactionCreateInput,
        rewards: List<RewardValue>,
    ): PartnerSpendBasedRewardEntity
}
