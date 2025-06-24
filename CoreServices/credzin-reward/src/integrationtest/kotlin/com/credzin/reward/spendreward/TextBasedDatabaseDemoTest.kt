package com.credzin.reward.spendreward

import com.credzin.common.*
import com.credzin.reward.*
import com.credzin.reward.config.JpaTestApplication
import com.credzin.reward.spendreward.standard.db.JpaStandardSpendBasedRewardEntity
import com.credzin.reward.spendreward.standard.db.StandardSpendBasedRewardJpaRepository
import com.credzin.reward.spendreward.transactionchannel.db.JpaTransactionChannelSpendBasedRewardEntity
import com.credzin.reward.spendreward.transactionchannel.db.JpaTransactionChannelSpendBasedRewardValueEntity
import com.credzin.reward.spendreward.transactionchannel.db.TransactionChannelSpendBasedRewardJpaRepository
import com.credzin.reward.spendreward.transactionchannel.db.TransactionChannelSpendBasedRewardValueJpaRepository
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.ContextConfiguration
import java.util.*

/**
 * Demonstration test showing how the new text-based approach works.
 * This shows that JSON data is stored as readable text in the database.
 */
@DataJpaTest
@ActiveProfiles("test")
@ContextConfiguration(classes = [JpaTestApplication::class])
class TextBasedDatabaseDemoTest {
    @Autowired
    private lateinit var entityManager: TestEntityManager

    @Autowired
    private lateinit var standardRepository: StandardSpendBasedRewardJpaRepository

    @Autowired
    private lateinit var transactionChannelRepository: TransactionChannelSpendBasedRewardJpaRepository

    @Autowired
    private lateinit var transactionChannelValueRepository: TransactionChannelSpendBasedRewardValueJpaRepository

    @Autowired
    private lateinit var jdbcTemplate: JdbcTemplate

    @Test
    fun `should demonstrate text-based JSON storage in database`() {
        // Create sample data using JSON strings instead of objects
        val transactionId = UUID.randomUUID()
        val transactionChannelRewardId = UUID.randomUUID()

        // 1. Standard Spend Based Reward using JsonUtils for serialization
        val rewardPointValue =
            RewardPointValue(
                rewardPoint =
                    RewardPoint(
                        type = RewardPointType.STANDARD,
                        value = 150.5f,
                        valueType = RewardValueType.ABSOLUTE,
                    ),
            )

        val standardReward =
            JpaStandardSpendBasedRewardEntity(
                transactionId = transactionId,
                rewardType = RewardType.REWARD_POINT,
                rewardValue = jacksonObjectMapper().writeValueAsString(rewardPointValue),
            )
        standardRepository.save(standardReward)

        // 2. Transaction Channel Reward with reward IDs
        val transactionChannelReward =
            JpaTransactionChannelSpendBasedRewardEntity(
                transactionId = transactionId,
                transactionChannelType = TransactionChannelType.ONLINE,
                rewardIds = listOf(UUID.randomUUID(), UUID.randomUUID()),
            )
        transactionChannelRepository.save(transactionChannelReward)

        // 3. Transaction Channel Reward Values using JsonUtils for serialization
        val percentageRewardValue =
            RewardPointValue(
                rewardPoint =
                    RewardPoint(
                        type = RewardPointType.STANDARD,
                        value = 25.0f,
                        valueType = RewardValueType.PERCENTAGE,
                    ),
            )

        val amountRewardValue =
            AmountRewardValue(
                amount =
                    Amount(
                        amount = 50.75f,
                        currency = CurrencyCode.USD,
                    ),
            )

        val voucherRewardValue =
            VoucherRewardValue(
                voucher =
                    Voucher(
                        id = UUID.randomUUID(),
                        reference = "VOUCHER-2024-001",
                        provider = VoucherProvider.AMAZON_SHOPPING,
                        image = "https://example.com/voucher.jpg",
                    ),
            )

        val rewardValues =
            listOf(
                // RewardPointValue using simplified JsonUtils
                JpaTransactionChannelSpendBasedRewardValueEntity(
                    rewardType = RewardType.REWARD_POINT,
                    rewardValue = jacksonObjectMapper().writeValueAsString(percentageRewardValue),
                    transactionChannelSpendBasedRewardId = transactionChannelRewardId,
                ),
                // AmountRewardValue using simplified JsonUtils
                JpaTransactionChannelSpendBasedRewardValueEntity(
                    rewardType = RewardType.AMOUNT,
                    rewardValue = jacksonObjectMapper().writeValueAsString(amountRewardValue),
                    transactionChannelSpendBasedRewardId = transactionChannelRewardId,
                ),
                // VoucherRewardValue using simplified JsonUtils
                JpaTransactionChannelSpendBasedRewardValueEntity(
                    rewardType = RewardType.VOUCHER,
                    rewardValue = jacksonObjectMapper().writeValueAsString(voucherRewardValue),
                    transactionChannelSpendBasedRewardId = transactionChannelRewardId,
                ),
            )

        rewardValues.forEach { transactionChannelValueRepository.save(it) }

        entityManager.flush()

        // Now let's inspect the actual database records
        println("\n" + "=".repeat(80))
        println("TEXT-BASED DATABASE DEMONSTRATION")
        println("=".repeat(80))

        // 1. Standard Spend Based Reward Table
        println("\n1. STANDARD_SPEND_BASED_REWARD Table:")
        println("-".repeat(50))
        val standardRecords =
            jdbcTemplate.queryForList(
                "SELECT id, transaction_id, reward_type, reward_value, created_at FROM standard_spend_based_reward",
            )
        standardRecords.forEach { record ->
            println("ID: ${record["id"]}")
            println("Transaction ID: ${record["transaction_id"]}")
            println("Reward Type: ${record["reward_type"]}")
            println("Reward Value (TEXT): ${record["reward_value"]}")
            println("Created At: ${record["created_at"]}")
            println("-".repeat(50))
        }

        // 2. Transaction Channel Reward Value Table
        println("\n2. TRANSACTION_CHANNEL_SPEND_BASED_REWARD_VALUE Table:")
        println("-".repeat(50))
        val rewardValueRecords =
            jdbcTemplate.queryForList(
                "SELECT id, transaction_channel_spend_based_reward_id, reward_value, created_at FROM transaction_channel_spend_based_reward_value",
            )
        rewardValueRecords.forEach { record ->
            println("ID: ${record["id"]}")
            println("Parent Reward ID: ${record["transaction_channel_spend_based_reward_id"]}")
            println("Reward Value (TEXT): ${record["reward_value"]}")
            println("Created At: ${record["created_at"]}")
            println("-".repeat(50))
        }

        // 3. Show table schemas to demonstrate TEXT columns (using H2-compatible query)
        println("\n3. TABLE SCHEMAS (showing TEXT columns):")
        println("-".repeat(50))

        val tables =
            listOf(
                "standard_spend_based_reward",
                "transaction_channel_spend_based_reward_value",
            )

        tables.forEach { tableName ->
            println("\nTable: $tableName")
            val columns =
                jdbcTemplate.queryForList(
                    "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? ORDER BY ORDINAL_POSITION",
                    tableName.uppercase(),
                )
            columns.forEach { column ->
                val columnName = column["COLUMN_NAME"]
                val dataType = column["DATA_TYPE"]
                val isNullable = column["IS_NULLABLE"]

                if (columnName == "REWARD_VALUE") {
                    println("  ✅ $columnName: $dataType (Nullable: $isNullable) <- TEXT COLUMN FOR JSON")
                } else {
                    println("  $columnName: $dataType (Nullable: $isNullable)")
                }
            }
        }

        // 4. Demonstrate JSON validation
        println("\n4. JSON VALIDATION DEMONSTRATION:")
        println("-".repeat(50))

        // Query the JSON data and show it's valid JSON
        val jsonData =
            jdbcTemplate.queryForList(
                "SELECT reward_value FROM standard_spend_based_reward UNION ALL SELECT reward_value FROM transaction_channel_spend_based_reward_value",
            )

        jsonData.forEach { row ->
            val json = row["reward_value"] as String
            println("JSON: $json")
            println("Valid JSON: ${isValidJson(json)}")
            println("Pretty JSON:")
            println(prettyPrintJson(json))
            println("-".repeat(30))
        }

        println("\n" + "=".repeat(80))
        println("BENEFITS OF TEXT-BASED APPROACH:")
        println("✅ Database is readable without application")
        println("✅ JSON data can be queried with SQL")
        println("✅ No dependency on database-specific JSON types")
        println("✅ Easy to debug and inspect data")
        println("✅ Works with any database (H2, PostgreSQL, MySQL, etc.)")
        println("=".repeat(80))
    }

    private fun isValidJson(json: String): Boolean {
        return try {
            com.fasterxml.jackson.databind.ObjectMapper().readTree(json)
            true
        } catch (e: Exception) {
            false
        }
    }

    private fun prettyPrintJson(json: String): String {
        return try {
            val mapper = com.fasterxml.jackson.databind.ObjectMapper()
            val jsonNode = mapper.readTree(json)
            mapper.writerWithDefaultPrettyPrinter().writeValueAsString(jsonNode)
        } catch (e: Exception) {
            json
        }
    }
}
