package com.credzin.reward

import com.credzin.common.*
import java.util.UUID

/**
 * Input for creating reward transactions.
 * Corresponds to the GraphQL RewardTransactionCreateInput type.
 */
data class RewardTransactionCreateInput(
    val transactionId: UUID,
    val cardInput: CardInput,
    val merchantInput: MerchantInput,
    val amount: AmountInput,
    val userId: UUID,
    val transactionMetadata: RewardTransactionMetadataInput? = null,
)

/**
 * Transaction metadata input.
 * Corresponds to the GraphQL RewardTransactionMetadataInput type.
 */
data class RewardTransactionMetadataInput(
    val location: LocationInput? = null,
    val transactionChannel: TransactionChannelType? = null,
    val userInput: UserInput? = null,
)
