package com.credzin.merchant.domain

import java.util.*

data class MerchantEntity(
    val id: UUID?,
    val legalName: String,
    val category: MerchantCategoryGroup,
    val status: MerchantStatus,
)