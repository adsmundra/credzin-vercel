package com.credzin.featurestore.spendbased.standard

import com.credzin.common.CardInput
import com.credzin.common.MerchantInput

interface RewardCalculationInput

data class StandardSpendBasedRewardCalculationInput(
    val cardInput: CardInput,
    val merchantInput: MerchantInput,
) : RewardCalculationInput
