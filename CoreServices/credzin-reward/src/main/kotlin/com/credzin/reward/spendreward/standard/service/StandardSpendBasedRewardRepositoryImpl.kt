package com.credzin.reward.spendreward.standard.service

import com.credzin.reward.Reward
import com.credzin.reward.RewardPointValue
import com.credzin.reward.RewardTransactionCreateInput
import com.credzin.reward.RewardValue
import com.credzin.reward.spendreward.standard.db.JpaStandardSpendBasedRewardEntity
import com.credzin.reward.spendreward.standard.db.StandardSpendBasedRewardJpaRepository
import com.credzin.reward.spendreward.standard.domain.StandardSpendBasedRewardEntity
import com.credzin.reward.spendreward.standard.domain.StandardSpendBasedRewardRepository
import org.springframework.stereotype.Component

@Component
class StandardSpendBasedRewardRepositoryImpl(
    private val jpaRepository: StandardSpendBasedRewardJpaRepository,
) : StandardSpendBasedRewardRepository {
    override fun create(
        input: RewardTransactionCreateInput,
        reward: RewardValue,
    ): StandardSpendBasedRewardEntity {
        // Convert RewardValue to RewardPointValue (standard rewards should always be points)
        val rewardPointValue =
            when (reward) {
                is RewardPointValue -> reward
                else -> throw IllegalArgumentException("Standard spend rewards must be RewardPointValue, got: ${reward::class.simpleName}")
            }

        // Create Reward object with RewardValue and auto-derived RewardType
        val rewardObj = Reward.create(rewardPointValue)

        // Create domain entity
        val domainEntity =
            StandardSpendBasedRewardEntity(
                transactionId = input.transactionId,
                reward = rewardObj,
            )

        // Convert to JPA entity and save
        val jpaEntity = JpaStandardSpendBasedRewardEntity.fromDomainEntity(domainEntity)
        val savedJpaEntity = jpaRepository.save(jpaEntity)

        // Convert back to domain entity and return
        return savedJpaEntity.toDomainEntity()
    }
}
