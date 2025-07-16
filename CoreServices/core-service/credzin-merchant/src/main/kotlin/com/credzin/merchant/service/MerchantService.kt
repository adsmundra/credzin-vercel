package com.credzin.merchant.service

import com.credzin.merchant.domain.MerchantEntity
import com.credzin.merchant.domain.MerchantRepository
import com.credzin.merchant.db.JpaMerchantEntity
import com.credzin.merchant.db.JpaMerchantRepository
import com.credzin.merchant.domain.MerchantCreateInput
import org.springframework.stereotype.Service
import java.util.*

@Service
class MerchantService(
    private val jpaMerchantRepository: JpaMerchantRepository
) : MerchantRepository {
    override fun findById(id: UUID): MerchantEntity? =
        jpaMerchantRepository.findById(id).orElse(null)?.toDomain()

    override fun save(merchantCreateInput: MerchantCreateInput): MerchantEntity {
        val entity = JpaMerchantEntity(
            legalName = merchantCreateInput.legalName,
            category = merchantCreateInput.merchantCategoryGroup,
            status = com.credzin.merchant.domain.MerchantStatus.CREATED // Assuming initial status is CREATED
        )
        return jpaMerchantRepository.save(entity).toDomain()
    }

    override fun findAll(): List<MerchantEntity> =
        jpaMerchantRepository.findAll().map { it.toDomain() }

    override fun findByName(name: String): MerchantEntity? =
        jpaMerchantRepository.findByLegalName(name)?.toDomain()

    // Note: deleteById was present in the original file, but not in the MerchantRepository interface. Removing it.
}

private fun JpaMerchantEntity.toDomain() = MerchantEntity(
    id = this.id,
    legalName = this.legalName,
    category = this.category,
    status = this.status
)