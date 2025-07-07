CREATE SCHEMA IF NOT EXISTS reward;

ALTER TABLE IF EXISTS public.standard_spend_based_reward SET SCHEMA reward;

-- Create standard_spend_based_reward table
CREATE TABLE IF NOT EXISTS reward.standard_spend_based_reward (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL,
    reward_type VARCHAR(50) NOT NULL,
    reward_value TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on transaction_id for better query performance
CREATE INDEX IF NOT EXISTS idx_standard_spend_based_reward_transaction_id ON reward.standard_spend_based_reward(transaction_id);

-- Create index on reward_type for filtering
CREATE INDEX IF NOT EXISTS idx_standard_spend_based_reward_type ON reward.standard_spend_based_reward(reward_type);
