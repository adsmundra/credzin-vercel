package com.credzin.adapter.featurestore.spendbased.partner

import com.credzin.reward.RewardValue
import java.util.UUID

interface PartnerSpendBasedFeatureStore {
    fun getPartnerSpendBasedRewardValue(
        cardID: UUID,
        partnerID: UUID,
    ): List<RewardValue>
}
