package com.credzin.merchant.merchantcategorycode.db

import com.credzin.merchant.common.db.Auditable
import com.credzin.merchant.CardNetwork
import com.credzin.merchant.merchantcategorycode.domain.MerchantCategoryCodeEntity
import jakarta.persistence.*
import java.util.UUID

@Entity
@Table(schema = "merchant", name = "merchant_category_code")
data class JpaMerchantCategoryCodeEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: UUID? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "card_network", nullable = false)
    val cardNetwork: CardNetwork,

    @Column(nullable = false)
    val code: Int,

    @Column(nullable = false)
    val description: String,
) : Auditable() {
    companion object {
        fun fromDomain(domain: MerchantCategoryCodeEntity) = JpaMerchantCategoryCodeEntity(
            id = domain.id,
            cardNetwork = domain.cardNetwork,
            code = domain.code,
            description = domain.description,
        )
    }
}
