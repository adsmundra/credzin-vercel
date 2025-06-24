package com.credzin.featurestore.spendbased.partner

import com.credzin.reward.RewardType
import com.credzin.reward.RewardValue
import java.util.UUID

interface PartnerSpendBasedFeatureStore {
    fun getPartnerSpendBasedRewardValue(
        cardID: UUID,
        partnerID: UUID,
        rewardType: RewardType,
    ): List<RewardValue>
}
