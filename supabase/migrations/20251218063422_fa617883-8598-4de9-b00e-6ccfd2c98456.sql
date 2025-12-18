-- Create transactions table for tracking all user transactions
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'trade', 'tamg_purchase')),
  method TEXT CHECK (method IN ('bank', 'crypto', 'btc', 'eth', 'usdt')),
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'declined', 'processing')),
  wallet_address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
ON public.transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own transactions
CREATE POLICY "Users can insert own transactions"
ON public.transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
ON public.transactions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all transactions
CREATE POLICY "Admins can update all transactions"
ON public.transactions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create withdrawal_requests table
CREATE TABLE public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('bank', 'crypto')),
  crypto_type TEXT CHECK (crypto_type IN ('btc', 'eth', 'usdt')),
  wallet_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'completed')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own withdrawals
CREATE POLICY "Users can view own withdrawals"
ON public.withdrawal_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own withdrawals
CREATE POLICY "Users can insert own withdrawals"
ON public.withdrawal_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all withdrawals
CREATE POLICY "Admins can view all withdrawals"
ON public.withdrawal_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update withdrawals
CREATE POLICY "Admins can update all withdrawals"
ON public.withdrawal_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create TAMG holdings table
CREATE TABLE public.tamg_holdings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  shares NUMERIC NOT NULL DEFAULT 0,
  average_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tamg_holdings ENABLE ROW LEVEL SECURITY;

-- Users can view own holdings
CREATE POLICY "Users can view own TAMG holdings"
ON public.tamg_holdings
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert own holdings
CREATE POLICY "Users can insert own TAMG holdings"
ON public.tamg_holdings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update own holdings
CREATE POLICY "Users can update own TAMG holdings"
ON public.tamg_holdings
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all holdings
CREATE POLICY "Admins can view all TAMG holdings"
ON public.tamg_holdings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default TAMG price setting
INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES ('tamg_share_price', '25.00')
ON CONFLICT (setting_key) DO NOTHING;