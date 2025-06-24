package com.credzin.reward.spendreward.partner.db

import com.credzin.reward.RewardType
import com.credzin.reward.RewardTypeConverter
import com.credzin.reward.RewardValue
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.UpdateTimestamp
import java.time.LocalDateTime
import java.util.*

/**
 * JPA entity for Partner Spend Based Reward Value.
 * Maps to the partner_spend_based_reward_value table in the database.
 */
@Entity
@Table(name = "partner_spend_based_reward_value")
data class JpaPartnerSpendBasedRewardValueEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "UUID")
    val id: UUID? = null,
    @Convert(converter = RewardTypeConverter::class)
    @Column(name = "reward_type", nullable = false)
    val rewardType: RewardType,
    @Column(name = "reward_value", nullable = false, columnDefinition = "text")
    val rewardValue: String,
    @Column(name = "partner_spend_based_reward_id", nullable = false, columnDefinition = "UUID")
    val partnerSpendBasedRewardId: UUID,
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime? = null,
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    val updatedAt: LocalDateTime? = null,
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
            val rewardType =
                when (rewardValue) {
                    is com.credzin.reward.RewardPointValue -> RewardType.REWARD_POINT
                    is com.credzin.reward.AmountRewardValue -> RewardType.AMOUNT
                    is com.credzin.reward.VoucherRewardValue -> RewardType.VOUCHER
                }
            return JpaPartnerSpendBasedRewardValueEntity(
                rewardType = rewardType,
                rewardValue = jacksonObjectMapper().writeValueAsString(rewardValue),
                partnerSpendBasedRewardId = partnerSpendBasedRewardId,
            )
        }
    }
}
