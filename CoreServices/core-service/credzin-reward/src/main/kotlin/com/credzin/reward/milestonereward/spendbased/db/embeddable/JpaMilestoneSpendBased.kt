package com.credzin.reward.milestonereward.spendbased.db.embeddable

import com.credzin.reward.AmountRange
import com.credzin.common.AmountRangeConverter
import com.credzin.reward.RewardValue
import com.credzin.reward.TimePeriod
import com.credzin.reward.milestonereward.spendbased.domain.MilestoneSpendBasedOrder
import jakarta.persistence.Column
import jakarta.persistence.Convert
import jakarta.persistence.Converter
import jakarta.persistence.Embeddable
import jakarta.persistence.Embedded

// This class is no longer a JPA-managed entity in the same way,
// but a data structure to be serialized into JSON.
// Keeping @Embeddable is fine for clarity but not strictly required by Hibernate's JSON mapping.
@Embeddable
data class JpaMilestoneSpendBased(

    @Convert(converter = AmountRangeConverter::class)
    val amountRange: AmountRange,

    @Convert(converter = TimePeriodConverter::class)
    @Column(name = "time_period", columnDefinition = "jsonb")
    val timePeriod: TimePeriod,

    @Column(name = "reward_value", nullable = false, columnDefinition = "text")
    val rewardValue: String,

    @Convert(converter = MilestoneSpendBasedOrderConverter::class)
    @Column(name = "order", columnDefinition = "jsonb")
    val order: MilestoneSpendBasedOrder,
)
