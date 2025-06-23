package com.credzin.reward.spendreward.partner.db

import com.credzin.reward.config.JpaTestApplication
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.ContextConfiguration
import java.util.*

/**
 * Integration test for PartnerSpendBasedRewardJpaRepository.
 * Tests the database layer for partner spend-based rewards.
 */
@DataJpaTest
@ActiveProfiles("test")
@ContextConfiguration(classes = [JpaTestApplication::class])
class PartnerSpendBasedRewardJpaRepositoryTest {
    @Autowired
    private lateinit var entityManager: TestEntityManager

    @Autowired
    private lateinit var repository: PartnerSpendBasedRewardJpaRepository

    @Test
    fun `should save and retrieve partner spend based reward`() {
        // Given
        val transactionId = UUID.randomUUID()
        val partnerId = UUID.randomUUID()
        val rewardValueId1 = UUID.randomUUID()
        val rewardValueId2 = UUID.randomUUID()

        val entity =
            JpaPartnerSpendBasedRewardEntity(
                transactionId = transactionId,
                partnerId = partnerId,
                rewardIds = listOf(rewardValueId1, rewardValueId2),
            )

        // When
        val savedEntity = repository.save(entity)
        entityManager.flush()
        entityManager.clear()

        // Then
        assertNotNull(savedEntity.id)
        assertEquals(transactionId, savedEntity.transactionId)
        assertEquals(partnerId, savedEntity.partnerId)
        assertEquals(2, savedEntity.rewardIds.size)
        assertTrue(savedEntity.rewardIds.contains(rewardValueId1))
        assertTrue(savedEntity.rewardIds.contains(rewardValueId2))
    }

    @Test
    fun `should find by transaction id`() {
        // Given
        val transactionId = UUID.randomUUID()
        val partnerId = UUID.randomUUID()
        val rewardValueId = UUID.randomUUID()

        val entity =
            JpaPartnerSpendBasedRewardEntity(
                transactionId = transactionId,
                partnerId = partnerId,
                rewardIds = listOf(rewardValueId),
            )

        repository.save(entity)
        entityManager.flush()

        // When
        val foundEntities = repository.findByTransactionId(transactionId)

        // Then
        assertEquals(1, foundEntities.size)
        assertEquals(transactionId, foundEntities[0].transactionId)
        assertEquals(partnerId, foundEntities[0].partnerId)
        assertEquals(1, foundEntities[0].rewardIds.size)
        assertEquals(rewardValueId, foundEntities[0].rewardIds[0])
    }

    @Test
    fun `should find by partner id`() {
        // Given
        val partnerId = UUID.randomUUID()
        val transactionId1 = UUID.randomUUID()
        val transactionId2 = UUID.randomUUID()

        val entity1 =
            JpaPartnerSpendBasedRewardEntity(
                transactionId = transactionId1,
                partnerId = partnerId,
                rewardIds = listOf(UUID.randomUUID()),
            )

        val entity2 =
            JpaPartnerSpendBasedRewardEntity(
                transactionId = transactionId2,
                partnerId = partnerId,
                rewardIds = listOf(UUID.randomUUID()),
            )

        repository.saveAll(listOf(entity1, entity2))
        entityManager.flush()

        // When
        val foundEntities = repository.findByPartnerId(partnerId)

        // Then
        assertEquals(2, foundEntities.size)
        foundEntities.forEach { entity ->
            assertEquals(partnerId, entity.partnerId)
        }

        val transactionIds = foundEntities.map { it.transactionId }.toSet()
        assertEquals(setOf(transactionId1, transactionId2), transactionIds)
    }

    @Test
    fun `should handle multiple reward value ids`() {
        // Given
        val transactionId = UUID.randomUUID()
        val partnerId = UUID.randomUUID()
        val rewardValueIds =
            listOf(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
            )

        val entity =
            JpaPartnerSpendBasedRewardEntity(
                transactionId = transactionId,
                partnerId = partnerId,
                rewardIds = rewardValueIds,
            )

        // When
        val savedEntity = repository.save(entity)
        entityManager.flush()

        val foundEntity = repository.findByTransactionId(transactionId)[0]

        // Then
        assertEquals(4, foundEntity.rewardIds.size)
        rewardValueIds.forEach { id ->
            assertTrue(foundEntity.rewardIds.contains(id))
        }
    }

    @Test
    fun `should handle empty reward value ids list`() {
        // Given
        val transactionId = UUID.randomUUID()
        val partnerId = UUID.randomUUID()

        val entity =
            JpaPartnerSpendBasedRewardEntity(
                transactionId = transactionId,
                partnerId = partnerId,
                rewardIds = emptyList(),
            )

        // When
        val savedEntity = repository.save(entity)
        entityManager.flush()

        val foundEntity = repository.findByTransactionId(transactionId)[0]

        // Then
        assertTrue(foundEntity.rewardIds.isEmpty())
    }

    @Test
    fun `should convert to domain entity correctly`() {
        // Given
        val transactionId = UUID.randomUUID()
        val partnerId = UUID.randomUUID()
        val rewardValueIds = listOf(UUID.randomUUID(), UUID.randomUUID())

        val entity =
            JpaPartnerSpendBasedRewardEntity(
                transactionId = transactionId,
                partnerId = partnerId,
                rewardIds = rewardValueIds,
            )

        val savedEntity = repository.save(entity)
        entityManager.flush()

        // When
        val domainEntity = savedEntity.toDomainEntityWithIds()

        // Then
        assertEquals(savedEntity.id, domainEntity.id)
        assertEquals(transactionId, domainEntity.transactionId)
        assertEquals(partnerId, domainEntity.partnerId)
        assertEquals(rewardValueIds, domainEntity.rewardIds)
    }

    @Test
    fun `should handle different partners`() {
        // Given
        val transactionId = UUID.randomUUID()
        val partnerId1 = UUID.randomUUID()
        val partnerId2 = UUID.randomUUID()
        val partnerId3 = UUID.randomUUID()

        val entities =
            listOf(
                JpaPartnerSpendBasedRewardEntity(
                    transactionId = transactionId,
                    partnerId = partnerId1,
                    rewardIds = listOf(UUID.randomUUID()),
                ),
                JpaPartnerSpendBasedRewardEntity(
                    transactionId = transactionId,
                    partnerId = partnerId2,
                    rewardIds = listOf(UUID.randomUUID()),
                ),
                JpaPartnerSpendBasedRewardEntity(
                    transactionId = transactionId,
                    partnerId = partnerId3,
                    rewardIds = listOf(UUID.randomUUID()),
                ),
            )

        // When
        repository.saveAll(entities)
        entityManager.flush()

        val foundEntities = repository.findByTransactionId(transactionId)

        // Then
        assertEquals(3, foundEntities.size)

        val partnerIds = foundEntities.map { it.partnerId }.toSet()
        assertEquals(setOf(partnerId1, partnerId2, partnerId3), partnerIds)
    }
}
