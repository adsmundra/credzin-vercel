package com.credzin.reward.spendreward.transactionchannel.db

import com.credzin.reward.TransactionChannelType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface TransactionChannelSpendBasedRewardJpaRepository : JpaRepository<JpaTransactionChannelSpendBasedRewardEntity, UUID> {
    fun findByTransactionId(transactionId: UUID): List<JpaTransactionChannelSpendBasedRewardEntity>

    fun findByTransactionChannelType(transactionChannelType: TransactionChannelType): List<JpaTransactionChannelSpendBasedRewardEntity>

    fun findByTransactionIdAndTransactionChannelType(
        transactionId: UUID,
        transactionChannelType: TransactionChannelType,
    ): List<JpaTransactionChannelSpendBasedRewardEntity>
}
