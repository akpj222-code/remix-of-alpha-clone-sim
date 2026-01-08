import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { triggerHaptic } from '@/hooks/useHaptic';

interface TAMGLiquidateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentShares: number;
  currentPrice: number;
  onSuccess: () => void;
}

export function TAMGLiquidateModal({
  open,
  onOpenChange,
  currentShares,
  currentPrice,
  onSuccess,
}: TAMGLiquidateModalProps) {
  const { user } = useAuth();
  const [sharesToLiquidate, setSharesToLiquidate] = useState('');
  const [loading, setLoading] = useState(false);

  const shares = parseFloat(sharesToLiquidate) || 0;
  const liquidationValue = shares * currentPrice;
  const isValid = shares > 0 && shares <= currentShares;

  useEffect(() => {
    if (open) {
      setSharesToLiquidate('');
    }
  }, [open]);

  const handleLiquidate = async () => {
    if (!user || !isValid) return;

    setLoading(true);
    triggerHaptic('medium');

    try {
      // Get current holdings
      const { data: holdingData, error: holdingError } = await supabase
        .from('tamg_holdings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (holdingError) throw holdingError;

      const remainingShares = currentShares - shares;

      if (remainingShares <= 0) {
        // Delete the holding if all shares are liquidated
        const { error: deleteError } = await supabase
          .from('tamg_holdings')
          .delete()
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;
      } else {
        // Update remaining shares
        const { error: updateError } = await supabase
          .from('tamg_holdings')
          .update({
            shares: remainingShares,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      }

      // Add the liquidation value to user's balance
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const currentBalance = parseFloat(String(profileData.balance)) || 0;
      const newBalance = currentBalance + liquidationValue;

      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', user.id);

      if (balanceError) throw balanceError;

      // Record the transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'tamg_liquidation',
          amount: liquidationValue,
          status: 'completed',
          notes: `Liquidated ${shares.toFixed(4)} TAMG shares at $${currentPrice.toFixed(2)} per share`,
        });

      if (transactionError) throw transactionError;

      triggerHaptic('success');
      toast.success(`Successfully liquidated ${shares.toFixed(4)} TAMG shares for $${liquidationValue.toFixed(2)}`);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Liquidation error:', error);
      triggerHaptic('error');
      toast.error('Failed to liquidate shares: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Liquidate TAMG Shares</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to liquidate your TAMG shares. The value will be added to your available balance.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Available Shares</Label>
            <p className="text-lg font-semibold text-foreground">
              {currentShares.toFixed(4)} shares
            </p>
          </div>

          <div className="space-y-2">
            <Label>Current Price</Label>
            <p className="text-lg font-semibold text-foreground">
              ${currentPrice.toFixed(2)} per share
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shares">Shares to Liquidate</Label>
            <Input
              id="shares"
              type="number"
              step="0.0001"
              min="0"
              max={currentShares}
              value={sharesToLiquidate}
              onChange={(e) => setSharesToLiquidate(e.target.value)}
              placeholder="Enter number of shares"
            />
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => setSharesToLiquidate(currentShares.toString())}
            >
              Liquidate all shares
            </button>
          </div>

          {shares > 0 && (
            <div className="p-4 rounded-lg bg-muted">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">You will receive:</span>
                <span className="text-xl font-bold text-success">
                  ${liquidationValue.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {shares > currentShares && (
            <p className="text-sm text-destructive">
              You cannot liquidate more shares than you own.
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLiquidate}
            disabled={!isValid || loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Processing...' : 'Confirm Liquidation'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
