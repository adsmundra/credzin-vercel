package com.credzin.merchant.merchantcategorycode.db

import com.credzin.merchant.CardNetwork
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface JpaMerchantCategoryCodeRepository : JpaRepository<JpaMerchantCategoryCodeEntity, UUID> {
    fun findByCodeAndCardNetwork(code: Int, cardNetwork: CardNetwork): JpaMerchantCategoryCodeEntity?
}
