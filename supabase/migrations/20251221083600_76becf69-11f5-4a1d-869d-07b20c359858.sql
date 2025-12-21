-- Phase 1: Change default balance to 0 for new users
ALTER TABLE profiles ALTER COLUMN balance SET DEFAULT 0;

-- Add balance column to user_wallets for crypto balance tracking
ALTER TABLE user_wallets ADD COLUMN IF NOT EXISTS balance numeric DEFAULT 0;

-- Add from_tamic_wallet flag to withdrawal_requests
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS from_tamic_wallet boolean DEFAULT false;

-- Add tutorial tracking columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tutorial_completed boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_tutorial_completed boolean DEFAULT false;

-- Add admin notification email setting
INSERT INTO admin_settings (setting_key, setting_value) 
VALUES ('admin_notification_email', 'admin@tamicgroup.com')
ON CONFLICT (setting_key) DO NOTHING;

-- Add min_shares_purchase setting if not exists
INSERT INTO admin_settings (setting_key, setting_value) 
VALUES ('min_shares_purchase', '1')
ON CONFLICT (setting_key) DO NOTHING;