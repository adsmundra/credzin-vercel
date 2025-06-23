package com.credzin.featurestore.spendbased.transactionchannel

import com.credzin.reward.RewardType
import com.credzin.reward.RewardValue
import com.credzin.reward.TransactionChannelType
import java.util.UUID

interface TransactionChannelSpendBasedFeatureStore {
    fun getTransactionChannelSpendBasedRewardValue(
        cardID: UUID,
        transactionChannelType: TransactionChannelType,
        rewardType: RewardType,
        merchantId: UUID,
    ): List<RewardValue>
}
