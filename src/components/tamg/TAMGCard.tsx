import { useState, useEffect } from 'react';
import { TrendingUp, ArrowUpRight, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

interface TAMGHolding {
  shares: number;
  average_price: number;
}

export function TAMGCard() {
  const { user } = useAuth();
  const { profile, updateBalance, fetchProfile } = useProfile();
  const { toast } = useToast();
  
  const [price, setPrice] = useState(25.00);
  const [holding, setHolding] = useState<TAMGHolding | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [shares, setShares] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPrice();
    if (user) fetchHolding();
  }, [user]);

  const fetchPrice = async () => {
    const { data } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'tamg_share_price')
      .maybeSingle();
    
    if (data) setPrice(parseFloat(data.setting_value));
  };

  const fetchHolding = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('tamg_holdings')
      .select('shares, average_price')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data) setHolding({ shares: Number(data.shares), average_price: Number(data.average_price) });
  };

  const handlePurchase = async () => {
    const shareCount = parseInt(shares);
    if (isNaN(shareCount) || shareCount <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid number of shares', variant: 'destructive' });
      return;
    }

    const totalCost = shareCount * price;
    if (totalCost > (profile?.balance || 0)) {
      toast({ title: 'Insufficient Balance', description: 'You do not have enough funds', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      // Update or create holding
      if (holding && holding.shares > 0) {
        const newShares = holding.shares + shareCount;
        const newAvgPrice = ((holding.shares * holding.average_price) + (shareCount * price)) / newShares;
        
        await supabase
          .from('tamg_holdings')
          .update({ shares: newShares, average_price: newAvgPrice })
          .eq('user_id', user?.id);
      } else {
        await supabase
          .from('tamg_holdings')
          .insert({
            user_id: user?.id,
            shares: shareCount,
            average_price: price
          });
      }

      // Record transaction
      await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          type: 'tamg_purchase',
          amount: totalCost,
          status: 'completed',
          notes: `Purchased ${shareCount} TAMG shares at $${price.toFixed(2)}`
        });

      // Deduct balance
      await updateBalance((profile?.balance || 0) - totalCost);

      toast({ title: 'Success', description: `Purchased ${shareCount} TAMG shares` });
      setShowDialog(false);
      setShares('');
      fetchHolding();
      fetchProfile();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to purchase shares', variant: 'destructive' });
    }

    setLoading(false);
  };

  const totalValue = holding ? holding.shares * price : 0;
  const pnl = holding ? (price - holding.average_price) * holding.shares : 0;
  const pnlPercent = holding && holding.average_price > 0 ? ((price - holding.average_price) / holding.average_price) * 100 : 0;

  return (
    <>
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground">TAMG</p>
                <p className="text-xs text-muted-foreground">TAMIC GROUP Shares</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg text-foreground">${price.toFixed(2)}</p>
              <p className="text-xs text-success flex items-center justify-end gap-1">
                <ArrowUpRight className="h-3 w-3" />
                +2.5%
              </p>
            </div>
          </div>

          {holding && holding.shares > 0 && (
            <div className="mb-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Your Holdings</span>
                <span className="font-medium text-foreground">{holding.shares.toLocaleString()} shares</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Value</span>
                <span className="font-medium text-foreground">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">P&L</span>
                <span className={`font-medium ${pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          )}

          <Button className="w-full" size="sm" onClick={() => setShowDialog(true)}>
            Subscribe to TAMG
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subscribe to TAMG Shares</DialogTitle>
            <DialogDescription>
              Purchase TAMIC GROUP shares at ${price.toFixed(2)} per share
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Current Price</span>
                <span className="font-bold text-foreground">${price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Available Balance</span>
                <span className="font-medium text-foreground">
                  ${(profile?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Number of Shares</label>
              <Input
                type="number"
                placeholder="Enter number of shares"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="mt-1"
              />
              {shares && !isNaN(parseInt(shares)) && (
                <p className="text-sm text-muted-foreground mt-1">
                  Total Cost: ${(parseInt(shares) * price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handlePurchase} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Purchase Shares
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}