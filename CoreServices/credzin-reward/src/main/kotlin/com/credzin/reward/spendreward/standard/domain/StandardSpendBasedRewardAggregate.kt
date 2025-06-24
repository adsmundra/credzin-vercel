package com.credzin.reward.spendreward.standard.domain

import com.credzin.featurestore.merchant.MerchantFeatureStoreAdapter
import com.credzin.featurestore.spendbased.standard.SpendBasedFeatureStore
import com.credzin.reward.RewardTransactionCreateInput
import com.credzin.reward.RewardType

class StandardSpendBasedRewardAggregate(
    private var standardSpendBasedRewardEntity: StandardSpendBasedRewardEntity? = null,
) {
    fun calculateStandardReward(
        input: RewardTransactionCreateInput,
        spendBasedFeatureStore: SpendBasedFeatureStore,
        standardSpendBasedRewardRepository: StandardSpendBasedRewardRepository,
        merchantFeatureStoreAdapter: MerchantFeatureStoreAdapter,
    ): StandardSpendBasedRewardAggregate {
        // check if merchant is eligible for standard reward.
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

        // get the standard reward.
        val reward =
            spendBasedFeatureStore.getSpendBasedRewardValue(
                cardID = input.cardInput.id,
                rewardType = RewardType.REWARD_POINT,
            )

        this.standardSpendBasedRewardEntity =
            standardSpendBasedRewardRepository.create(
                input,
                reward,
            )

        return this
    }
}
