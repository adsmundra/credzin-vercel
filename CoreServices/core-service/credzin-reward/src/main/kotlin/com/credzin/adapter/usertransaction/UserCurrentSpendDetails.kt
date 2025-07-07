package com.credzin.adapter.usertransaction

import com.credzin.common.Amount
import com.credzin.reward.TimePeriod
import java.util.UUID

data class UserCurrentSpendDetails(
    val userId: UUID,
    val totalAmount: Amount,
    val timePeriod: TimePeriod
)