package com.credzin.reward.milestonereward.spendbased.domain

import com.credzin.adapter.usertransaction.UserCurrentSpendDetails
import com.credzin.common.Amount
import com.credzin.common.CurrencyCode
import com.credzin.reward.AmountRange
import com.credzin.reward.AmountRewardValue
import com.credzin.reward.TimePeriod
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import java.time.LocalDate
import java.util.UUID

class MilestoneSpendBasedDeltaCalculatorTest {

    private val calculator = MilestoneSpendBasedDeltaCalculator()

    private fun createMilestone(min: Long, max: Long, order: Int): MilestoneSpendBased {
        return MilestoneSpendBased(
            amountRange = AmountRange(
                Amount(min.toFloat(), CurrencyCode.INR), 
                Amount(max.toFloat(), CurrencyCode.INR)
            ),
            timePeriod = TimePeriod(LocalDate.now(), LocalDate.now().plusDays(1)),
            rewardValue = AmountRewardValue(Amount(100.0f, CurrencyCode.INR)),
            order = MilestoneSpendBasedOrder(order)
        )
    }

    @Test
    fun `test no milestones`() {
        val distance = calculator.calculateDelta(null, emptyList(), UUID.randomUUID())
        assertEquals(null, distance.previousMilestoneSpendBased)
        assertEquals(null, distance.currentMilestoneSpendBased)
        assertEquals(null, distance.nextMilestoneSpendBased)
    }

    @Test
    fun `test no spend details`() {
        val milestones = listOf(createMilestone(0, 100, 1))
        val distance = calculator.calculateDelta(null, milestones, UUID.randomUUID())
        assertEquals(null, distance.previousMilestoneSpendBased)
        assertEquals(null, distance.currentMilestoneSpendBased)
        assertEquals(milestones.first(), distance.nextMilestoneSpendBased)
    }

    @Test
    fun `test spend before first milestone`() {
        val milestones = listOf(
            createMilestone(100, 200, 1),
            createMilestone(201, 300, 2)
        )
        val spendDetails = UserCurrentSpendDetails(
            userId = UUID.randomUUID(),
            totalAmount = Amount(50.0f, CurrencyCode.INR),
            timePeriod = TimePeriod(LocalDate.now(), LocalDate.now().plusDays(1))
        )
        val distance = calculator.calculateDelta(spendDetails, milestones, UUID.randomUUID())
        assertEquals(null, distance.previousMilestoneSpendBased)
        assertEquals(null, distance.currentMilestoneSpendBased)
        assertEquals(milestones.first(), distance.nextMilestoneSpendBased) // Should be 100-200 since user hasn't reached any milestone yet
    }

    @Test
    fun `test spend on first milestone`() {
        val milestones = listOf(
            createMilestone(100, 200, 1),
            createMilestone(201, 300, 2)
        )
        val spendDetails = UserCurrentSpendDetails(
            userId = UUID.randomUUID(),
            totalAmount = Amount(150.0f, CurrencyCode.INR),
            timePeriod = TimePeriod(LocalDate.now(), LocalDate.now().plusDays(1))
        )
        val distance = calculator.calculateDelta(spendDetails, milestones, UUID.randomUUID())
        assertEquals(null, distance.previousMilestoneSpendBased)
        assertEquals(milestones.first(), distance.currentMilestoneSpendBased)
        assertEquals(milestones.last(), distance.nextMilestoneSpendBased)
    }

    @Test
    fun `test spend between milestones`() {
        val milestones = listOf(
            createMilestone(100, 200, 1),
            createMilestone(301, 400, 2)
        )
        val spendDetails = UserCurrentSpendDetails(
            userId = UUID.randomUUID(),
            totalAmount = Amount(250.0f, CurrencyCode.INR),
            timePeriod = TimePeriod(LocalDate.now(), LocalDate.now().plusDays(1))
        )
        val distance = calculator.calculateDelta(spendDetails, milestones, UUID.randomUUID())
        assertEquals(null, distance.previousMilestoneSpendBased)
        assertEquals(null, distance.currentMilestoneSpendBased)
        assertEquals(milestones.last(), distance.nextMilestoneSpendBased) // Should be 301-400 since user has passed 100-200 but not reached 301-400
    }

    @Test
    fun `test spend on last milestone`() {
        val milestones = listOf(
            createMilestone(100, 200, 1),
            createMilestone(201, 300, 2)
        )
        val spendDetails = UserCurrentSpendDetails(
            userId = UUID.randomUUID(),
            totalAmount = Amount(250.0f, CurrencyCode.INR),
            timePeriod = TimePeriod(LocalDate.now(), LocalDate.now().plusDays(1))
        )
        val distance = calculator.calculateDelta(spendDetails, milestones, UUID.randomUUID())
        assertEquals(milestones.first(), distance.previousMilestoneSpendBased)
        assertEquals(milestones.last(), distance.currentMilestoneSpendBased)
        assertEquals(null, distance.nextMilestoneSpendBased)
    }

    @Test
    fun `test spend after last milestone`() {
        val milestones = listOf(
            createMilestone(100, 200, 1),
            createMilestone(201, 300, 2)
        )
        val spendDetails = UserCurrentSpendDetails(
            userId = UUID.randomUUID(),
            totalAmount = Amount(350.0f, CurrencyCode.INR),
            timePeriod = TimePeriod(LocalDate.now(), LocalDate.now().plusDays(1))
        )
        val distance = calculator.calculateDelta(spendDetails, milestones, UUID.randomUUID())
        assertEquals(milestones.last(), distance.previousMilestoneSpendBased)
        assertEquals(null, distance.currentMilestoneSpendBased)
        assertEquals(null, distance.nextMilestoneSpendBased)
    }

    @Test
    fun `test spend with multiple matching milestones`() {
        val milestones = listOf(
            createMilestone(100, 200, 1),
            createMilestone(150, 250, 2) // Overlapping range
        )
        val spendDetails = UserCurrentSpendDetails(
            userId = UUID.randomUUID(),
            totalAmount = Amount(175.0f, CurrencyCode.INR),
            timePeriod = TimePeriod(LocalDate.now(), LocalDate.now().plusDays(1))
        )
        val distance = calculator.calculateDelta(spendDetails, milestones, UUID.randomUUID())
        assertEquals(null, distance.previousMilestoneSpendBased)
        assertEquals(milestones.first(), distance.currentMilestoneSpendBased)
        assertEquals(milestones.last(), distance.nextMilestoneSpendBased)
    }

    @Test
    fun `test spend exactly on milestone minimum boundary`() {
        val milestones = listOf(
            createMilestone(100, 200, 1),
            createMilestone(201, 300, 2)
        )
        val spendDetails = UserCurrentSpendDetails(
            userId = UUID.randomUUID(),
            totalAmount = Amount(100.0f, CurrencyCode.INR),
            timePeriod = TimePeriod(LocalDate.now(), LocalDate.now().plusDays(1))
        )
        val distance = calculator.calculateDelta(spendDetails, milestones, UUID.randomUUID())
        assertEquals(null, distance.previousMilestoneSpendBased)
        assertEquals(milestones.first(), distance.currentMilestoneSpendBased)
        assertEquals(milestones.last(), distance.nextMilestoneSpendBased)
    }

    @Test
    fun `test spend exactly on milestone maximum boundary`() {
        val milestones = listOf(
            createMilestone(100, 200, 1),
            createMilestone(201, 300, 2)
        )
        val spendDetails = UserCurrentSpendDetails(
            userId = UUID.randomUUID(),
            totalAmount = Amount(200.0f, CurrencyCode.INR),
            timePeriod = TimePeriod(LocalDate.now(), LocalDate.now().plusDays(1))
        )
        val distance = calculator.calculateDelta(spendDetails, milestones, UUID.randomUUID())
        assertEquals(null, distance.previousMilestoneSpendBased)
        assertEquals(milestones.first(), distance.currentMilestoneSpendBased)
        assertEquals(milestones.last(), distance.nextMilestoneSpendBased)
    }

    @Test
    fun `test single milestone - spend before`() {
        val milestones = listOf(createMilestone(100, 200, 1))
        val spendDetails = UserCurrentSpendDetails(
            userId = UUID.randomUUID(),
            totalAmount = Amount(50.0f, CurrencyCode.INR),
            timePeriod = TimePeriod(LocalDate.now(), LocalDate.now().plusDays(1))
        )
        val distance = calculator.calculateDelta(spendDetails, milestones, UUID.randomUUID())
        assertEquals(null, distance.previousMilestoneSpendBased)
        assertEquals(null, distance.currentMilestoneSpendBased)
        assertEquals(milestones.first(), distance.nextMilestoneSpendBased)
    }

    @Test
    fun `test single milestone - spend within`() {
        val milestones = listOf(createMilestone(100, 200, 1))
        val spendDetails = UserCurrentSpendDetails(
            userId = UUID.randomUUID(),
            totalAmount = Amount(150.0f, CurrencyCode.INR),
            timePeriod = TimePeriod(LocalDate.now(), LocalDate.now().plusDays(1))
        )
        val distance = calculator.calculateDelta(spendDetails, milestones, UUID.randomUUID())
        assertEquals(null, distance.previousMilestoneSpendBased)
        assertEquals(milestones.first(), distance.currentMilestoneSpendBased)
        assertEquals(null, distance.nextMilestoneSpendBased)
    }

    @Test
    fun `test single milestone - spend after`() {
        val milestones = listOf(createMilestone(100, 200, 1))
        val spendDetails = UserCurrentSpendDetails(
            userId = UUID.randomUUID(),
            totalAmount = Amount(250.0f, CurrencyCode.INR),
            timePeriod = TimePeriod(LocalDate.now(), LocalDate.now().plusDays(1))
        )
        val distance = calculator.calculateDelta(spendDetails, milestones, UUID.randomUUID())
        assertEquals(milestones.first(), distance.previousMilestoneSpendBased)
        assertEquals(null, distance.currentMilestoneSpendBased)
        assertEquals(null, distance.nextMilestoneSpendBased)
    }

    @Test
    fun `test unsorted milestones are handled correctly`() {
        val milestones = listOf(
            createMilestone(201, 300, 2),
            createMilestone(100, 200, 1),
            createMilestone(301, 400, 3)
        )
        val spendDetails = UserCurrentSpendDetails(
            userId = UUID.randomUUID(),
            totalAmount = Amount(150.0f, CurrencyCode.INR),
            timePeriod = TimePeriod(LocalDate.now(), LocalDate.now().plusDays(1))
        )
        val distance = calculator.calculateDelta(spendDetails, milestones, UUID.randomUUID())
        assertEquals(null, distance.previousMilestoneSpendBased)
        assertEquals(milestones[1], distance.currentMilestoneSpendBased) // Should be 100-200
        assertEquals(milestones[0], distance.nextMilestoneSpendBased) // Should be 201-300
    }

    @Test
    fun `test adjacent milestones with no gap`() {
        val milestones = listOf(
            createMilestone(100, 200, 1),
            createMilestone(200, 300, 2),
            createMilestone(300, 400, 3)
        )
        val spendDetails = UserCurrentSpendDetails(
            userId = UUID.randomUUID(),
            totalAmount = Amount(200.0f, CurrencyCode.INR),
            timePeriod = TimePeriod(LocalDate.now(), LocalDate.now().plusDays(1))
        )
        val distance = calculator.calculateDelta(spendDetails, milestones, UUID.randomUUID())
        // Amount 200 could match both milestone 1 (max) and milestone 2 (min)
        // The implementation should pick the first one (lowest order)
        assertEquals(null, distance.previousMilestoneSpendBased)
        assertEquals(milestones.first(), distance.currentMilestoneSpendBased)
        assertEquals(milestones[1], distance.nextMilestoneSpendBased)
    }

    @Test
    fun `test complex overlapping milestones`() {
        val milestones = listOf(
            createMilestone(100, 300, 1),
            createMilestone(150, 250, 2),
            createMilestone(200, 400, 3)
        )
        val spendDetails = UserCurrentSpendDetails(
            userId = UUID.randomUUID(),
            totalAmount = Amount(225.0f, CurrencyCode.INR),
            timePeriod = TimePeriod(LocalDate.now(), LocalDate.now().plusDays(1))
        )
        val distance = calculator.calculateDelta(spendDetails, milestones, UUID.randomUUID())
        // Amount 225 matches all three milestones
        // Should pick the first one (lowest order)
        assertEquals(null, distance.previousMilestoneSpendBased)
        assertEquals(milestones.first(), distance.currentMilestoneSpendBased)
        assertEquals(milestones[1], distance.nextMilestoneSpendBased)
    }
}