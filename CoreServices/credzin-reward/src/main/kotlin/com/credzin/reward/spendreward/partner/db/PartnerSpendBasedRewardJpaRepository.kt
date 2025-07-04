package com.credzin.reward.spendreward.partner.db

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface PartnerSpendBasedRewardJpaRepository : JpaRepository<JpaPartnerSpendBasedRewardEntity, UUID> {
    fun findByTransactionId(transactionId: UUID): List<JpaPartnerSpendBasedRewardEntity>

    fun findByPartnerId(partnerId: UUID): List<JpaPartnerSpendBasedRewardEntity>

    fun findByTransactionIdAndPartnerId(
        transactionId: UUID,
        partnerId: UUID,
    ): List<JpaPartnerSpendBasedRewardEntity>
}
