package com.credzin.reward.spendreward.transactionchannel.db

import com.credzin.common.*
import com.credzin.reward.*
import com.credzin.reward.AmountRewardValue
import com.credzin.reward.RewardPoint
import com.credzin.reward.RewardPointType
import com.credzin.reward.RewardPointValue
import com.credzin.reward.RewardValueType
import com.credzin.reward.RewardChargeType
import com.credzin.reward.Voucher
import com.credzin.reward.VoucherRewardValue
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
 * Integration test for TransactionChannelSpendBasedRewardValueJpaRepository.
 * Tests the database layer for transaction channel reward values.
 */
@DataJpaTest
@ActiveProfiles("test")
@ContextConfiguration(classes = [JpaTestApplication::class])
class TransactionChannelSpendBasedRewardValueJpaRepositoryTest {
    @Autowired
    private lateinit var entityManager: TestEntityManager

    @Autowired
    private lateinit var repository: TransactionChannelSpendBasedRewardValueJpaRepository

    @Test
    fun `should save and retrieve reward point value`() {
        // Given
        val parentId = UUID.randomUUID()
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
            JpaTransactionChannelSpendBasedRewardValueEntity(
                rewardValue = jacksonObjectMapper().writeValueAsString(rewardPointValue),
                transactionChannelSpendBasedRewardId = parentId,
                rewardValueType = RewardValueType.REWARD_POINT,
            )

        // When
        val savedEntity = repository.save(entity)
        entityManager.flush()
        entityManager.clear()

        // Then
        assertNotNull(savedEntity.id)
        assertEquals(parentId, savedEntity.transactionChannelSpendBasedRewardId)

        // Verify JSON conversion works
        val domainRewardValue = savedEntity.toDomainRewardValue()
        assertTrue(domainRewardValue is RewardPointValue)
        val rewardPoint = (domainRewardValue as RewardPointValue).rewardPoint
        assertEquals(RewardPointType.STANDARD, rewardPoint.type)
        assertEquals(100.0f, rewardPoint.value)
        assertEquals(RewardChargeType.ABSOLUTE, rewardPoint.valueType)
    }

    @Test
    fun `should save and retrieve amount reward value`() {
        // Given
        val parentId = UUID.randomUUID()
        val amountRewardValue =
            AmountRewardValue(
                amount =
                    Amount(
                        amount = 50.75f,
                        currency = CurrencyCode.USD,
                    ),
            )

        val entity =
            JpaTransactionChannelSpendBasedRewardValueEntity(
                rewardValue = jacksonObjectMapper().writeValueAsString(amountRewardValue),
                transactionChannelSpendBasedRewardId = parentId,
                rewardValueType = RewardValueType.AMOUNT,
            )

        // When
        val savedEntity = repository.save(entity)
        entityManager.flush()
        entityManager.clear()

        // Then
        assertNotNull(savedEntity.id)
        assertEquals(parentId, savedEntity.transactionChannelSpendBasedRewardId)

        // Verify JSON conversion works
        val domainRewardValue = savedEntity.toDomainRewardValue()
        assertTrue(domainRewardValue is AmountRewardValue)
        val amount = (domainRewardValue as AmountRewardValue).amount
        assertEquals(50.75f, amount.amount)
        assertEquals(CurrencyCode.USD, amount.currency)
    }

    @Test
    fun `should save and retrieve voucher reward value`() {
        // Given
        val parentId = UUID.randomUUID()
        val voucherId = UUID.randomUUID()
        val voucherRewardValue =
            VoucherRewardValue(
                voucher =
                    Voucher(
                        id = voucherId,
                        reference = "VOUCHER-2024-001",
                        provider = VoucherProvider.AMAZON_SHOPPING,
                        image = "https://example.com/voucher.jpg",
                    ),
            )

        val entity =
            JpaTransactionChannelSpendBasedRewardValueEntity(
                rewardValue = jacksonObjectMapper().writeValueAsString(voucherRewardValue),
                transactionChannelSpendBasedRewardId = parentId,
                rewardValueType = RewardValueType.VOUCHER,
            )

        // When
        val savedEntity = repository.save(entity)
        entityManager.flush()
        entityManager.clear()

        // Then
        assertNotNull(savedEntity.id)
        assertEquals(parentId, savedEntity.transactionChannelSpendBasedRewardId)

        // Verify JSON conversion works
        val domainRewardValue = savedEntity.toDomainRewardValue()
        assertTrue(domainRewardValue is VoucherRewardValue)
        val voucher = (domainRewardValue as VoucherRewardValue).voucher
        assertEquals(voucherId, voucher.id)
        assertEquals("VOUCHER-2024-001", voucher.reference)
        assertEquals(VoucherProvider.AMAZON_SHOPPING, voucher.provider)
        assertEquals("https://example.com/voucher.jpg", voucher.image)
    }

    @Test
    fun `should handle multiple reward values for same parent`() {
        // Given
        val parentId = UUID.randomUUID()

        val rewardPointValue =
            RewardPointValue(
                rewardPoint =
                    RewardPoint(
                        type = RewardPointType.CASHBACK,
                        value = 25.0f,
                        valueType = RewardChargeType.PERCENTAGE,
                    ),
            )

        val amountRewardValue =
            AmountRewardValue(
                amount =
                    Amount(
                        amount = 100.0f,
                        currency = CurrencyCode.EUR,
                    ),
            )

        val entities =
            listOf(
                JpaTransactionChannelSpendBasedRewardValueEntity(
                    rewardValue = jacksonObjectMapper().writeValueAsString(rewardPointValue),
                    transactionChannelSpendBasedRewardId = parentId,
                    rewardValueType = RewardValueType.REWARD_POINT,
                ),
                JpaTransactionChannelSpendBasedRewardValueEntity(
                    rewardValue = jacksonObjectMapper().writeValueAsString(amountRewardValue),
                    transactionChannelSpendBasedRewardId = parentId,
                    rewardValueType = RewardValueType.AMOUNT,
                ),
            )

        // When
        val savedEntities = repository.saveAll(entities)
        entityManager.flush()

        // Then
        assertEquals(2, savedEntities.size)
        savedEntities.forEach { entity ->
            assertEquals(parentId, entity.transactionChannelSpendBasedRewardId)
        }

        // Verify both types can be converted back
        val domainValues = savedEntities.map { it.toDomainRewardValue() }
        assertTrue(domainValues.any { it is RewardPointValue })
        assertTrue(domainValues.any { it is AmountRewardValue })
    }

    @Test
    fun `should handle different reward point types`() {
        // Given
        val parentId = UUID.randomUUID()

        val rewardTypes =
            listOf(
                RewardPointType.STANDARD,
                RewardPointType.CASHBACK,
                RewardPointType.BONUS,
            )

        val entities =
            rewardTypes.map { type ->
                val rewardPointValue =
                    RewardPointValue(
                        rewardPoint =
                            RewardPoint(
                                type = type,
                                value = 50.0f,
                                valueType = RewardChargeType.ABSOLUTE,
                            ),
                    )

                JpaTransactionChannelSpendBasedRewardValueEntity(
                    rewardValue = jacksonObjectMapper().writeValueAsString(rewardPointValue),
                    transactionChannelSpendBasedRewardId = parentId,
                    rewardValueType = RewardValueType.REWARD_POINT,
                )
            }

        // When
        val savedEntities = repository.saveAll(entities)
        entityManager.flush()

        // Then
        assertEquals(3, savedEntities.size)

        val domainValues = savedEntities.map { it.toDomainRewardValue() }
        val retrievedTypes = domainValues.map { (it as RewardPointValue).rewardPoint.type }.toSet()

        assertEquals(rewardTypes.toSet(), retrievedTypes)
    }

    @Test
    fun `should handle different currencies`() {
        // Given
        val parentId = UUID.randomUUID()

        val currencies = listOf(CurrencyCode.USD, CurrencyCode.EUR, CurrencyCode.GBP)

        val entities =
            currencies.map { currency ->
                val amountRewardValue =
                    AmountRewardValue(
                        amount =
                            Amount(
                                amount = 100.0f,
                                currency = currency,
                            ),
                    )

                JpaTransactionChannelSpendBasedRewardValueEntity(
                    rewardValue = jacksonObjectMapper().writeValueAsString(amountRewardValue),
                    transactionChannelSpendBasedRewardId = parentId,
                    rewardValueType = RewardValueType.AMOUNT,
                )
            }

        // When
        val savedEntities = repository.saveAll(entities)
        entityManager.flush()

        // Then
        assertEquals(3, savedEntities.size)

        val domainValues = savedEntities.map { it.toDomainRewardValue() }
        val retrievedCurrencies = domainValues.map { (it as AmountRewardValue).amount.currency }.toSet()

        assertEquals(currencies.toSet(), retrievedCurrencies)
    }
}
