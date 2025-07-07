package com.credzin.merchant.mcc.domain

import org.slf4j.LoggerFactory
import java.util.UUID

class MerchantMccAggregate(
    private val merchantId: UUID,
    private val merchantMccRepository: MerchantMccRepository,
) {

    private companion object {
        private val logger = LoggerFactory.getLogger(MerchantMccAggregate::class.java)
    }

    fun addMccCode(mccCode: Int) {
        logger.info("Adding MCC code $mccCode for merchant $merchantId")
        val existingMccs = merchantMccRepository.findByMerchantId(merchantId)
        if (existingMccs.none { it.mccCode == mccCode }) {
            val newMcc = MerchantMccEntity(id = null, merchantId = merchantId, mccCode = mccCode)
            merchantMccRepository.save(newMcc)
            logger.info("MCC code $mccCode added for merchant $merchantId")
        } else {
            logger.warn("MCC code $mccCode already exists for merchant $merchantId")
        }
    }

    fun removeMccCode(mccCode: Int) {
        logger.info("Removing MCC code $mccCode for merchant $merchantId")
        val existingMccs = merchantMccRepository.findByMerchantId(merchantId)
        val mccToRemove = existingMccs.firstOrNull { it.mccCode == mccCode }
        if (mccToRemove != null) {
            merchantMccRepository.delete(mccToRemove)
            logger.info("MCC code $mccCode removed for merchant $merchantId")
        } else {
            logger.warn("MCC code $mccCode not found for merchant $merchantId")
        }
    }
}