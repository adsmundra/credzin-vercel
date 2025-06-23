package com.credzin.reward

/**
 * Reward data class that contains the reward value and type.
 */
data class Reward(
    val reward: RewardValue,
    val type: RewardType,
) {
    companion object {
        /**
         * Creates a Reward with the type automatically derived from the reward value.
         */
        fun create(rewardValue: RewardValue): Reward {
            val rewardType =
                when (rewardValue) {
                    is RewardPointValue -> RewardType.REWARD_POINT
                    is AmountRewardValue -> RewardType.AMOUNT
                    is VoucherRewardValue -> RewardType.VOUCHER
                }
            return Reward(
                reward = rewardValue,
                type = rewardType,
            )
        }
    }
}
