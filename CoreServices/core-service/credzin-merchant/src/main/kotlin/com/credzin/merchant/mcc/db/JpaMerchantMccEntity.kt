package com.credzin.merchant.mcc.db

import com.credzin.merchant.common.db.Auditable
import com.credzin.merchant.mcc.domain.MerchantMccEntity
import jakarta.persistence.*
import java.util.UUID

@Entity
@Table(schema = "merchant", name = "merchant_mcc")
data class JpaMerchantMccEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: UUID? = null,

    @Column(nullable = false)
    val merchantId: UUID,

    @Column(nullable = false)
    val mccCode: Int,
) : Auditable() {
    companion object {
        fun fromDomain(domain: MerchantMccEntity) = JpaMerchantMccEntity(
            id = domain.id,
            merchantId = domain.merchantId,
            mccCode = domain.mccCode,
        )
    }
}