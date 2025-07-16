package com.credzin.merchant.mcc.usecase

import com.credzin.merchant.mcc.domain.MerchantMccAggregate
import com.credzin.merchant.mcc.domain.MerchantMccRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.util.UUID

@Component
class MerchantCodeRemove(
    private val merchantMccRepository: MerchantMccRepository
) {

    private companion object {
        private val logger = LoggerFactory.getLogger(MerchantCodeRemove::class.java)
    }

    fun remove(merchantId: UUID, mccCode: Int) {
        logger.info("Removing MCC code $mccCode for merchant $merchantId")
        val aggregate = MerchantMccAggregate(merchantId, merchantMccRepository)
        aggregate.removeMccCode(mccCode)
    }
}
