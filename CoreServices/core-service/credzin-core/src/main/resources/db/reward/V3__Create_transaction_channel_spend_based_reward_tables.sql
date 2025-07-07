ALTER TABLE IF EXISTS public.transaction_channel_spend_based_reward SET SCHEMA reward;
ALTER TABLE IF EXISTS public.transaction_channel_spend_based_reward_ids SET SCHEMA reward;
ALTER TABLE IF EXISTS public.transaction_channel_spend_based_reward_value SET SCHEMA reward;

-- Create transaction_channel_spend_based_reward table
CREATE TABLE IF NOT EXISTS reward.transaction_channel_spend_based_reward (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL,
    transaction_channel_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create transaction_channel_spend_based_reward_ids table (for ElementCollection)
CREATE TABLE IF NOT EXISTS reward.transaction_channel_spend_based_reward_ids (
    transaction_channel_spend_based_reward_id UUID NOT NULL,
    reward_id UUID NOT NULL,
    FOREIGN KEY (transaction_channel_spend_based_reward_id) REFERENCES reward.transaction_channel_spend_based_reward(id) ON DELETE CASCADE
);

-- Create transaction_channel_spend_based_reward_value table
CREATE TABLE IF NOT EXISTS reward.transaction_channel_spend_based_reward_value (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reward_type VARCHAR(50) NOT NULL,
    reward_value TEXT NOT NULL,
    transaction_channel_spend_based_reward_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_channel_spend_based_reward_id) REFERENCES reward.transaction_channel_spend_based_reward(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transaction_channel_spend_based_reward_transaction_id ON reward.transaction_channel_spend_based_reward(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_channel_spend_based_reward_channel_type ON reward.transaction_channel_spend_based_reward(transaction_channel_type);
CREATE INDEX IF NOT EXISTS idx_transaction_channel_spend_based_reward_ids_reward_id ON reward.transaction_channel_spend_based_reward_ids(reward_id);
CREATE INDEX IF NOT EXISTS idx_transaction_channel_spend_based_reward_value_parent_id ON reward.transaction_channel_spend_based_reward_value(transaction_channel_spend_based_reward_id);
CREATE INDEX IF NOT EXISTS idx_transaction_channel_spend_based_reward_value_type ON reward.transaction_channel_spend_based_reward_value(reward_type);
