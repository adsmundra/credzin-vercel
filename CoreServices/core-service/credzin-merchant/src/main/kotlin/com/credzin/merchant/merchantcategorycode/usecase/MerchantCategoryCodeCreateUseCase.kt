package com.credzin.merchant.merchantcategorycode.usecase

import com.credzin.merchant.merchantcategorycode.domain.MerchantCategoryCodeAggregate
import com.credzin.merchant.merchantcategorycode.domain.MerchantCategoryCodeCreateInput
import com.credzin.merchant.merchantcategorycode.domain.MerchantCategoryCodeRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Component
class MerchantCategoryCodeCreateUseCase(
    private val merchantCategoryCodeRepository: MerchantCategoryCodeRepository,
) {

    private companion object {
        private val logger = LoggerFactory.getLogger(MerchantCategoryCodeCreateUseCase::class.java)
    }

    fun create(
        merchantCategoryCodeCreateInput: MerchantCategoryCodeCreateInput
    ): MerchantCategoryCodeAggregate {
        logger.info("Creating merchant category code with input : $merchantCategoryCodeCreateInput")

        val merchantCategoryCode = merchantCategoryCodeRepository.findByCodeAndCardNetwork(merchantCategoryCodeCreateInput.code, merchantCategoryCodeCreateInput.cardNetwork)

        val merchantCategoryCodeAggregate = MerchantCategoryCodeAggregate(merchantCategoryCode)

        merchantCategoryCodeAggregate.create(merchantCategoryCodeCreateInput, merchantCategoryCodeRepository)

        return merchantCategoryCodeAggregate
    }
}
