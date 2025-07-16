package com.credzin.reward.spendreward.standard.domain

import com.credzin.adapter.featurestore.merchant.MerchantFeatureStoreAdapter
import com.credzin.adapter.featurestore.spendbased.standard.SpendBasedFeatureStore
import com.credzin.reward.RewardTransactionCreateInput

class StandardSpendBasedRewardAggregate(
    private var standardSpendBasedRewardEntity: StandardSpendBasedRewardEntity? = null,
) {
    fun calculateStandardReward(
        input: RewardTransactionCreateInput,
        spendBasedFeatureStore: SpendBasedFeatureStore,
        standardSpendBasedRewardRepository: StandardSpendBasedRewardRepository,
        merchantFeatureStoreAdapter: MerchantFeatureStoreAdapter,
    ): StandardSpendBasedRewardAggregate {

        // get the standard reward.
        val reward =
            spendBasedFeatureStore.getSpendBasedRewardValue(
                cardID = input.cardInput.id,
            )

        this.standardSpendBasedRewardEntity =
            standardSpendBasedRewardRepository.create(
                input,
                reward,
            )

        return this
    }
}
