package com.credzin.reward.spendreward.transactionchannel.domain

import com.credzin.adapter.featurestore.merchant.MerchantFeatureStoreAdapter
import com.credzin.adapter.featurestore.spendbased.transactionchannel.TransactionChannelSpendBasedFeatureStore
import com.credzin.reward.RewardTransactionCreateInput

class TransactionChannelSpendBasedRewardAggregate(
    private var transactionChannelSpendBasedRewardEntity: TransactionChannelSpendBasedRewardEntity? = null,
) {
    fun calculateTransactionChannelReward(
        input: RewardTransactionCreateInput,
        transactionChannelSpendBasedFeatureStore: TransactionChannelSpendBasedFeatureStore,
        transactionChannelSpendBasedRewardRepository: TransactionChannelSpendBasedRewardRepository,
        merchantFeatureStoreAdapter: MerchantFeatureStoreAdapter,
    ): TransactionChannelSpendBasedRewardAggregate {
        // check if merchant is eligible for transaction channel reward.
        // get the transaction channel rewards.
        // Get transaction channel type from metadata, default to OFFLINE if not specified
        val transactionChannelType =
            input.transactionMetadata?.transactionChannel
                ?: throw IllegalArgumentException("Transaction channel type is required for transaction channel rewards")

        val rewards =
            transactionChannelSpendBasedFeatureStore.getTransactionChannelSpendBasedRewardValue(
                cardID = input.cardInput.id,
                transactionChannelType = transactionChannelType,
                merchantId = input.merchantInput.id,
            )

        this.transactionChannelSpendBasedRewardEntity =
            transactionChannelSpendBasedRewardRepository.create(
                input,
                rewards,
            )

        return this
    }
}
