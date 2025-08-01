package com.credzin.reward.spendreward.partner.db

import com.credzin.reward.RewardValueType
import com.credzin.reward.RewardValueTypeConverter
import com.credzin.reward.RewardValue
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import java.time.LocalDateTime
import java.util.*

/**
 * JPA entity for Partner Spend Based Reward Value.
 * Maps to the partner_spend_based_reward_value table in the database.
 */
@Entity
@Table(schema = "reward", name = "partner_spend_based_reward_value")
data class JpaPartnerSpendBasedRewardValueEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "UUID")
    val id: UUID? = null,
    @Convert(converter = RewardValueTypeConverter::class)
    @Column(name = "reward_value_type", nullable = false)
    val rewardValueType: RewardValueType,
    @Column(name = "reward_value", nullable = false, columnDefinition = "text")
    val rewardValue: String,
    @Column(name = "partner_spend_based_reward_id", nullable = false, columnDefinition = "UUID")
    val partnerSpendBasedRewardId: UUID,
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime? = null,
) {
    /**
     * Converts this JPA entity to a domain RewardValue.
     */
    fun toDomainRewardValue(): com.credzin.reward.RewardValue {
        return jacksonObjectMapper().readValue(this.rewardValue, RewardValue::class.java)
    }

    companion object {
        /**
         * Creates a JPA entity from a domain RewardValue.
         */
        fun fromDomainRewardValue(
            rewardValue: com.credzin.reward.RewardValue,
            partnerSpendBasedRewardId: UUID,
        ): JpaPartnerSpendBasedRewardValueEntity {
            val rewardValueType =
                when (rewardValue) {
                    is com.credzin.reward.RewardPointValue -> RewardValueType.REWARD_POINT
                    is com.credzin.reward.AmountRewardValue -> RewardValueType.AMOUNT
                    is com.credzin.reward.VoucherRewardValue -> RewardValueType.VOUCHER
                }
            return JpaPartnerSpendBasedRewardValueEntity(
                rewardValueType = rewardValueType,
                rewardValue = jacksonObjectMapper().writeValueAsString(rewardValue),
                partnerSpendBasedRewardId = partnerSpendBasedRewardId,
            )
        }
    }
}
