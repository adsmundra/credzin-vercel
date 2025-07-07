package com.credzin.merchant.mcc.db

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface JpaMerchantMccRepository : JpaRepository<JpaMerchantMccEntity, UUID> {
    fun findByMerchantId(merchantId: UUID): List<JpaMerchantMccEntity>
}