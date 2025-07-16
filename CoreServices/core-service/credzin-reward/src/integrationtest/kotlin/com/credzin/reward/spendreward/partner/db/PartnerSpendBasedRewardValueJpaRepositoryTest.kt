package com.credzin.reward.spendreward.partner.db

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
 * Integration test for PartnerSpendBasedRewardValueJpaRepository.
 * Tests the database layer for partner reward values.
 */
@DataJpaTest
@ActiveProfiles("test")
@ContextConfiguration(classes = [JpaTestApplication::class])
class PartnerSpendBasedRewardValueJpaRepositoryTest {
    @Autowired
    private lateinit var entityManager: TestEntityManager

    @Autowired
    private lateinit var repository: PartnerSpendBasedRewardValueJpaRepository

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
            JpaPartnerSpendBasedRewardValueEntity(
                rewardValue = jacksonObjectMapper().writeValueAsString(rewardPointValue),
                partnerSpendBasedRewardId = parentId,
                rewardValueType = RewardValueType.REWARD_POINT,
            )

        // When
        val savedEntity = repository.save(entity)
        entityManager.flush()
        entityManager.clear()

        // Then
        assertNotNull(savedEntity.id)
        assertEquals(parentId, savedEntity.partnerSpendBasedRewardId)

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
                        amount = 75.25f,
                        currency = CurrencyCode.USD,
                    ),
            )

        val entity =
            JpaPartnerSpendBasedRewardValueEntity(
                rewardValue = jacksonObjectMapper().writeValueAsString(amountRewardValue),
                partnerSpendBasedRewardId = parentId,
                rewardValueType = RewardValueType.AMOUNT,
            )

        // When
        val savedEntity = repository.save(entity)
        entityManager.flush()
        entityManager.clear()

        // Then
        assertNotNull(savedEntity.id)
        assertEquals(parentId, savedEntity.partnerSpendBasedRewardId)

        // Verify JSON conversion works
        val domainRewardValue = savedEntity.toDomainRewardValue()
        assertTrue(domainRewardValue is AmountRewardValue)
        val amount = (domainRewardValue as AmountRewardValue).amount
        assertEquals(75.25f, amount.amount)
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
                        reference = "PARTNER-VOUCHER-2024-001",
                        provider = VoucherProvider.TAJ_HOTELS,
                        image = "https://example.com/taj-voucher.jpg",
                    ),
            )

        val entity =
            JpaPartnerSpendBasedRewardValueEntity(
                rewardValue = jacksonObjectMapper().writeValueAsString(voucherRewardValue),
                partnerSpendBasedRewardId = parentId,
                rewardValueType = RewardValueType.VOUCHER,
            )

        // When
        val savedEntity = repository.save(entity)
        entityManager.flush()
        entityManager.clear()

        // Then
        assertNotNull(savedEntity.id)
        assertEquals(parentId, savedEntity.partnerSpendBasedRewardId)

        // Verify JSON conversion works
        val domainRewardValue = savedEntity.toDomainRewardValue()
        assertTrue(domainRewardValue is VoucherRewardValue)
        val voucher = (domainRewardValue as VoucherRewardValue).voucher
        assertEquals(voucherId, voucher.id)
        assertEquals("PARTNER-VOUCHER-2024-001", voucher.reference)
        assertEquals(VoucherProvider.TAJ_HOTELS, voucher.provider)
        assertEquals("https://example.com/taj-voucher.jpg", voucher.image)
    }

    @Test
    fun `should handle multiple reward values for same partner`() {
        // Given
        val parentId = UUID.randomUUID()

        val rewardPointValue =
            RewardPointValue(
                rewardPoint =
                    RewardPoint(
                        type = RewardPointType.BONUS,
                        value = 500.0f,
                        valueType = RewardChargeType.ABSOLUTE,
                    ),
            )

        val amountRewardValue =
            AmountRewardValue(
                amount =
                    Amount(
                        amount = 25.0f,
                        currency = CurrencyCode.EUR,
                    ),
            )

        val voucherRewardValue =
            VoucherRewardValue(
                voucher =
                    Voucher(
                        id = UUID.randomUUID(),
                        reference = "MULTI-VOUCHER-001",
                        provider = VoucherProvider.AMAZON_PAY,
                        image = "https://example.com/amazon-pay-voucher.jpg",
                    ),
            )

        val entities =
            listOf(
                JpaPartnerSpendBasedRewardValueEntity(
                    rewardValue = jacksonObjectMapper().writeValueAsString(rewardPointValue),
                    partnerSpendBasedRewardId = parentId,
                    rewardValueType = RewardValueType.REWARD_POINT,
                ),
                JpaPartnerSpendBasedRewardValueEntity(
                    rewardValue = jacksonObjectMapper().writeValueAsString(amountRewardValue),
                    partnerSpendBasedRewardId = parentId,
                    rewardValueType = RewardValueType.AMOUNT,
                ),
                JpaPartnerSpendBasedRewardValueEntity(
                    rewardValue = jacksonObjectMapper().writeValueAsString(voucherRewardValue),
                    partnerSpendBasedRewardId = parentId,
                    rewardValueType = RewardValueType.VOUCHER,
                ),
            )

        // When
        val savedEntities = repository.saveAll(entities)
        entityManager.flush()

        // Then
        assertEquals(3, savedEntities.size)
        savedEntities.forEach { entity ->
            assertEquals(parentId, entity.partnerSpendBasedRewardId)
        }

        // Verify all types can be converted back
        val domainValues = savedEntities.map { it.toDomainRewardValue() }
        assertTrue(domainValues.any { it is RewardPointValue })
        assertTrue(domainValues.any { it is AmountRewardValue })
        assertTrue(domainValues.any { it is VoucherRewardValue })
    }

    @Test
    fun `should handle different reward point types for partners`() {
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
                                value = 100.0f,
                                valueType = RewardChargeType.PERCENTAGE,
                            ),
                    )

                JpaPartnerSpendBasedRewardValueEntity(
                    rewardValue = jacksonObjectMapper().writeValueAsString(rewardPointValue),
                    partnerSpendBasedRewardId = parentId,
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
    fun `should handle different voucher providers`() {
        // Given
        val parentId = UUID.randomUUID()

        val providers =
            listOf(
                VoucherProvider.AMAZON_SHOPPING,
                VoucherProvider.TAJ_HOTELS,
                VoucherProvider.AMAZON_PAY,
            )

        val entities =
            providers.map { provider ->
                val voucherRewardValue =
                    VoucherRewardValue(
                        voucher =
                            Voucher(
                                id = UUID.randomUUID(),
                                reference = "VOUCHER-${provider.name}-001",
                                provider = provider,
                                image = "https://example.com/${provider.name.lowercase()}-voucher.jpg",
                            ),
                    )

                JpaPartnerSpendBasedRewardValueEntity(
                    rewardValue = jacksonObjectMapper().writeValueAsString(voucherRewardValue),
                    partnerSpendBasedRewardId = parentId,
                    rewardValueType = RewardValueType.VOUCHER,
                )
            }

        // When
        val savedEntities = repository.saveAll(entities)
        entityManager.flush()

        // Then
        assertEquals(3, savedEntities.size)

        val domainValues = savedEntities.map { it.toDomainRewardValue() }
        val retrievedProviders = domainValues.map { (it as VoucherRewardValue).voucher.provider }.toSet()

        assertEquals(providers.toSet(), retrievedProviders)
    }

    @Test
    fun `should handle mixed value types`() {
        // Given
        val parentId = UUID.randomUUID()

        val absoluteValue =
            RewardPointValue(
                rewardPoint =
                    RewardPoint(
                        type = RewardPointType.STANDARD,
                        value = 200.0f,
                        valueType = RewardChargeType.ABSOLUTE,
                    ),
            )

        val percentageValue =
            RewardPointValue(
                rewardPoint =
                    RewardPoint(
                        type = RewardPointType.CASHBACK,
                        value = 5.0f,
                        valueType = RewardChargeType.PERCENTAGE,
                    ),
            )

        val entities =
            listOf(
                JpaPartnerSpendBasedRewardValueEntity(
                    rewardValue = jacksonObjectMapper().writeValueAsString(absoluteValue),
                    partnerSpendBasedRewardId = parentId,
                    rewardValueType = RewardValueType.REWARD_POINT,
                ),
                JpaPartnerSpendBasedRewardValueEntity(
                    rewardValue = jacksonObjectMapper().writeValueAsString(percentageValue),
                    partnerSpendBasedRewardId = parentId,
                    rewardValueType = RewardValueType.REWARD_POINT,
                ),
            )

        // When
        val savedEntities = repository.saveAll(entities)
        entityManager.flush()

        // Then
        assertEquals(2, savedEntities.size)

        val domainValues = savedEntities.map { it.toDomainRewardValue() }
        val valueTypes = domainValues.map { (it as RewardPointValue).rewardPoint.valueType }.toSet()

        assertEquals(setOf(RewardChargeType.ABSOLUTE, RewardChargeType.PERCENTAGE), valueTypes)
    }
}
