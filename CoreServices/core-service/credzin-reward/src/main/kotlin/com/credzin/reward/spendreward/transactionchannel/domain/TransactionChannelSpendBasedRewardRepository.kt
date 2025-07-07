package com.credzin.reward.spendreward.transactionchannel.domain

import com.credzin.reward.RewardTransactionCreateInput
import com.credzin.reward.RewardValue

interface TransactionChannelSpendBasedRewardRepository {
    fun create(
        input: RewardTransactionCreateInput,
        rewards: List<RewardValue>,
    ): TransactionChannelSpendBasedRewardEntity
}
