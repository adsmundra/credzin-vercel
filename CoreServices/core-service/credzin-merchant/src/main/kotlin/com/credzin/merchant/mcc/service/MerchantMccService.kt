package com.credzin.merchant.mcc.service

import com.credzin.merchant.mcc.db.JpaMerchantMccEntity
import com.credzin.merchant.mcc.db.JpaMerchantMccRepository
import com.credzin.merchant.mcc.domain.MerchantMccEntity
import com.credzin.merchant.mcc.domain.MerchantMccRepository
import org.springframework.stereotype.Service
import java.util.UUID

@Service
class MerchantMccService(
    private val jpaMerchantMccRepository: JpaMerchantMccRepository
) : MerchantMccRepository {
    override fun findByMerchantId(merchantId: UUID): List<MerchantMccEntity> =
        jpaMerchantMccRepository.findByMerchantId(merchantId).map { it.toDomain() }

    override fun save(merchantMccEntity: MerchantMccEntity): MerchantMccEntity {
        return jpaMerchantMccRepository.save(JpaMerchantMccEntity.fromDomain(merchantMccEntity)).toDomain()
    }

    override fun delete(merchantMccEntity: MerchantMccEntity) {
        jpaMerchantMccRepository.delete(JpaMerchantMccEntity.fromDomain(merchantMccEntity))
    }
}

private fun JpaMerchantMccEntity.toDomain() = MerchantMccEntity(
    id = this.id,
    merchantId = this.merchantId,
    mccCode = this.mccCode,
)
