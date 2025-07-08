package com.credzin.reward

/**
 * Reward data class that contains the reward value and type.
 */
data class Reward(
    val reward: RewardValue,
    val type: RewardValueType,
) {
    companion object {
        /**
         * Creates a Reward with the type automatically derived from the reward value.
         */
        fun create(rewardValue: RewardValue): Reward {
            val rewardValueType =
                when (rewardValue) {
                    is RewardPointValue -> RewardValueType.REWARD_POINT
                    is AmountRewardValue -> RewardValueType.AMOUNT
                    is VoucherRewardValue -> RewardValueType.VOUCHER
                }
            return Reward(
                reward = rewardValue,
                type = rewardValueType,
            )
        }
    }
}
