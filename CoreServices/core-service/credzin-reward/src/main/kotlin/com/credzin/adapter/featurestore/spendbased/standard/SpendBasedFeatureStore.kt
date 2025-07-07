package com.credzin.adapter.featurestore.spendbased.standard

import com.credzin.reward.RewardType
import com.credzin.reward.RewardValue
import java.util.UUID

interface SpendBasedFeatureStore {
    fun getSpendBasedRewardValue(
        cardID: UUID,
    ): RewardValue
}
