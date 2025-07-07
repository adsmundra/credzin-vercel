package com.credzin.reward.spendreward.partner.service

import com.credzin.reward.Reward
import com.credzin.reward.RewardTransactionCreateInput
import com.credzin.reward.RewardValue
import com.credzin.reward.spendreward.partner.db.JpaPartnerSpendBasedRewardEntity
import com.credzin.reward.spendreward.partner.db.JpaPartnerSpendBasedRewardValueEntity
import com.credzin.reward.spendreward.partner.db.PartnerSpendBasedRewardJpaRepository
import com.credzin.reward.spendreward.partner.db.PartnerSpendBasedRewardValueJpaRepository
import com.credzin.reward.spendreward.partner.domain.PartnerSpendBasedRewardEntity
import com.credzin.reward.spendreward.partner.domain.PartnerSpendBasedRewardRepository
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Component
class PartnerSpendBasedRewardRepositoryImpl(
    private val jpaRepository: PartnerSpendBasedRewardJpaRepository,
    private val rewardValueRepository: PartnerSpendBasedRewardValueJpaRepository,
) : PartnerSpendBasedRewardRepository {
    @Transactional
    override fun create(
        input: RewardTransactionCreateInput,
        rewards: List<RewardValue>,
    ): PartnerSpendBasedRewardEntity {
        // For partner rewards, we need to derive the partner ID from the transaction context
        // Currently using merchant ID as partner ID - this should be updated based on business requirements
        // Future implementation should include proper partner resolution logic that maps merchants to partners
        val partnerId = input.merchantInput.id

        // Create Reward objects from RewardValues
        val rewardObjects =
            rewards.map { rewardValue ->
                Reward.create(rewardValue)
            }

        // Create domain entity without reward IDs first
        val domainEntity =
            PartnerSpendBasedRewardEntity(
                transactionId = input.transactionId,
                partnerId = partnerId,
                rewards = rewardObjects,
                rewardIds = emptyList(), // Will be populated after saving
            )

        // Convert to JPA entity and save main entity first (without reward IDs)
        val jpaEntity = JpaPartnerSpendBasedRewardEntity.fromDomainEntityWithIds(domainEntity, emptyList())
        val savedJpaEntity = jpaRepository.save(jpaEntity)

        // Now save the reward values with the parent entity ID
        val rewardValueEntities = rewards.map { rewardValue ->
            JpaPartnerSpendBasedRewardValueEntity.fromDomainRewardValue(
                rewardValue = rewardValue,
                partnerSpendBasedRewardId = savedJpaEntity.id!!
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
     * Fetch rewards by partner spend based reward ID.
     */
    fun fetchRewardsByPartnerSpendBasedRewardId(partnerSpendBasedRewardId: UUID): List<Reward> {
        val rewardValueEntities = rewardValueRepository.findByPartnerSpendBasedRewardId(partnerSpendBasedRewardId)
        return rewardValueEntities.map { entity ->
            val rewardValue = entity.toDomainRewardValue()
            Reward.create(rewardValue)
        }
    }
}
