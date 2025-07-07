package com.credzin.merchant.mcc.domain

import java.util.UUID

data class MerchantMccEntity(
    val id: UUID?,
    val merchantId: UUID,
    val mccCode: Int,
)
