package com.credzin.reward.milestonereward.spendbased.db.embeddable

import com.credzin.reward.TimePeriod
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import jakarta.persistence.AttributeConverter
import jakarta.persistence.Converter

@Converter(autoApply = false)
class TimePeriodConverter : AttributeConverter<TimePeriod, String> {
    private val objectMapper = jacksonObjectMapper()

    override fun convertToDatabaseColumn(attribute: TimePeriod?): String? {
        return attribute?.let { objectMapper.writeValueAsString(it) }
    }

    override fun convertToEntityAttribute(dbData: String?): TimePeriod? {
        return dbData?.let { objectMapper.readValue(it, TimePeriod::class.java) }
    }
}

