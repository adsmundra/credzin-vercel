ALTER TABLE IF EXISTS public.partner_spend_based_reward SET SCHEMA reward;
ALTER TABLE IF EXISTS public.partner_spend_based_reward_ids SET SCHEMA reward;
ALTER TABLE IF EXISTS public.partner_spend_based_reward_value SET SCHEMA reward;

-- Create partner_spend_based_reward table
CREATE TABLE IF NOT EXISTS reward.partner_spend_based_reward (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL,
    partner_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create partner_spend_based_reward_ids table (for ElementCollection)
CREATE TABLE IF NOT EXISTS reward.partner_spend_based_reward_ids (
    partner_spend_based_reward_id UUID NOT NULL,
    reward_id UUID NOT NULL,
    FOREIGN KEY (partner_spend_based_reward_id) REFERENCES reward.partner_spend_based_reward(id) ON DELETE CASCADE
);

-- Create partner_spend_based_reward_value table
CREATE TABLE IF NOT EXISTS reward.partner_spend_based_reward_value (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reward_type VARCHAR(50) NOT NULL,
    reward_value TEXT NOT NULL,
    partner_spend_based_reward_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (partner_spend_based_reward_id) REFERENCES reward.partner_spend_based_reward(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_partner_spend_based_reward_transaction_id ON reward.partner_spend_based_reward(transaction_id);
CREATE INDEX IF NOT EXISTS idx_partner_spend_based_reward_partner_id ON reward.partner_spend_based_reward(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_spend_based_reward_ids_reward_id ON reward.partner_spend_based_reward_ids(reward_id);
CREATE INDEX IF NOT EXISTS idx_partner_spend_based_reward_value_parent_id ON reward.partner_spend_based_reward_value(partner_spend_based_reward_id);
CREATE INDEX IF NOT EXISTS idx_partner_spend_based_reward_value_type ON reward.partner_spend_based_reward_value(reward_type);
