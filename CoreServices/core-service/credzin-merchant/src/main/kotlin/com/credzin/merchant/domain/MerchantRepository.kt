package com.credzin.merchant.domain

import java.util.*

/**
 * Repository interface for Merchant domain operations.
 */
interface MerchantRepository {
    fun findById(id: UUID): MerchantEntity?
    fun save(merchantCreateInput: MerchantCreateInput): MerchantEntity
    fun findAll(): List<MerchantEntity>
    fun findByName(name: String): MerchantEntity?
}

