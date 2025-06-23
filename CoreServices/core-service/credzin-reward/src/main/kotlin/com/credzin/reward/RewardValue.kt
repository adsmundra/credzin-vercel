package com.credzin.reward

import com.credzin.common.Amount
import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo

/**
 * Sealed class representing different types of reward values.
 * Corresponds to the GraphQL RewardValue union.
 */
@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "type",
)
@JsonSubTypes(
    JsonSubTypes.Type(value = RewardPointValue::class, name = "RewardPointValue"),
    JsonSubTypes.Type(value = AmountRewardValue::class, name = "AmountRewardValue"),
    JsonSubTypes.Type(value = VoucherRewardValue::class, name = "VoucherRewardValue"),
)
sealed class RewardValue

/**
 * Points-based reward value.
 * Corresponds to the GraphQL RewardPointValue type.
 */
data class RewardPointValue(
    val rewardPoint: RewardPoint,
) : RewardValue()

/**
 * Amount-based reward value.
 * Corresponds to the GraphQL AmountRewardValue type.
 */
data class AmountRewardValue(
    val amount: Amount,
) : RewardValue()

/**
 * Voucher-based reward value.
 * Corresponds to the GraphQL VoucherRewardValue type.
 */
data class VoucherRewardValue(
    val voucher: Voucher,
) : RewardValue()

/**
 * Reward point data class.
 * Corresponds to the GraphQL RewardPoint type.
 */
data class RewardPoint(
    val type: RewardPointType,
    val value: Float,
    val valueType: RewardValueType,
)

/**
 * Reward point type enum.
 * Corresponds to the GraphQL RewardPointType enum.
 */
enum class RewardPointType {
    STANDARD,
    CASHBACK,
    BONUS,
}

// Supporting data classes for external domains (with just ID as requested)

/**
 * Voucher data class from products domain.
 * Corresponds to the GraphQL Voucher type.
 */
data class Voucher(
    val id: java.util.UUID,
    val reference: String? = null,
    val provider: VoucherProvider? = null,
    val image: String? = null,
)

/**
 * Voucher provider enum.
 * Corresponds to the GraphQL VoucherProvider enum.
 */
enum class VoucherProvider {
    AMAZON_SHOPPING,
    TAJ_HOTELS,
    AMAZON_PAY,
}
