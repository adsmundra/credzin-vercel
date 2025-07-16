package com.credzin.reward.milestonereward.spendbased.db.embeddable

import com.credzin.reward.milestonereward.spendbased.domain.MilestoneSpendBasedOrder
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import jakarta.persistence.AttributeConverter
import jakarta.persistence.Converter

@Converter(autoApply = false)
class MilestoneSpendBasedOrderConverter : AttributeConverter<MilestoneSpendBasedOrder, String> {
    private val objectMapper = jacksonObjectMapper()

    override fun convertToDatabaseColumn(attribute: MilestoneSpendBasedOrder?): String? {
        return attribute?.let { objectMapper.writeValueAsString(it) }
    }

    override fun convertToEntityAttribute(dbData: String?): MilestoneSpendBasedOrder? {
        return dbData?.let { objectMapper.readValue(it, MilestoneSpendBasedOrder::class.java) }
    }
}

