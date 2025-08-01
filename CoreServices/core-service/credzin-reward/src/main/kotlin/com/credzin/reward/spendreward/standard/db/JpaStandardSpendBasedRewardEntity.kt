package com.credzin.reward.spendreward.standard.db

import com.credzin.reward.Reward
import com.credzin.reward.RewardValueType
import com.credzin.reward.RewardValueTypeConverter
import com.credzin.reward.RewardValue
import com.credzin.reward.spendreward.standard.domain.StandardSpendBasedRewardEntity
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import java.time.LocalDateTime
import java.util.*

/**
 * JPA entity for Standard Spend Based Reward.
 * Maps to the standard_spend_based_reward table in the database.
 */
@Entity
@Table(schema = "reward", name = "standard_spend_based_reward")
@Suppress("JpaDataSourceORMInspection") // Kotlin JPA plugin generates no-arg constructor at compile-time
data class JpaStandardSpendBasedRewardEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "UUID")
    val id: UUID? = null,
    @Column(name = "transaction_id", nullable = false, columnDefinition = "UUID")
    val transactionId: UUID,
    @Convert(converter = RewardValueTypeConverter::class)
    @Column(name = "reward_value_type", nullable = false)
    val rewardValueType: RewardValueType,
    @Column(name = "reward_value", nullable = false, columnDefinition = "text")
    val rewardValue: String,
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime? = null,
) {
    /**
     * Converts this JPA entity to the domain entity.
     */
    fun toDomainEntity(): StandardSpendBasedRewardEntity {
        val rewardValueObj = jacksonObjectMapper().readValue(this.rewardValue, RewardValue::class.java)
        val reward =
            Reward(
                reward = rewardValueObj,
                type = this.rewardValueType,
            )
        return StandardSpendBasedRewardEntity(
            id = this.id,
            transactionId = this.transactionId,
            reward = reward,
        )
    }

    companion object {
        /**
         * Creates a JPA entity from the domain entity.
         */
        fun fromDomainEntity(domainEntity: StandardSpendBasedRewardEntity): JpaStandardSpendBasedRewardEntity {
            return JpaStandardSpendBasedRewardEntity(
                id = domainEntity.id,
                transactionId = domainEntity.transactionId,
                rewardValueType = domainEntity.reward.type,
                rewardValue = jacksonObjectMapper().writeValueAsString(domainEntity.reward.reward),
            )
        }
    }
}
