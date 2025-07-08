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
    ): StandardSpendBasedRewardAggregate {

        // get the standard reward.
        val reward =
            spendBasedFeatureStore.getSpendBasedRewardValue(
                cardID = input.cardInput.id,
                merchantId = input.merchantInput.id,
            )

        this.standardSpendBasedRewardEntity =
            standardSpendBasedRewardRepository.create(
                input,
                reward,
            )

        return this
    }
}
