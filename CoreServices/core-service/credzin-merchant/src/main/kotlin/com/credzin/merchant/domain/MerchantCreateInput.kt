package com.credzin.merchant.domain

import java.util.UUID

data class MerchantCreateInput(
    val legalName: String,
    val merchantCategoryCodeIds: List<UUID>?,
    val merchantCategoryGroup: MerchantCategoryGroup,
)
