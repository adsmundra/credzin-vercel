package com.credzin.reward.spendreward.transactionchannel.domain

import com.credzin.featurestore.merchant.MerchantFeatureStoreAdapter
import com.credzin.featurestore.spendbased.transactionchannel.TransactionChannelSpendBasedFeatureStore
import com.credzin.reward.RewardTransactionCreateInput
import com.credzin.reward.RewardType

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
        if (
            !merchantFeatureStoreAdapter.isMerchantEligibleForReward(
                input.cardInput.id,
                input.merchantInput.id,
                RewardType.REWARD_POINT,
            )
        ) {
            // log this is happening.
            return this
        }

        // get the transaction channel rewards.
        // Get transaction channel type from metadata, default to OFFLINE if not specified
        val transactionChannelType =
            input.transactionMetadata?.transactionChannel
                ?: throw IllegalArgumentException("Transaction channel type is required for transaction channel rewards")

        val rewards =
            transactionChannelSpendBasedFeatureStore.getTransactionChannelSpendBasedRewardValue(
                cardID = input.cardInput.id,
                transactionChannelType = transactionChannelType,
                rewardType = RewardType.REWARD_POINT,
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
