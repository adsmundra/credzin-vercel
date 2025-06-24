package com.credzin.reward.spendreward.transactionchannel.db

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface TransactionChannelSpendBasedRewardValueJpaRepository : JpaRepository<JpaTransactionChannelSpendBasedRewardValueEntity, UUID> {
    fun findByTransactionChannelSpendBasedRewardId(
        transactionChannelSpendBasedRewardId: UUID,
    ): List<JpaTransactionChannelSpendBasedRewardValueEntity>

    fun deleteByTransactionChannelSpendBasedRewardId(transactionChannelSpendBasedRewardId: UUID)
}
