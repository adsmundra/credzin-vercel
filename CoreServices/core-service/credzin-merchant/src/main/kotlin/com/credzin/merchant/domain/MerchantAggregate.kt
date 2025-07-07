package com.credzin.merchant.domain

import org.slf4j.LoggerFactory

class MerchantAggregate(
    private val merchantRepository: MerchantRepository,
) {

    private companion object {
        private val logger = LoggerFactory.getLogger(MerchantAggregate::class.java)
    }

    fun create(
        merchantCreateInput: MerchantCreateInput,
    ): MerchantEntity {
        logger.info("Attempting to create merchant for request = $merchantCreateInput")

        val existingMerchant = merchantRepository.findByName(merchantCreateInput.legalName)

        require(existingMerchant == null) {
            "Merchant with legal name '${merchantCreateInput.legalName}' already exists."
        }

        val newMerchant = merchantRepository.save(merchantCreateInput)
        logger.info("Merchant created: ${newMerchant.legalName}")
        return newMerchant
    }

}