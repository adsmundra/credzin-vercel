package com.credzin.reward.milestonereward.spendbased.db

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface JpaMilestoneSpendBasedRewardRepository : JpaRepository<JpaMilestoneSpendBasedReward, Long> {
    fun findByTransactionId(transactionId: UUID): JpaMilestoneSpendBasedReward?
}
