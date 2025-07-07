package com.credzin.merchant.db

import com.credzin.merchant.common.db.Auditable
import com.credzin.merchant.domain.MerchantCategoryGroup
import com.credzin.merchant.domain.MerchantStatus
import jakarta.persistence.*
import java.util.UUID

@Entity
@Table(schema = "merchant", name = "merchant")
data class JpaMerchantEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: UUID? = null,

    @Column(nullable = false)
    val legalName: String,

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    val category: MerchantCategoryGroup,

    @Enumerated(EnumType.STRING)
    val status: MerchantStatus,
) : Auditable() {
    companion object {
        fun fromDomain(domain: com.credzin.merchant.domain.MerchantEntity) = JpaMerchantEntity(
            id = domain.id,
            legalName = domain.legalName,
            category = domain.category,
            status = domain.status,
        )
    }
}