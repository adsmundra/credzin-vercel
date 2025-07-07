package com.credzin.reward.spendreward.partner.db

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface PartnerSpendBasedRewardValueJpaRepository : JpaRepository<JpaPartnerSpendBasedRewardValueEntity, UUID> {
    fun findByPartnerSpendBasedRewardId(partnerSpendBasedRewardId: UUID): List<JpaPartnerSpendBasedRewardValueEntity>

    fun deleteByPartnerSpendBasedRewardId(partnerSpendBasedRewardId: UUID)
}
