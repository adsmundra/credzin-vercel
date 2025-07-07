package com.credzin.reward.milestonereward.spendbased.application

import com.credzin.adapter.featurestore.milestone.spend.MilestoneSpendBasedFeatureStore
import com.credzin.adapter.usertransaction.UserTransactionAdapter
import com.credzin.reward.RewardTransactionCreateInput
import com.credzin.reward.milestonereward.spendbased.domain.MilestoneSpendBasedDeltaCalculator
import com.credzin.reward.milestonereward.spendbased.domain.MilestoneSpendBasedRewardAggregate
import com.credzin.reward.milestonereward.spendbased.domain.MilestoneSpendBasedRewardRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Component
class MilestoneSpendBasedRewardCalculator(
    private val userTransactionAdapter: UserTransactionAdapter,
    private val milestoneSpendBasedRewardFeatureStore: MilestoneSpendBasedFeatureStore,
    private val milestoneSpendBasedDeltaCalculator: MilestoneSpendBasedDeltaCalculator,
    private val milestoneSpendBasedRewardRepository: MilestoneSpendBasedRewardRepository,
) {

    private companion object {
        private val logger = LoggerFactory.getLogger(MilestoneSpendBasedRewardCalculator::class.java)
    }

    fun calculate(
        rewardTransactionInput: RewardTransactionCreateInput
    ): MilestoneSpendBasedRewardAggregate {
        logger.info("Calculating mile stone rewards for input = $rewardTransactionInput")

        val milestoneSpendBasedAggregate = MilestoneSpendBasedRewardAggregate()

        milestoneSpendBasedAggregate.calculateReward(
            rewardTransactionInput,
            userTransactionAdapter,
            milestoneSpendBasedRewardFeatureStore,
            milestoneSpendBasedDeltaCalculator,
            milestoneSpendBasedRewardRepository,
        )

        return milestoneSpendBasedAggregate
    }
}