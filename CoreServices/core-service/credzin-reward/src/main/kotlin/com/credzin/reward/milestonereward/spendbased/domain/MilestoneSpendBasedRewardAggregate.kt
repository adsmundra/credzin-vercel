package com.credzin.reward.milestonereward.spendbased.domain

import com.credzin.adapter.featurestore.milestone.spend.MilestoneSpendBasedFeatureStore
import com.credzin.adapter.usertransaction.UserTransactionAdapter
import com.credzin.reward.RewardTransactionCreateInput
import org.slf4j.LoggerFactory

class MilestoneSpendBasedRewardAggregate(
    private var milestoneSpendBasedRewardEntity: MilestoneSpendBasedRewardEntity? = null,
) {

    private companion object {
        private val logger = LoggerFactory.getLogger(MilestoneSpendBasedRewardAggregate::class.java)
    }



    fun calculateReward(
        rewardTransactionCreateInput: RewardTransactionCreateInput,
        userTransactionAdapter: UserTransactionAdapter,
        milestoneSpendBasedRewardFeatureStore: MilestoneSpendBasedFeatureStore,
        milestoneSpendBasedDeltaCalculator: MilestoneSpendBasedDeltaCalculator,
        milestoneSpendBasedRewardRepository: MilestoneSpendBasedRewardRepository,
    ): MilestoneSpendBasedRewardEntity {

        val spendBasedTimePeriod =
            milestoneSpendBasedRewardFeatureStore.getMilestoneSpendBasedTimePeriodForCreditCardId(
                rewardTransactionCreateInput.cardInput.id,
            )

        val milestonesSpendBased = milestoneSpendBasedRewardFeatureStore.getMilestonesSpendBased(
            rewardTransactionCreateInput.cardInput.id,
        )

        val currentUserTransactionAmount = userTransactionAdapter.getUserCurrentSpendDetails(
            userId = rewardTransactionCreateInput.userId, timePeriod = spendBasedTimePeriod
        )

        val distance = milestoneSpendBasedDeltaCalculator.calculateDelta(
            currentSpendDetails = currentUserTransactionAmount,
            milestonesSpendBased = milestonesSpendBased,
            cardId = rewardTransactionCreateInput.cardInput.id
        )

        val milestoneSpendBasedRewardEntityCreateInput = MilestoneSpendBasedRewardEntityCreateInput(
            transactionId = rewardTransactionCreateInput.transactionId,
            distance = distance,
        )

        this.milestoneSpendBasedRewardEntity = milestoneSpendBasedRewardRepository.create(
            milestoneSpendBasedRewardEntityCreateInput = milestoneSpendBasedRewardEntityCreateInput,
            distance = distance
        )

        return this.milestoneSpendBasedRewardEntity!!
    }
}