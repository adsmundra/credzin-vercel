package com.credzin.adapter.featurestore.spendbased.transactionchannel

import com.credzin.reward.RewardValue
import com.credzin.reward.TransactionChannelType
import java.util.*

interface TransactionChannelSpendBasedFeatureStore {
    fun getTransactionChannelSpendBasedRewardValue(
        cardID: UUID,
        transactionChannelType: TransactionChannelType,
        merchantId: UUID,
    ): List<RewardValue>
}
