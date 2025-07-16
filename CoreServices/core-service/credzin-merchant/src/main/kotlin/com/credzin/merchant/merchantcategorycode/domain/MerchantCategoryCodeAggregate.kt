package com.credzin.merchant.merchantcategorycode.domain

import org.slf4j.LoggerFactory

class MerchantCategoryCodeAggregate(
    private var merchantCategoryCodeEntity: MerchantCategoryCodeEntity? = null
) {

    private companion object {
        private val logger = LoggerFactory.getLogger(MerchantCategoryCodeAggregate::class.java)
    }

    fun create(
        merchantCategoryCodeCreateInput: MerchantCategoryCodeCreateInput,
        merchantCategoryCodeRepository: MerchantCategoryCodeRepository,
    ) {
        logger.info("Create merchant category code for request = $merchantCategoryCodeCreateInput")

        require(merchantCategoryCodeEntity == null) {
            "Merchant category code already exists."
        }

        this.merchantCategoryCodeEntity = merchantCategoryCodeRepository.create(merchantCategoryCodeCreateInput)
    }
}
