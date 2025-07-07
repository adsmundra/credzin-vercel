package com.credzin.reward.milestonereward.spendbased.db

import com.credzin.reward.milestonereward.spendbased.db.embeddable.JpaMilestoneSpendBased
import jakarta.persistence.*
import java.util.*

@Entity
@Table(schema = "reward", name = "milestone_spend_based_reward_distance")
data class JpaMilestoneSpendBasedRewardDistance(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    // Corrected to UUID as per your instruction
    @Column(name = "reward_id", nullable = false, unique = true)
    val rewardId: UUID,

    @AttributeOverrides(
        AttributeOverride(name = "amountRange", column = Column(name = "current_amount_range", columnDefinition = "jsonb")),
        AttributeOverride(name = "order", column = Column(name = "current_order", columnDefinition = "jsonb")),
        AttributeOverride(name = "rewardValue", column = Column(name = "current_reward_value", columnDefinition = "text")),
        AttributeOverride(name = "timePeriod", column = Column(name = "current_time_period", columnDefinition = "jsonb"))
    )
    @Column(name = "current_milestone", columnDefinition = "jsonb")
    val currentMilestoneSpendBased: JpaMilestoneSpendBased?,

    @AttributeOverrides(
        AttributeOverride(name = "amountRange", column = Column(name = "previous_amount_range", columnDefinition = "jsonb")),
        AttributeOverride(name = "order", column = Column(name = "previous_order", columnDefinition = "jsonb")),
        AttributeOverride(name = "rewardValue", column = Column(name = "previous_reward_value", columnDefinition = "text")),
        AttributeOverride(name = "timePeriod", column = Column(name = "previous_time_period", columnDefinition = "jsonb"))
    )
    @Column(name = "previous_milestone", columnDefinition = "jsonb")
    val previousMilestoneSpendBased: JpaMilestoneSpendBased?,

    @AttributeOverrides(
        AttributeOverride(name = "amountRange", column = Column(name = "next_amount_range", columnDefinition = "jsonb")),
        AttributeOverride(name = "order", column = Column(name = "next_order", columnDefinition = "jsonb")),
        AttributeOverride(name = "rewardValue", column = Column(name = "next_reward_value", columnDefinition = "text")),
        AttributeOverride(name = "timePeriod", column = Column(name = "next_time_period", columnDefinition = "jsonb"))
    )
    @Column(name = "next_milestone", columnDefinition = "jsonb")
    val nextMilestoneSpendBased: JpaMilestoneSpendBased?,
)