package com.credzin.reward.milestonereward.spendbased.service

import com.credzin.reward.RewardValue
import com.credzin.reward.milestonereward.spendbased.db.JpaMilestoneSpendBasedReward
import com.credzin.reward.milestonereward.spendbased.db.JpaMilestoneSpendBasedRewardDistance
import com.credzin.reward.milestonereward.spendbased.db.JpaMilestoneSpendBasedRewardDistanceRepository
import com.credzin.reward.milestonereward.spendbased.db.JpaMilestoneSpendBasedRewardRepository
import com.credzin.reward.milestonereward.spendbased.db.embeddable.JpaMilestoneSpendBased
import com.credzin.reward.milestonereward.spendbased.domain.*
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Component
class MilestoneSpendBasedRewardRepositoryImpl(
    private val jpaRewardRepository: JpaMilestoneSpendBasedRewardRepository,
    private val jpaDistanceRepository: JpaMilestoneSpendBasedRewardDistanceRepository,
) : MilestoneSpendBasedRewardRepository {

    private companion object {
        private val logger = LoggerFactory.getLogger(MilestoneSpendBasedRewardRepositoryImpl::class.java)
    }

    @Transactional
    override fun create(
        milestoneSpendBasedRewardEntityCreateInput: MilestoneSpendBasedRewardEntityCreateInput,
        distance: MilestoneSpendBaseRewardDistance
    ): MilestoneSpendBasedRewardEntity {
        // 1. Create and save the root reward entity
        val rewardToSave = JpaMilestoneSpendBasedReward(
            transactionId = milestoneSpendBasedRewardEntityCreateInput.transactionId
        )
        val savedReward = jpaRewardRepository.save(rewardToSave)
        // Use transactionId as the foreign key, which is a UUID
        val rewardId = savedReward.transactionId

        // 2. Use the new 'distance' parameter to create the distance entity
        val distanceToSave = Mapper.toJpa(distance, rewardId)
        val savedDistance = jpaDistanceRepository.save(distanceToSave)

        // 3. Combine both JPA entities into the domain entity to return
        return Mapper.toDomain(savedReward, savedDistance)
    }

    @Transactional(readOnly = true)
    override fun find(
        transactionId: UUID
    ): MilestoneSpendBasedRewardEntity? {
        // 1. Find the root reward entity
        val jpaReward = jpaRewardRepository.findByTransactionId(transactionId) ?: return null
        // Use transactionId as the foreign key to find distance
        val rewardId = jpaReward.transactionId

        // 2. Find the associated distance entity using the reward's transactionId
        val jpaDistance = jpaDistanceRepository.findByRewardId(rewardId)
            ?: throw IllegalStateException("Data inconsistency: Found JpaMilestoneSpendBasedReward with transactionId $rewardId but no matching JpaMilestoneSpendBasedRewardDistance.")

        // 3. Combine both into the domain entity
        return Mapper.toDomain(jpaReward, jpaDistance)
    }

    // Encapsulate all mapping logic within a private object
    private object Mapper {
        private val objectMapper: ObjectMapper = jacksonObjectMapper()
        fun toDomain(
            jpaReward: JpaMilestoneSpendBasedReward,
            jpaDistance: JpaMilestoneSpendBasedRewardDistance
        ): MilestoneSpendBasedRewardEntity {
            return MilestoneSpendBasedRewardEntity(
                id = jpaReward.id,
                transactionId = jpaReward.transactionId,
                currentMilestoneDelta = toDomain(jpaDistance)
            )
        }

        // Changed rewardId type to UUID
        fun toJpa(domainDistance: MilestoneSpendBaseRewardDistance, rewardId: UUID): JpaMilestoneSpendBasedRewardDistance {
            return JpaMilestoneSpendBasedRewardDistance(
                rewardId = rewardId,
                currentMilestoneSpendBased = domainDistance.currentMilestoneSpendBased?.let { toJpa(it) },
                previousMilestoneSpendBased = domainDistance.previousMilestoneSpendBased?.let { toJpa(it) },
                nextMilestoneSpendBased = domainDistance.nextMilestoneSpendBased?.let { toJpa(it) }
            )
        }

        fun toDomain(jpaDistance: JpaMilestoneSpendBasedRewardDistance): MilestoneSpendBaseRewardDistance {
            return MilestoneSpendBaseRewardDistance(
                currentMilestoneSpendBased = jpaDistance.currentMilestoneSpendBased?.let { toDomain(it) },
                previousMilestoneSpendBased = jpaDistance.previousMilestoneSpendBased?.let { toDomain(it) },
                nextMilestoneSpendBased = jpaDistance.nextMilestoneSpendBased?.let { toDomain(it) }
            )
        }

        fun toJpa(domainSpendBased: MilestoneSpendBased): JpaMilestoneSpendBased {
            return JpaMilestoneSpendBased(
                amountRange = domainSpendBased.amountRange,
                timePeriod = domainSpendBased.timePeriod,
                rewardValue = objectMapper.writeValueAsString(domainSpendBased.rewardValue),
                order = domainSpendBased.order
            )
        }

        fun toDomain(jpaSpendBased: JpaMilestoneSpendBased): MilestoneSpendBased {
            return MilestoneSpendBased(
                amountRange = jpaSpendBased.amountRange,
                timePeriod = jpaSpendBased.timePeriod,
                rewardValue = objectMapper.readValue(jpaSpendBased.rewardValue, RewardValue::class.java),
                order = jpaSpendBased.order
            )
        }

        
    }
}
