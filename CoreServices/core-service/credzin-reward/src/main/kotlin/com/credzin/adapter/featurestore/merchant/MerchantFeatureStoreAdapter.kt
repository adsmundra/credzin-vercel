package com.credzin.adapter.featurestore.merchant

import com.credzin.reward.RewardValueType
import java.util.UUID

interface MerchantFeatureStoreAdapter {
    fun isMerchantEligibleForReward(
        cardId: UUID,
        merchantId: UUID,
        type: RewardValueType,
    ): Boolean
}
