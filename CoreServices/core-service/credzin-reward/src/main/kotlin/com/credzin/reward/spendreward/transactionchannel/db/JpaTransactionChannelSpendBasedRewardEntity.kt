package com.credzin.reward.spendreward.transactionchannel.db

import com.credzin.reward.TransactionChannelType
import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import java.time.LocalDateTime
import java.util.*

/**
 * JPA entity for Transaction Channel Spend Based Reward.
 * Maps to the transaction_channel_spend_based_reward table in the database.
 */
@Entity
@Table(schema = "reward", name = "transaction_channel_spend_based_reward")
data class JpaTransactionChannelSpendBasedRewardEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "UUID")
    val id: UUID? = null,
    @Column(name = "transaction_id", nullable = false, columnDefinition = "UUID")
    val transactionId: UUID,
    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_channel_type", nullable = false)
    val transactionChannelType: TransactionChannelType,
    @ElementCollection
    @CollectionTable(
        name = "transaction_channel_spend_based_reward_ids",
        joinColumns = [JoinColumn(name = "transaction_channel_spend_based_reward_id")],
    )
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
        transactionChannelType = TransactionChannelType.OFFLINE,
        rewardIds = emptyList(),
    )

    /**
     * Converts this JPA entity to the domain entity.
     */
    fun toDomainEntityWithIds(): com.credzin.reward.spendreward.transactionchannel.domain.TransactionChannelSpendBasedRewardEntity {
        return com.credzin.reward.spendreward.transactionchannel.domain.TransactionChannelSpendBasedRewardEntity(
            id = this.id,
            transactionId = this.transactionId,
            transactionChannelType = this.transactionChannelType,
            rewards = emptyList(), // Will be populated by caller
            rewardIds = this.rewardIds,
        )
    }

    companion object {
        /**
         * Creates a JPA entity from the domain entity.
         */
        fun fromDomainEntityWithIds(
            domainEntity: com.credzin.reward.spendreward.transactionchannel.domain.TransactionChannelSpendBasedRewardEntity,
            rewardIds: List<UUID>,
        ): JpaTransactionChannelSpendBasedRewardEntity {
            return JpaTransactionChannelSpendBasedRewardEntity(
                id = domainEntity.id,
                transactionId = domainEntity.transactionId,
                transactionChannelType = domainEntity.transactionChannelType,
                rewardIds = rewardIds,
            )
        }
    }
}
