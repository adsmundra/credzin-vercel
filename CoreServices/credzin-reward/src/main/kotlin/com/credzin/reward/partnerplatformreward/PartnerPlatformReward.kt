package com.credzin.reward.partnerplatformreward

import com.credzin.reward.Reward
import java.util.UUID

/**
 * Interface for partner platform rewards.
 * Corresponds to the GraphQL PartnerPlatformReward interface.
 */
interface PartnerPlatformReward {
    val id: UUID?
    val rewards: List<Reward>
}

/**
 * Gyfter partner platform reward implementation.
 * Corresponds to the GraphQL GyfterPartnerPlatformReward type.
 */
data class GyfterPartnerPlatformReward(
    override val id: UUID,
    val name: String,
    override val rewards: List<Reward>,
) : PartnerPlatformReward

/**
 * SmartBuy partner platform reward implementation.
 * Corresponds to the GraphQL SmartBuyPartnerPlatformReward type.
 */
data class SmartBuyPartnerPlatformReward(
    override val id: UUID,
    val name: String,
    override val rewards: List<Reward>,
) : PartnerPlatformReward
