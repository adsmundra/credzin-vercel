package com.credzin.reward.spendreward.partner.domain

import com.credzin.featurestore.merchant.MerchantFeatureStoreAdapter
import com.credzin.featurestore.spendbased.partner.PartnerSpendBasedFeatureStore
import com.credzin.reward.RewardTransactionCreateInput
import com.credzin.reward.RewardType

class PartnerSpendBasedRewardAggregate(
    private var partnerSpendBasedRewardEntity: PartnerSpendBasedRewardEntity? = null,
) {
    fun calculatePartnerReward(
        input: RewardTransactionCreateInput,
        partnerSpendBasedFeatureStore: PartnerSpendBasedFeatureStore,
        partnerSpendBasedRewardRepository: PartnerSpendBasedRewardRepository,
        merchantFeatureStoreAdapter: MerchantFeatureStoreAdapter,
    ): PartnerSpendBasedRewardAggregate {
        // check if merchant is eligible for partner reward.
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

        // get the partner rewards.
        // Note: Partner ID should be derived from merchant or transaction context
        // Currently using merchant ID as partner ID - this should be updated based on business requirements
        // Future implementation should include proper partner resolution logic that maps merchants to partners
        val partnerID = input.merchantInput.id

        val rewards =
            partnerSpendBasedFeatureStore.getPartnerSpendBasedRewardValue(
                cardID = input.cardInput.id,
                partnerID = partnerID,
                rewardType = RewardType.REWARD_POINT,
            )

        this.partnerSpendBasedRewardEntity =
            partnerSpendBasedRewardRepository.create(
                input,
                rewards,
            )

        return this
    }
}
