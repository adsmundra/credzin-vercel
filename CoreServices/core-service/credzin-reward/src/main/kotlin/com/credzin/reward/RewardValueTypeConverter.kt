package com.credzin.reward

import jakarta.persistence.AttributeConverter
import jakarta.persistence.Converter

/**
 * JPA converter for RewardValueType enum.
 * Converts between RewardValueType enum instances and their string representations.
 */
@Converter(autoApply = true)
class RewardValueTypeConverter : AttributeConverter<RewardValueType, String> {
    override fun convertToDatabaseColumn(attribute: RewardValueType?): String? {
        return when (attribute) {
            RewardValueType.REWARD_POINT -> "REWARD_POINT"
            RewardValueType.AMOUNT -> "AMOUNT"
            RewardValueType.VOUCHER -> "VOUCHER"
            null -> null
        }
    }

    override fun convertToEntityAttribute(dbData: String?): RewardValueType? {
        return when (dbData) {
            "REWARD_POINT" -> RewardValueType.REWARD_POINT
            "AMOUNT" -> RewardValueType.AMOUNT
            "VOUCHER" -> RewardValueType.VOUCHER
            // Legacy support for old values during migration
            "SPEND_REWARD_STANDARD", "SPEND_REWARD_PARTNER", "SPEND_REWARD_TRANSACTION_CHANNEL" -> RewardValueType.REWARD_POINT
            "MILESTONE_REWARD", "PARTNER_PLATFORM_REWARD" -> RewardValueType.REWARD_POINT
            null -> null
            else -> throw IllegalArgumentException("Unknown RewardValueType: $dbData")
        }
    }
}