package com.credzin.merchant.db

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface JpaMerchantRepository : JpaRepository<JpaMerchantEntity, UUID> {
    fun findByLegalName(legalName: String): JpaMerchantEntity?
}