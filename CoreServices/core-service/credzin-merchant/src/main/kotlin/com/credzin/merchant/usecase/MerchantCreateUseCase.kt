package com.credzin.merchant.usecase

import com.credzin.merchant.domain.MerchantAggregate
import com.credzin.merchant.domain.MerchantCreateInput
import com.credzin.merchant.domain.MerchantRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Component
class MerchantCreateUseCase(
    private val merchantRepository: MerchantRepository,
) {

    private companion object {
        private val logger = LoggerFactory.getLogger(MerchantCreateUseCase::class.java)
    }

    fun create(
        merchantCreateInput: MerchantCreateInput
    ): MerchantAggregate {
        logger.info("Orchestrating merchant creation for input : $merchantCreateInput")

        val merchantAggregate = MerchantAggregate(merchantRepository)
        merchantAggregate.create(merchantCreateInput)

        return merchantAggregate
    }
}
