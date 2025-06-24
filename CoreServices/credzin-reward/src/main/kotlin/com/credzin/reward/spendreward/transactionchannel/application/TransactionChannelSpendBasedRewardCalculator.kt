package com.credzin.reward.spendreward.transactionchannel.application

import com.credzin.featurestore.merchant.MerchantFeatureStoreAdapter
import com.credzin.featurestore.spendbased.transactionchannel.TransactionChannelSpendBasedFeatureStore
import com.credzin.reward.RewardTransactionCreateInput
import com.credzin.reward.spendreward.transactionchannel.domain.TransactionChannelSpendBasedRewardAggregate
import com.credzin.reward.spendreward.transactionchannel.domain.TransactionChannelSpendBasedRewardRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Component
class TransactionChannelSpendBasedRewardCalculator(
    private val transactionChannelSpendBasedRewardRepository: TransactionChannelSpendBasedRewardRepository,
    private val transactionChannelSpendBasedFeatureStore: TransactionChannelSpendBasedFeatureStore,
    private val merchantFeatureStoreAdapter: MerchantFeatureStoreAdapter,
) {
    private companion object {
        private val logger = LoggerFactory.getLogger(TransactionChannelSpendBasedRewardCalculator::class.java)
    }

    fun calculateReward(input: RewardTransactionCreateInput): TransactionChannelSpendBasedRewardAggregate {
        val transactionChannelSpendBasedRewardAggregate = TransactionChannelSpendBasedRewardAggregate()

        return transactionChannelSpendBasedRewardAggregate.calculateTransactionChannelReward(
            input = input,
            transactionChannelSpendBasedFeatureStore = transactionChannelSpendBasedFeatureStore,
            transactionChannelSpendBasedRewardRepository = transactionChannelSpendBasedRewardRepository,
            merchantFeatureStoreAdapter = merchantFeatureStoreAdapter,
        )
    }
}
