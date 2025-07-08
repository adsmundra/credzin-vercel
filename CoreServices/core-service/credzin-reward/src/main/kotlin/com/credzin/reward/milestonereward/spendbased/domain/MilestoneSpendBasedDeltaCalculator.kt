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
            return MilestoneSpendBaseRewardDistance(
                previousMilestoneSpendBased = null,
                currentMilestoneSpendBased = null,
                nextMilestoneSpendBased = null,
            )
        }

        val sortedMilestoneSpendBased = milestonesSpendBased.sortedBy { it.order }

        if (currentSpendDetails == null) {
            return MilestoneSpendBaseRewardDistance(
                previousMilestoneSpendBased = null,
                currentMilestoneSpendBased = null,
                nextMilestoneSpendBased = sortedMilestoneSpendBased.first(),
            )
        }

        return findMilestonePosition(currentSpendDetails.totalAmount, sortedMilestoneSpendBased)
    }

    /**
     * Finds the position of the current amount relative to milestones using binary search approach.
     * Think of milestones as a linked list where we need to find previous, current, and next nodes.
     */
    private fun findMilestonePosition(
        amount: Amount,
        sortedMilestones: List<MilestoneSpendBased>
    ): MilestoneSpendBaseRewardDistance {
        logger.info("Finding milestone position for amount = $amount")
        
        // First, try to find if the amount falls within any milestone range
        val currentMilestoneIndex = findCurrentMilestoneIndex(amount, sortedMilestones)
        
        if (currentMilestoneIndex != -1) {
            // Amount falls within a milestone range
            val currentMilestone = sortedMilestones[currentMilestoneIndex]
            val previousMilestone = if (currentMilestoneIndex > 0) sortedMilestones[currentMilestoneIndex - 1] else null
            val nextMilestone = if (currentMilestoneIndex < sortedMilestones.size - 1) sortedMilestones[currentMilestoneIndex + 1] else null
            
            return MilestoneSpendBaseRewardDistance(
                currentMilestoneSpendBased = currentMilestone,
                previousMilestoneSpendBased = previousMilestone,
                nextMilestoneSpendBased = nextMilestone,
            )
        }
        
        // Amount doesn't fall within any milestone range
        // Determine the position relative to milestones
        val position = determinePositionRelativeToMilestones(amount, sortedMilestones)
        
        return when (position.type) {
            PositionType.BEFORE_FIRST -> {
                MilestoneSpendBaseRewardDistance(
                    currentMilestoneSpendBased = null,
                    previousMilestoneSpendBased = null,
                    nextMilestoneSpendBased = sortedMilestones.first(),
                )
            }
            PositionType.AFTER_LAST -> {
                MilestoneSpendBaseRewardDistance(
                    currentMilestoneSpendBased = null,
                    previousMilestoneSpendBased = sortedMilestones.last(),
                    nextMilestoneSpendBased = null,
                )
            }
            PositionType.BETWEEN -> {
                // For between milestones, find the next reachable milestone
                val nextMilestone = findNextReachableMilestone(amount, sortedMilestones)
                MilestoneSpendBaseRewardDistance(
                    currentMilestoneSpendBased = null,
                    previousMilestoneSpendBased = null,
                    nextMilestoneSpendBased = nextMilestone,
                )
            }
        }
    }
    
    private enum class PositionType {
        BEFORE_FIRST, BETWEEN, AFTER_LAST
    }
    
    private data class Position(val type: PositionType, val index: Int = -1)
    
    /**
     * Determines where the amount falls relative to the milestone ranges
     */
    private fun determinePositionRelativeToMilestones(
        amount: Amount,
        sortedMilestones: List<MilestoneSpendBased>
    ): Position {
        // Check if amount is before the first milestone
        if (amount.amount < sortedMilestones.first().amountRange.minAmount.amount) {
            return Position(PositionType.BEFORE_FIRST)
        }
        
        // Check if amount is after the last milestone
        if (amount.amount > sortedMilestones.last().amountRange.maxAmount.amount) {
            return Position(PositionType.AFTER_LAST)
        }
        
        // Amount is between milestones
        return Position(PositionType.BETWEEN)
    }
    
    /**
     * Finds the index of the milestone that contains the given amount.
     * Returns -1 if no milestone contains the amount.
     */
    private fun findCurrentMilestoneIndex(
        amount: Amount,
        sortedMilestones: List<MilestoneSpendBased>
    ): Int {
        var low = 0
        var high = sortedMilestones.size - 1
        var result = -1

        while (low <= high) {
            val mid = low + (high - low) / 2
            val milestone = sortedMilestones[mid]
            
            if (amount.amount >= milestone.amountRange.minAmount.amount && 
                amount.amount <= milestone.amountRange.maxAmount.amount) {
                result = mid
                // Continue searching for the first matching milestone (lowest order)
                // in case of overlapping ranges
                high = mid - 1
            } else if (amount.amount < milestone.amountRange.minAmount.amount) {
                high = mid - 1
            } else {
                low = mid + 1
            }
        }
        
        return result
    }
    
    /**
     * Finds the next reachable milestone when the amount falls between milestones.
     * This should return the next milestone that the user can actually reach.
     */
    private fun findNextReachableMilestone(
        amount: Amount,
        sortedMilestones: List<MilestoneSpendBased>
    ): MilestoneSpendBased? {
        // Look for the first milestone that the user can potentially reach
        // (i.e., the first milestone whose minimum amount is greater than current amount)
        for (milestone in sortedMilestones) {
            if (amount.amount < milestone.amountRange.minAmount.amount) {
                return milestone
            }
        }
        return null
    }
}