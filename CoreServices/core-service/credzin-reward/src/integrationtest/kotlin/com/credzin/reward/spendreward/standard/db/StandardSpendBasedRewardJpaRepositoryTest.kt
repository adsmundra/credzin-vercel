package com.credzin.reward.spendreward.standard.db

import com.credzin.reward.*
import com.credzin.reward.config.JpaTestApplication
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.ContextConfiguration
import java.util.*

/**
 * Integration test for StandardSpendBasedRewardJpaRepository.
 * Tests the database layer for standard spend-based rewards.
 */
@DataJpaTest
@ActiveProfiles("test")
@ContextConfiguration(classes = [JpaTestApplication::class])
class StandardSpendBasedRewardJpaRepositoryTest {
    @Autowired
    private lateinit var entityManager: TestEntityManager

    @Autowired
    private lateinit var repository: StandardSpendBasedRewardJpaRepository

    @Test
    fun `should save and retrieve standard spend based reward`() {
        // Given
        val transactionId = UUID.randomUUID()
        val rewardPointValue =
            RewardPointValue(
                rewardPoint =
                    RewardPoint(
                        type = RewardPointType.STANDARD,
                        value = 100.0f,
                        valueType = RewardChargeType.ABSOLUTE,
                    ),
            )

        val entity =
            JpaStandardSpendBasedRewardEntity(
                transactionId = transactionId,
                rewardValueType = RewardValueType.REWARD_POINT,
                rewardValue = jacksonObjectMapper().writeValueAsString(rewardPointValue),
            )

        // When
        val savedEntity = repository.save(entity)
        entityManager.flush()
        entityManager.clear()

        // Then
        assertNotNull(savedEntity.id)
        assertEquals(transactionId, savedEntity.transactionId)
        assertEquals(RewardValueType.REWARD_POINT, savedEntity.rewardValueType)

        // Verify JSON conversion works
        val domainEntity = savedEntity.toDomainEntity()
        assertEquals(transactionId, domainEntity.transactionId)
        assertEquals(RewardPointType.STANDARD, (domainEntity.reward.reward as RewardPointValue).rewardPoint.type)
        assertEquals(100.0f, (domainEntity.reward.reward as RewardPointValue).rewardPoint.value)
        assertEquals(RewardChargeType.ABSOLUTE, (domainEntity.reward.reward as RewardPointValue).rewardPoint.valueType)
    }

    @Test
    fun `should find by transaction id`() {
        // Given
        val transactionId = UUID.randomUUID()
        val rewardPointValue =
            RewardPointValue(
                rewardPoint =
                    RewardPoint(
                        type = RewardPointType.CASHBACK,
                        value = 50.0f,
                        valueType = RewardChargeType.PERCENTAGE,
                    ),
            )

        val entity =
            JpaStandardSpendBasedRewardEntity(
                transactionId = transactionId,
                rewardValueType = RewardValueType.REWARD_POINT,
                rewardValue = jacksonObjectMapper().writeValueAsString(rewardPointValue),
            )

        repository.save(entity)
        entityManager.flush()

        // When
        val foundEntities = repository.findByTransactionId(transactionId)

        // Then
        assertEquals(1, foundEntities.size)
        assertEquals(transactionId, foundEntities[0].transactionId)

        // Verify JSON conversion
        val domainEntity = foundEntities[0].toDomainEntity()
        assertEquals(RewardPointType.CASHBACK, (domainEntity.reward.reward as RewardPointValue).rewardPoint.type)
        assertEquals(50.0f, (domainEntity.reward.reward as RewardPointValue).rewardPoint.value)
        assertEquals(RewardChargeType.PERCENTAGE, (domainEntity.reward.reward as RewardPointValue).rewardPoint.valueType)
    }

    @Test
    fun `should handle different reward point types`() {
        // Given
        val transactionId = UUID.randomUUID()

        val standardRewardValue =
            RewardPointValue(
                rewardPoint =
                    RewardPoint(
                        type = RewardPointType.STANDARD,
                        value = 100.0f,
                        valueType = RewardChargeType.ABSOLUTE,
                    ),
            )

        val cashbackRewardValue =
            RewardPointValue(
                rewardPoint =
                    RewardPoint(
                        type = RewardPointType.CASHBACK,
                        value = 5.0f,
                        valueType = RewardChargeType.PERCENTAGE,
                    ),
            )

        val bonusRewardValue =
            RewardPointValue(
                rewardPoint =
                    RewardPoint(
                        type = RewardPointType.BONUS,
                        value = 200.0f,
                        valueType = RewardChargeType.ABSOLUTE,
                    ),
            )

        val entities =
            listOf(
                JpaStandardSpendBasedRewardEntity(
                    transactionId = transactionId,
                    rewardValueType = RewardValueType.REWARD_POINT,
                    rewardValue = jacksonObjectMapper().writeValueAsString(standardRewardValue),
                ),
                JpaStandardSpendBasedRewardEntity(
                    transactionId = transactionId,
                    rewardValueType = RewardValueType.REWARD_POINT,
                    rewardValue = jacksonObjectMapper().writeValueAsString(cashbackRewardValue),
                ),
                JpaStandardSpendBasedRewardEntity(
                    transactionId = transactionId,
                    rewardValueType = RewardValueType.REWARD_POINT,
                    rewardValue = jacksonObjectMapper().writeValueAsString(bonusRewardValue),
                ),
            )

        // When
        repository.saveAll(entities)
        entityManager.flush()

        val foundEntities = repository.findByTransactionId(transactionId)

        // Then
        assertEquals(3, foundEntities.size)

        val domainEntities = foundEntities.map { it.toDomainEntity() }
        val rewardTypes = domainEntities.map { (it.reward.reward as RewardPointValue).rewardPoint.type }.toSet()

        assertEquals(setOf(RewardPointType.STANDARD, RewardPointType.CASHBACK, RewardPointType.BONUS), rewardTypes)
    }

    @Test
    fun `should handle different value types`() {
        // Given
        val transactionId1 = UUID.randomUUID()
        val transactionId2 = UUID.randomUUID()

        val absoluteRewardValue =
            RewardPointValue(
                rewardPoint =
                    RewardPoint(
                        type = RewardPointType.STANDARD,
                        value = 150.0f,
                        valueType = RewardChargeType.ABSOLUTE,
                    ),
            )

        val percentageRewardValue =
            RewardPointValue(
                rewardPoint =
                    RewardPoint(
                        type = RewardPointType.STANDARD,
                        value = 2.5f,
                        valueType = RewardChargeType.PERCENTAGE,
                    ),
            )

        val absoluteEntity =
            JpaStandardSpendBasedRewardEntity(
                transactionId = transactionId1,
                rewardValueType = RewardValueType.REWARD_POINT,
                rewardValue = jacksonObjectMapper().writeValueAsString(absoluteRewardValue),
            )

        val percentageEntity =
            JpaStandardSpendBasedRewardEntity(
                transactionId = transactionId2,
                rewardValueType = RewardValueType.REWARD_POINT,
                rewardValue = jacksonObjectMapper().writeValueAsString(percentageRewardValue),
            )

        // When
        repository.saveAll(listOf(absoluteEntity, percentageEntity))
        entityManager.flush()

        // Then
        val absoluteResult = repository.findByTransactionId(transactionId1)[0].toDomainEntity()
        val percentageResult = repository.findByTransactionId(transactionId2)[0].toDomainEntity()

        assertEquals(RewardChargeType.ABSOLUTE, (absoluteResult.reward.reward as RewardPointValue).rewardPoint.valueType)
        assertEquals(150.0f, (absoluteResult.reward.reward as RewardPointValue).rewardPoint.value)

        assertEquals(RewardChargeType.PERCENTAGE, (percentageResult.reward.reward as RewardPointValue).rewardPoint.valueType)
        assertEquals(2.5f, (percentageResult.reward.reward as RewardPointValue).rewardPoint.value)
    }
}
