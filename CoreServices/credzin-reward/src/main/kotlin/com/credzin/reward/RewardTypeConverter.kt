package com.credzin.reward

import jakarta.persistence.AttributeConverter
import jakarta.persistence.Converter

/**
 * JPA converter for RewardType enum.
 * Converts between RewardType enum instances and their string representations.
 */
@Converter(autoApply = true)
class RewardTypeConverter : AttributeConverter<RewardType, String> {
    override fun convertToDatabaseColumn(attribute: RewardType?): String? {
        return when (attribute) {
            RewardType.REWARD_POINT -> "REWARD_POINT"
            RewardType.AMOUNT -> "AMOUNT"
            RewardType.VOUCHER -> "VOUCHER"
            null -> null
        }
    }

    override fun convertToEntityAttribute(dbData: String?): RewardType? {
        return when (dbData) {
            "REWARD_POINT" -> RewardType.REWARD_POINT
            "AMOUNT" -> RewardType.AMOUNT
            "VOUCHER" -> RewardType.VOUCHER
            // Legacy support for old values during migration
            "SPEND_REWARD_STANDARD", "SPEND_REWARD_PARTNER", "SPEND_REWARD_TRANSACTION_CHANNEL" -> RewardType.REWARD_POINT
            "MILESTONE_REWARD", "PARTNER_PLATFORM_REWARD" -> RewardType.REWARD_POINT
            null -> null
            else -> throw IllegalArgumentException("Unknown RewardType: $dbData")
        }
    }
}