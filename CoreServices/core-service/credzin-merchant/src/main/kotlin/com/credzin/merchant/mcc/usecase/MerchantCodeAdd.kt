package com.credzin.merchant.mcc.usecase

import com.credzin.merchant.mcc.domain.MerchantMccAggregate
import com.credzin.merchant.mcc.domain.MerchantMccRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.util.UUID

@Component
class MerchantCodeAdd(
    private val merchantMccRepository: MerchantMccRepository
) {

    private companion object {
        private val logger = LoggerFactory.getLogger(MerchantCodeAdd::class.java)
    }

    fun add(merchantId: UUID, mccCode: Int) {
        logger.info("Adding MCC code $mccCode for merchant $merchantId")
        val aggregate = MerchantMccAggregate(merchantId, merchantMccRepository)
        aggregate.addMccCode(mccCode)
    }
}
