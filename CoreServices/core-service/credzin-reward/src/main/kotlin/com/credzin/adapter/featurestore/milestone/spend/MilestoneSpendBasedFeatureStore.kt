package com.credzin.adapter.featurestore.milestone.spend

import com.credzin.reward.TimePeriod
import com.credzin.reward.milestonereward.spendbased.domain.MilestoneSpendBased
import java.util.UUID

interface MilestoneSpendBasedFeatureStore {

    fun getMilestoneSpendBasedTimePeriodForCreditCardId(
        cardId: UUID,
    ): TimePeriod

    fun getMilestonesSpendBased(
        cardId: UUID
    ): List<MilestoneSpendBased>

}