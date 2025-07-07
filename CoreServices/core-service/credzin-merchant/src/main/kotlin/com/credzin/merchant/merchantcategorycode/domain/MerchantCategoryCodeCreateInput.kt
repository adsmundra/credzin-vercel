package com.credzin.merchant.merchantcategorycode.domain

import com.credzin.merchant.CardNetwork

data class MerchantCategoryCodeCreateInput(
    val cardNetwork: CardNetwork,
    val code: Int,
    val description: String,
)