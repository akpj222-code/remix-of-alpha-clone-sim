-- Allow users to delete their own TAMG holdings (for full liquidation)
CREATE POLICY "Users can delete own TAMG holdings"
ON public.tamg_holdings
FOR DELETE
USING (auth.uid() = user_id);