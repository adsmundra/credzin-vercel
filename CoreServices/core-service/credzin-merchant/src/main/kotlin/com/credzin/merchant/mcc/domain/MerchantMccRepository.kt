package com.credzin.merchant.mcc.domain

import java.util.UUID

interface MerchantMccRepository {
    fun findByMerchantId(merchantId: UUID): List<MerchantMccEntity>
    fun save(merchantMccEntity: MerchantMccEntity): MerchantMccEntity
    fun delete(merchantMccEntity: MerchantMccEntity)
}
