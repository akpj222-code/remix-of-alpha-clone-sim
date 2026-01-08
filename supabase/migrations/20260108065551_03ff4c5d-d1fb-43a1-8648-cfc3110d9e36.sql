-- Drop the existing check constraint and add updated one with tamg_liquidation
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('deposit', 'withdrawal', 'trade', 'fee', 'transfer', 'tamg_liquidation', 'tamg_purchase'));