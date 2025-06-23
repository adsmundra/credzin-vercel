package com.credzin.reward.spendreward.transactionchannel.service

import com.credzin.reward.Reward
import com.credzin.reward.RewardTransactionCreateInput
import com.credzin.reward.RewardValue
import com.credzin.reward.spendreward.transactionchannel.db.JpaTransactionChannelSpendBasedRewardEntity
import com.credzin.reward.spendreward.transactionchannel.db.JpaTransactionChannelSpendBasedRewardValueEntity
import com.credzin.reward.spendreward.transactionchannel.db.TransactionChannelSpendBasedRewardJpaRepository
import com.credzin.reward.spendreward.transactionchannel.db.TransactionChannelSpendBasedRewardValueJpaRepository
import com.credzin.reward.spendreward.transactionchannel.domain.TransactionChannelSpendBasedRewardEntity
import com.credzin.reward.spendreward.transactionchannel.domain.TransactionChannelSpendBasedRewardRepository
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Component
class TransactionChannelSpendBasedRewardRepositoryImpl(
    private val jpaRepository: TransactionChannelSpendBasedRewardJpaRepository,
    private val rewardValueRepository: TransactionChannelSpendBasedRewardValueJpaRepository,
) : TransactionChannelSpendBasedRewardRepository {
    @Transactional
    override fun create(
        input: RewardTransactionCreateInput,
        rewards: List<RewardValue>,
    ): TransactionChannelSpendBasedRewardEntity {
        // Get transaction channel type from metadata
        val transactionChannelType =
            input.transactionMetadata?.transactionChannel
                ?: throw IllegalArgumentException("Transaction channel type is required for transaction channel rewards")

        // Create Reward objects from RewardValues
        val rewardObjects =
            rewards.map { rewardValue ->
                Reward.create(rewardValue)
            }

        // Create domain entity without reward IDs first
        val domainEntity =
            TransactionChannelSpendBasedRewardEntity(
                transactionId = input.transactionId,
                transactionChannelType = transactionChannelType,
                rewards = rewardObjects,
                rewardIds = emptyList(), // Will be populated after saving
            )

        // Convert to JPA entity and save main entity first (without reward IDs)
        val jpaEntity = JpaTransactionChannelSpendBasedRewardEntity.fromDomainEntityWithIds(domainEntity, emptyList())
        val savedJpaEntity = jpaRepository.save(jpaEntity)

        // Now save the reward values with the parent entity ID
        val rewardValueEntities = rewards.map { rewardValue ->
            JpaTransactionChannelSpendBasedRewardValueEntity.fromDomainRewardValue(
                rewardValue = rewardValue,
                transactionChannelSpendBasedRewardId = savedJpaEntity.id!!
            )
        }
        val savedRewardValueEntities = rewardValueRepository.saveAll(rewardValueEntities)

        // Get the reward IDs from saved entities
        val rewardIds = savedRewardValueEntities.map { it.id!! }

        // Update the main entity with reward IDs
        val updatedJpaEntity = savedJpaEntity.copy(rewardIds = rewardIds)
        jpaRepository.save(updatedJpaEntity)

        return domainEntity.copy(
            id = savedJpaEntity.id,
            rewardIds = rewardIds
        )
    }

    /**
     * Fetch rewards by their IDs.
     */
    fun fetchRewards(rewardIds: List<UUID>): List<Reward> {
        val rewardValueEntities = rewardValueRepository.findAllById(rewardIds)
        return rewardValueEntities.map { entity ->
            val rewardValue = entity.toDomainRewardValue()
            Reward.create(rewardValue)
        }
    }

    /**
     * Fetch rewards by transaction channel spend based reward ID.
     */
    fun fetchRewardsByTransactionChannelSpendBasedRewardId(transactionChannelSpendBasedRewardId: UUID): List<Reward> {
        val rewardValueEntities = rewardValueRepository.findByTransactionChannelSpendBasedRewardId(transactionChannelSpendBasedRewardId)
        return rewardValueEntities.map { entity ->
            val rewardValue = entity.toDomainRewardValue()
            Reward.create(rewardValue)
        }
    }
}
