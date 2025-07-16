CREATE SCHEMA IF NOT EXISTS merchant;

ALTER TABLE IF EXISTS public.merchant SET SCHEMA merchant;
ALTER TABLE IF EXISTS public.merchant_mcc SET SCHEMA merchant;
ALTER TABLE IF EXISTS public.merchant_category_code SET SCHEMA merchant;

CREATE TABLE IF NOT EXISTS merchant.merchant (
    id UUID PRIMARY KEY,
    legal_name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL,
    created_by VARCHAR(255) NOT NULL DEFAULT 'system_user',
    created_on TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255),
    updated_on TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE IF NOT EXISTS merchant.merchant_mcc (
    id UUID PRIMARY KEY,
    merchant_id UUID NOT NULL,
    mcc_code INT NOT NULL,
    created_by VARCHAR(255) NOT NULL DEFAULT 'system_user',
    created_on TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255),
    updated_on TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_merchant
        FOREIGN KEY(merchant_id)
            REFERENCES merchant.merchant(id)
);

CREATE TABLE IF NOT EXISTS merchant.merchant_category_code (
    id UUID PRIMARY KEY,
    card_network VARCHAR(255) NOT NULL,
    code INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    created_by VARCHAR(255) NOT NULL DEFAULT 'system_user',
    created_on TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255),
    updated_on TIMESTAMP WITHOUT TIME ZONE
);