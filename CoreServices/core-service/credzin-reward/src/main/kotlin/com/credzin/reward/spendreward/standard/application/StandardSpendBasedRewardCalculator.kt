package com.credzin.reward.spendreward.standard.application

import com.credzin.featurestore.merchant.MerchantFeatureStoreAdapter
import com.credzin.featurestore.spendbased.standard.SpendBasedFeatureStore
import com.credzin.reward.RewardTransactionCreateInput
import com.credzin.reward.spendreward.standard.domain.StandardSpendBasedRewardAggregate
import com.credzin.reward.spendreward.standard.domain.StandardSpendBasedRewardRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Component
class StandardSpendBasedRewardCalculator(
    private val standardSpendBasedRewardRepository: StandardSpendBasedRewardRepository,
    private val spendBasedFeatureStore: SpendBasedFeatureStore,
    private val merchantFeatureStoreAdapter: MerchantFeatureStoreAdapter,
) {
    private companion object {
        private val logger = LoggerFactory.getLogger(StandardSpendBasedRewardCalculator::class.java)
    }

    fun calculateReward(input: RewardTransactionCreateInput): StandardSpendBasedRewardAggregate {
        val standardSpendBasedRewardAggregate = StandardSpendBasedRewardAggregate()

        return standardSpendBasedRewardAggregate.calculateStandardReward(
            input = input,
            spendBasedFeatureStore = spendBasedFeatureStore,
            standardSpendBasedRewardRepository = standardSpendBasedRewardRepository,
            merchantFeatureStoreAdapter = merchantFeatureStoreAdapter,
        )
    }
}
