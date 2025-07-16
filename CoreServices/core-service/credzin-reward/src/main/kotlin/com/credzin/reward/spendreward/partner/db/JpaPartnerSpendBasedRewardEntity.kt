package com.credzin.reward.spendreward.partner.db

import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import java.time.LocalDateTime
import java.util.*

/**
 * JPA entity for Partner Spend Based Reward.
 * Maps to the partner_spend_based_reward table in the database.
 */
@Entity
@Table(schema = "reward", name = "partner_spend_based_reward")
data class JpaPartnerSpendBasedRewardEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "UUID")
    val id: UUID? = null,
    @Column(name = "transaction_id", nullable = false, columnDefinition = "UUID")
    val transactionId: UUID,
    @Column(name = "partner_id", nullable = false, columnDefinition = "UUID")
    val partnerId: UUID,
    @ElementCollection
    @CollectionTable(name = "partner_spend_based_reward_ids", joinColumns = [JoinColumn(name = "partner_spend_based_reward_id")])
    @Column(name = "reward_id", columnDefinition = "UUID")
    val rewardIds: List<UUID> = emptyList(),
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime? = null,
) {
    /**
     * Default constructor for JPA.
     */
    constructor() : this(
        id = null,
        transactionId = UUID.randomUUID(),
        partnerId = UUID.randomUUID(),
        rewardIds = emptyList(),
    )

    /**
     * Converts this JPA entity to the domain entity.
     * Note: This only includes the reward IDs.
     * The caller needs to fetch actual rewards separately.
     */
    fun toDomainEntityWithIds(): com.credzin.reward.spendreward.partner.domain.PartnerSpendBasedRewardEntity {
        return com.credzin.reward.spendreward.partner.domain.PartnerSpendBasedRewardEntity(
            id = this.id,
            transactionId = this.transactionId,
            partnerId = this.partnerId,
            rewards = emptyList(), // Will be populated by caller
            rewardIds = this.rewardIds,
        )
    }

    companion object {
        /**
         * Creates a JPA entity from the domain entity with reward IDs.
         */
        fun fromDomainEntityWithIds(
            domainEntity: com.credzin.reward.spendreward.partner.domain.PartnerSpendBasedRewardEntity,
            rewardIds: List<UUID>,
        ): JpaPartnerSpendBasedRewardEntity {
            return JpaPartnerSpendBasedRewardEntity(
                id = domainEntity.id,
                transactionId = domainEntity.transactionId,
                partnerId = domainEntity.partnerId,
                rewardIds = rewardIds,
            )
        }
    }
}
