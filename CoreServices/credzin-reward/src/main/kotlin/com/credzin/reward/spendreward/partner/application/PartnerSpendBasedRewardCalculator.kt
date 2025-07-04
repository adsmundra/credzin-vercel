package com.credzin.reward.spendreward.partner.application

import com.credzin.featurestore.merchant.MerchantFeatureStoreAdapter
import com.credzin.featurestore.spendbased.partner.PartnerSpendBasedFeatureStore
import com.credzin.reward.RewardTransactionCreateInput
import com.credzin.reward.spendreward.partner.domain.PartnerSpendBasedRewardAggregate
import com.credzin.reward.spendreward.partner.domain.PartnerSpendBasedRewardRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Component
class PartnerSpendBasedRewardCalculator(
    private val partnerSpendBasedRewardRepository: PartnerSpendBasedRewardRepository,
    private val partnerSpendBasedFeatureStore: PartnerSpendBasedFeatureStore,
    private val merchantFeatureStoreAdapter: MerchantFeatureStoreAdapter,
) {
    private companion object {
        private val logger = LoggerFactory.getLogger(PartnerSpendBasedRewardCalculator::class.java)
    }

    fun calculateReward(input: RewardTransactionCreateInput): PartnerSpendBasedRewardAggregate {
        val partnerSpendBasedRewardAggregate = PartnerSpendBasedRewardAggregate()

        return partnerSpendBasedRewardAggregate.calculatePartnerReward(
            input = input,
            partnerSpendBasedFeatureStore = partnerSpendBasedFeatureStore,
            partnerSpendBasedRewardRepository = partnerSpendBasedRewardRepository,
            merchantFeatureStoreAdapter = merchantFeatureStoreAdapter,
        )
    }
}
