package com.credzin.reward.spendreward.standard.domain

import com.credzin.reward.RewardTransactionCreateInput
import com.credzin.reward.RewardValue

interface StandardSpendBasedRewardRepository {
    fun create(
        input: RewardTransactionCreateInput,
        reward: RewardValue,
    ): StandardSpendBasedRewardEntity
}
