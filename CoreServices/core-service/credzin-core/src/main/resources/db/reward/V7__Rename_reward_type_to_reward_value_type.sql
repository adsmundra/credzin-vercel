-- Rename reward_type column to reward_value_type in all reward tables

-- 1. Rename column in standard_spend_based_reward table
ALTER TABLE reward.standard_spend_based_reward 
RENAME COLUMN reward_type TO reward_value_type;

-- 2. Rename column in partner_spend_based_reward_value table
ALTER TABLE reward.partner_spend_based_reward_value 
RENAME COLUMN reward_type TO reward_value_type;

-- 3. Rename column in transaction_channel_spend_based_reward_value table
ALTER TABLE reward.transaction_channel_spend_based_reward_value 
RENAME COLUMN reward_type TO reward_value_type;

-- 4. Rename indexes to match new column names
-- Drop old indexes
DROP INDEX IF EXISTS reward.idx_standard_spend_based_reward_type;
DROP INDEX IF EXISTS reward.idx_partner_spend_based_reward_value_type;
DROP INDEX IF EXISTS reward.idx_transaction_channel_spend_based_reward_value_type;

-- Create new indexes with updated names
CREATE INDEX IF NOT EXISTS idx_standard_spend_based_reward_value_type 
ON reward.standard_spend_based_reward(reward_value_type);

CREATE INDEX IF NOT EXISTS idx_partner_spend_based_reward_value_type 
ON reward.partner_spend_based_reward_value(reward_value_type);

CREATE INDEX IF NOT EXISTS idx_transaction_channel_spend_based_reward_value_type 
ON reward.transaction_channel_spend_based_reward_value(reward_value_type);