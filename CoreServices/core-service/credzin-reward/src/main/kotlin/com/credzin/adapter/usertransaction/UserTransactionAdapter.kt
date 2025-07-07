package com.credzin.adapter.usertransaction

import com.credzin.reward.TimePeriod
import com.credzin.adapter.usertransaction.UserCurrentSpendDetails
import java.util.UUID

interface UserTransactionAdapter {

    fun getUserCurrentSpendDetails(
        userId: UUID,
        timePeriod: TimePeriod,
    ): UserCurrentSpendDetails?

}