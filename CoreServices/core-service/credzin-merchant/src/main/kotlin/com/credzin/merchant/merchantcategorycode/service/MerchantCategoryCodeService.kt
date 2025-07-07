package com.credzin.merchant.merchantcategorycode.service

import com.credzin.merchant.CardNetwork
import com.credzin.merchant.merchantcategorycode.domain.MerchantCategoryCodeEntity
import com.credzin.merchant.merchantcategorycode.domain.MerchantCategoryCodeRepository
import com.credzin.merchant.merchantcategorycode.db.JpaMerchantCategoryCodeEntity
import com.credzin.merchant.merchantcategorycode.db.JpaMerchantCategoryCodeRepository
import com.credzin.merchant.merchantcategorycode.domain.MerchantCategoryCodeCreateInput
import org.springframework.stereotype.Service
import java.util.*

@Service
class MerchantCategoryCodeService(
    private val jpaMerchantCategoryCodeRepository: JpaMerchantCategoryCodeRepository
) : MerchantCategoryCodeRepository {
    override fun findById(id: UUID): MerchantCategoryCodeEntity? =
        jpaMerchantCategoryCodeRepository.findById(id).orElse(null)?.toDomain()

    override fun create(merchantCategoryCodeCreateInput: MerchantCategoryCodeCreateInput): MerchantCategoryCodeEntity {
        val entity = JpaMerchantCategoryCodeEntity(
            cardNetwork = merchantCategoryCodeCreateInput.cardNetwork,
            code = merchantCategoryCodeCreateInput.code,
            description = merchantCategoryCodeCreateInput.description
        )
        return jpaMerchantCategoryCodeRepository.save(entity).toDomain()
    }

    override fun findAll(): List<MerchantCategoryCodeEntity> =
        jpaMerchantCategoryCodeRepository.findAll().map { it.toDomain() }

    override fun findByCodeAndCardNetwork(code: Int, cardNetwork: CardNetwork): MerchantCategoryCodeEntity? =
        jpaMerchantCategoryCodeRepository.findByCodeAndCardNetwork(code, cardNetwork)?.toDomain()
}

private fun JpaMerchantCategoryCodeEntity.toDomain() = MerchantCategoryCodeEntity(
    id = this.id,
    cardNetwork = this.cardNetwork,
    code = this.code,
    description = this.description,
)
