package com.credzin.reward.milestonereward.spendbased.domain

import com.credzin.adapter.usertransaction.UserCurrentSpendDetails
import com.credzin.common.Amount
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.util.UUID

@Component
class MilestoneSpendBasedDeltaCalculator {

    private companion object {
        private val logger = LoggerFactory.getLogger(MilestoneSpendBasedDeltaCalculator::class.java)
    }

    fun calculateDelta(
        currentSpendDetails: UserCurrentSpendDetails?,
        milestonesSpendBased: List<MilestoneSpendBased>,
        cardId: UUID,
    ): MilestoneSpendBaseRewardDistance {

        if (milestonesSpendBased.isEmpty()) {
            logger.info("No mile stone rewards are present. cardId = $cardId")
        }

        val sortedMilestoneSpendBased = milestonesSpendBased.sortedBy { it.order }

        if (currentSpendDetails == null) {
            return MilestoneSpendBaseRewardDistance(
                previousMilestoneSpendBased = null,
                currentMilestoneSpendBased = null,
                nextMilestoneSpendBased = sortedMilestoneSpendBased.first(),
            )
        }

        //get the reward according to the order of the current spend detail
        val currentMilestoneSpendBased = findCurrentMilestoneReward(
            amount = currentSpendDetails.totalAmount,
            milestonesSpendBased = milestonesSpendBased,
        )

        //find the current mile stone from the list.

        //find the previos and next from the list.

        //return that step.
        return MilestoneSpendBaseRewardDistance(
            currentMilestoneSpendBased = currentMilestoneSpendBased,
            previousMilestoneSpendBased = null, //to be filled
            nextMilestoneSpendBased = null, //to be filled
        )
    }

    private fun findCurrentMilestoneReward(
        amount: Amount,
        milestonesSpendBased: List<MilestoneSpendBased>
    ): MilestoneSpendBased? {
        logger.info("Finding current milestone for amount = $amount")

        //TODO write binary search to find the current mile stone
        TODO()
    }
}