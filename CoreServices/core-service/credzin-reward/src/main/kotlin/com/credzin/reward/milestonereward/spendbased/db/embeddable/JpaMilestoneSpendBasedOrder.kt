package com.credzin.reward.milestonereward.spendbased.db.embeddable

import jakarta.persistence.Embeddable

@Embeddable
data class JpaMilestoneSpendBasedOrder(
    val order: Int,
)
