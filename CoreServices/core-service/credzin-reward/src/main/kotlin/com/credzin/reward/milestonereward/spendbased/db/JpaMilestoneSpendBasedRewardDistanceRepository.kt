package com.credzin.reward.milestonereward.spendbased.db

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface JpaMilestoneSpendBasedRewardDistanceRepository : JpaRepository<JpaMilestoneSpendBasedRewardDistance, Long> {

    /**
     * Finds the distance entity associated with a specific reward ID (UUID).
     */
    fun findByRewardId(rewardId: UUID): JpaMilestoneSpendBasedRewardDistance?
}