package com.credzin.merchant.merchantcategorycode.domain

import com.credzin.merchant.CardNetwork
import java.util.UUID

data class MerchantCategoryCodeEntity(
    val id: UUID?,
    val cardNetwork: CardNetwork,
    val code: Int,
    val description: String,
)