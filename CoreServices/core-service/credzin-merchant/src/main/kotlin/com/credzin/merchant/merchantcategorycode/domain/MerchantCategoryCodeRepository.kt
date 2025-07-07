package com.credzin.merchant.merchantcategorycode.domain

import com.credzin.merchant.CardNetwork
import java.util.UUID

interface MerchantCategoryCodeRepository {
    fun findById(id: UUID): MerchantCategoryCodeEntity?
    fun create(merchantCategoryCodeCreateInput: MerchantCategoryCodeCreateInput): MerchantCategoryCodeEntity
    fun findAll(): List<MerchantCategoryCodeEntity>
    fun findByCodeAndCardNetwork(code: Int, cardNetwork: CardNetwork): MerchantCategoryCodeEntity?
}