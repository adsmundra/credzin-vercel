package com.credzin.reward.spendreward.transactionchannel.db

import com.credzin.reward.*
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
 * Integration test for TransactionChannelSpendBasedRewardJpaRepository.
 * Tests the database layer for transaction channel spend-based rewards.
 */
@DataJpaTest
@ActiveProfiles("test")
@ContextConfiguration(classes = [JpaTestApplication::class])
class TransactionChannelSpendBasedRewardJpaRepositoryTest {
    @Autowired
    private lateinit var entityManager: TestEntityManager

    @Autowired
    private lateinit var repository: TransactionChannelSpendBasedRewardJpaRepository

    @Test
    fun `should save and retrieve transaction channel spend based reward`() {
        // Given
        val transactionId = UUID.randomUUID()
        val rewardValueId1 = UUID.randomUUID()
        val rewardValueId2 = UUID.randomUUID()

        val entity =
            JpaTransactionChannelSpendBasedRewardEntity(
                transactionId = transactionId,
                transactionChannelType = TransactionChannelType.ONLINE,
                rewardIds = listOf(rewardValueId1, rewardValueId2),
            )

        // When
        val savedEntity = repository.save(entity)
        entityManager.flush()
        entityManager.clear()

        // Then
        assertNotNull(savedEntity.id)
        assertEquals(transactionId, savedEntity.transactionId)
        assertEquals(TransactionChannelType.ONLINE, savedEntity.transactionChannelType)
        assertEquals(2, savedEntity.rewardIds.size)
        assertTrue(savedEntity.rewardIds.contains(rewardValueId1))
        assertTrue(savedEntity.rewardIds.contains(rewardValueId2))
    }

    @Test
    fun `should find by transaction id`() {
        // Given
        val transactionId = UUID.randomUUID()
        val rewardValueId = UUID.randomUUID()

        val entity =
            JpaTransactionChannelSpendBasedRewardEntity(
                transactionId = transactionId,
                transactionChannelType = TransactionChannelType.OFFLINE,
                rewardIds = listOf(rewardValueId),
            )

        repository.save(entity)
        entityManager.flush()

        // When
        val foundEntities = repository.findByTransactionId(transactionId)

        // Then
        assertEquals(1, foundEntities.size)
        assertEquals(transactionId, foundEntities[0].transactionId)
        assertEquals(TransactionChannelType.OFFLINE, foundEntities[0].transactionChannelType)
        assertEquals(1, foundEntities[0].rewardIds.size)
        assertEquals(rewardValueId, foundEntities[0].rewardIds[0])
    }

    @Test
    fun `should handle different transaction channel types`() {
        // Given
        val transactionId1 = UUID.randomUUID()
        val transactionId2 = UUID.randomUUID()

        val onlineEntity =
            JpaTransactionChannelSpendBasedRewardEntity(
                transactionId = transactionId1,
                transactionChannelType = TransactionChannelType.ONLINE,
                rewardIds = listOf(UUID.randomUUID()),
            )

        val offlineEntity =
            JpaTransactionChannelSpendBasedRewardEntity(
                transactionId = transactionId2,
                transactionChannelType = TransactionChannelType.OFFLINE,
                rewardIds = listOf(UUID.randomUUID()),
            )

        // When
        repository.saveAll(listOf(onlineEntity, offlineEntity))
        entityManager.flush()

        // Then
        val onlineResult = repository.findByTransactionId(transactionId1)[0]
        val offlineResult = repository.findByTransactionId(transactionId2)[0]

        assertEquals(TransactionChannelType.ONLINE, onlineResult.transactionChannelType)
        assertEquals(TransactionChannelType.OFFLINE, offlineResult.transactionChannelType)
    }

    @Test
    fun `should handle multiple reward value ids`() {
        // Given
        val transactionId = UUID.randomUUID()
        val rewardValueIds =
            listOf(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
            )

        val entity =
            JpaTransactionChannelSpendBasedRewardEntity(
                transactionId = transactionId,
                transactionChannelType = TransactionChannelType.ONLINE,
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

        val entity =
            JpaTransactionChannelSpendBasedRewardEntity(
                transactionId = transactionId,
                transactionChannelType = TransactionChannelType.ONLINE,
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
        val rewardValueIds = listOf(UUID.randomUUID(), UUID.randomUUID())

        val entity =
            JpaTransactionChannelSpendBasedRewardEntity(
                transactionId = transactionId,
                transactionChannelType = TransactionChannelType.ONLINE,
                rewardIds = rewardValueIds,
            )

        val savedEntity = repository.save(entity)
        entityManager.flush()

        // When
        val domainEntity = savedEntity.toDomainEntityWithIds()

        // Then
        assertEquals(savedEntity.id, domainEntity.id)
        assertEquals(transactionId, domainEntity.transactionId)
        assertEquals(TransactionChannelType.ONLINE, domainEntity.transactionChannelType)
        assertEquals(rewardValueIds, domainEntity.rewardIds)
    }
}
