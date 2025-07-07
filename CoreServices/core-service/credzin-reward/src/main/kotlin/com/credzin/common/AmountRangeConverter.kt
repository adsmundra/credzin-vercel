package com.credzin.common

import com.credzin.reward.AmountRange
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import jakarta.persistence.AttributeConverter
import jakarta.persistence.Converter

@Converter(autoApply = false)
class AmountRangeConverter : AttributeConverter<AmountRange, String> {
    private val objectMapper = jacksonObjectMapper()

    override fun convertToDatabaseColumn(attribute: AmountRange?): String? {
        return attribute?.let { objectMapper.writeValueAsString(it) }
    }

    override fun convertToEntityAttribute(dbData: String?): AmountRange? {
        return dbData?.let { objectMapper.readValue(it, AmountRange::class.java) }
    }
}