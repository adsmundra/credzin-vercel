package com.credzin.reward.spendreward.partner.domain

import com.credzin.adapter.featurestore.merchant.MerchantFeatureStoreAdapter
import com.credzin.adapter.featurestore.spendbased.partner.PartnerSpendBasedFeatureStore
import com.credzin.reward.RewardTransactionCreateInput

class PartnerSpendBasedRewardAggregate(
    private var partnerSpendBasedRewardEntity: PartnerSpendBasedRewardEntity? = null,
) {
    fun calculatePartnerReward(
        input: RewardTransactionCreateInput,
        partnerSpendBasedFeatureStore: PartnerSpendBasedFeatureStore,
        partnerSpendBasedRewardRepository: PartnerSpendBasedRewardRepository,
        merchantFeatureStoreAdapter: MerchantFeatureStoreAdapter,
    ): PartnerSpendBasedRewardAggregate {

        // get the partner rewards.
        // Note: Partner ID should be derived from merchant or transaction context
        // Currently using merchant ID as partner ID - this should be updated based on business requirements
        // Future implementation should include proper partner resolution logic that maps merchants to partners
        val partnerID = input.merchantInput.id

        val rewards =
            partnerSpendBasedFeatureStore.getPartnerSpendBasedRewardValue(
                cardID = input.cardInput.id,
                partnerID = partnerID,
            )

        this.partnerSpendBasedRewardEntity =
            partnerSpendBasedRewardRepository.create(
                input,
                rewards,
            )

        return this
    }
}
