-- Allow users to update their own wallet balances
CREATE POLICY "Users can update own wallets"
ON public.user_wallets
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);