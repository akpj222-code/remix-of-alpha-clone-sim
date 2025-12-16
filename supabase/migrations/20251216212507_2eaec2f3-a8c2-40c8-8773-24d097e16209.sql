-- Add wallet_id to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wallet_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
ADD COLUMN IF NOT EXISTS bank_routing_number TEXT;

-- Generate wallet IDs for existing users (TG-XXXXXXXX format)
UPDATE public.profiles 
SET wallet_id = 'TG-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT), 1, 8))
WHERE wallet_id IS NULL;

-- Create trigger to auto-generate wallet_id for new users
CREATE OR REPLACE FUNCTION public.generate_wallet_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.wallet_id IS NULL THEN
    NEW.wallet_id := 'TG-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NEW.id::TEXT), 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS generate_wallet_id_trigger ON public.profiles;
CREATE TRIGGER generate_wallet_id_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_wallet_id();

-- Create admin settings table for deposit addresses
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write admin settings
CREATE POLICY "Admins can read settings" ON public.admin_settings
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert settings" ON public.admin_settings
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update settings" ON public.admin_settings
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default deposit settings
INSERT INTO public.admin_settings (setting_key, setting_value) VALUES
  ('deposit_bank_name', 'First National Bank'),
  ('deposit_bank_account', '1234567890'),
  ('deposit_bank_routing', '021000021'),
  ('deposit_bank_account_name', 'TAMIC Group Holdings'),
  ('deposit_btc_address', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'),
  ('deposit_eth_address', '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'),
  ('deposit_usdt_address', 'TXsmKpEuW7qWnXzJLGP9eDLvWPR2GRn1FS')
ON CONFLICT (setting_key) DO NOTHING;

-- Create user wallet addresses table for crypto
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, currency)
);

ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallets" ON public.user_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallets" ON public.user_wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets" ON public.user_wallets
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to update any profile (for fund management)
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));