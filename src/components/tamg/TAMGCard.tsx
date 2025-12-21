import { useState, useEffect } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
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
  
  const [basePrice, setBasePrice] = useState(25.00);
  const [displayPrice, setDisplayPrice] = useState(25.00);
  const [priceChange, setPriceChange] = useState(0);
  const [holding, setHolding] = useState<TAMGHolding | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [shares, setShares] = useState('');
  const [loading, setLoading] = useState(false);
  const [minShares, setMinShares] = useState(1);

  useEffect(() => {
    fetchPrice();
    fetchMinShares();
    if (user) fetchHolding();
  }, [user]);

  // Dynamic price fluctuation algorithm
  useEffect(() => {
    const interval = setInterval(() => {
      // Mostly bullish with occasional dips (70% up, 30% down)
      const direction = Math.random() > 0.3 ? 1 : -1;
      // Small fluctuation: 0.1% to 0.5%
      const changePercent = (Math.random() * 0.4 + 0.1) * direction;
      const newPrice = displayPrice * (1 + changePercent / 100);
      
      // Keep within reasonable bounds (80% to 150% of base price)
      const minPrice = basePrice * 0.8;
      const maxPrice = basePrice * 1.5;
      const boundedPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
      
      setDisplayPrice(boundedPrice);
      setPriceChange(((boundedPrice - basePrice) / basePrice) * 100);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [displayPrice, basePrice]);

  const fetchPrice = async () => {
    const { data } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'tamg_share_price')
      .maybeSingle();
    
    if (data) {
      const price = parseFloat(data.setting_value);
      setBasePrice(price);
      setDisplayPrice(price);
    }
  };

  const fetchMinShares = async () => {
    const { data } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'min_shares_purchase')
      .maybeSingle();
    
    if (data) setMinShares(parseInt(data.setting_value) || 1);
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
    if (isNaN(shareCount) || shareCount < minShares) {
      toast({ title: 'Error', description: `Minimum purchase is ${minShares} shares`, variant: 'destructive' });
      return;
    }

    const totalCost = shareCount * displayPrice;
    if (totalCost > (profile?.balance || 0)) {
      toast({ title: 'Insufficient Balance', description: 'You do not have enough funds', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      if (holding && holding.shares > 0) {
        const newShares = holding.shares + shareCount;
        const newAvgPrice = ((holding.shares * holding.average_price) + (shareCount * displayPrice)) / newShares;
        
        await supabase
          .from('tamg_holdings')
          .update({ shares: newShares, average_price: newAvgPrice })
          .eq('user_id', user?.id);
      } else {
        await supabase
          .from('tamg_holdings')
          .insert({ user_id: user?.id, shares: shareCount, average_price: displayPrice });
      }

      await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          type: 'tamg_purchase',
          amount: totalCost,
          status: 'completed',
          notes: `Purchased ${shareCount} TAMG shares at $${displayPrice.toFixed(2)}`
        });

      await updateBalance((profile?.balance || 0) - totalCost);

      // Notify admin
      await supabase.functions.invoke('send-admin-email', {
        body: {
          type: 'purchase',
          userId: user?.id,
          amount: totalCost,
          details: `TAMG Purchase: ${shareCount} shares at $${displayPrice.toFixed(2)}`
        }
      }).catch(console.error);

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

  const totalValue = holding ? holding.shares * displayPrice : 0;
  const pnl = holding ? (displayPrice - holding.average_price) * holding.shares : 0;
  const pnlPercent = holding && holding.average_price > 0 ? ((displayPrice - holding.average_price) / holding.average_price) * 100 : 0;

  return (
    <>
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-foreground">TAMG</p>
                <p className="text-xs text-muted-foreground truncate">TAMIC GROUP Shares</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-lg text-foreground">${displayPrice.toFixed(2)}</p>
              <p className={`text-xs flex items-center justify-end gap-1 ${priceChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                {priceChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </p>
            </div>
          </div>

          {holding && holding.shares > 0 && (
            <div className="mb-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Your Holdings</span>
                <span className="font-medium text-foreground">{holding.shares.toLocaleString()} shares</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm mt-1">
                <span className="text-muted-foreground">Value</span>
                <span className="font-medium text-foreground">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm mt-1">
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
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Subscribe to TAMG Shares</DialogTitle>
            <DialogDescription>
              Purchase TAMIC GROUP shares at ${displayPrice.toFixed(2)} per share (min: {minShares})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Current Price</span>
                <span className="font-bold text-foreground">${displayPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Available Balance</span>
                <span className="font-medium text-foreground">
                  ${(profile?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Number of Shares (min: {minShares})</label>
              <Input
                type="number"
                placeholder={`Enter at least ${minShares} shares`}
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                min={minShares}
                className="mt-1"
              />
              {shares && !isNaN(parseInt(shares)) && (
                <p className="text-sm text-muted-foreground mt-1">
                  Total Cost: ${(parseInt(shares) * displayPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
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