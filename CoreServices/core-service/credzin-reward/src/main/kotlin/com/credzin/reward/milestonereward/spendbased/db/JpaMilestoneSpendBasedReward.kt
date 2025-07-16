package com.credzin.reward.milestonereward.spendbased.db

import jakarta.persistence.*
import java.util.UUID

@Entity
@Table(schema = "reward", name = "milestone_spend_based_reward")
data class JpaMilestoneSpendBasedReward(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: UUID? = null,

    @Column(nullable = false, unique = true)
    val transactionId: UUID,
) {
    // Conversion functions to/from domain entity will be added here later
}