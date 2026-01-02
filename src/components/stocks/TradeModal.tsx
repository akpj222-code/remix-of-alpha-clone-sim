import { useState } from 'react';
import { Minus, Plus, Loader2, CheckCircle2, FlaskConical } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Stock } from '@/hooks/useStocks';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useProfile } from '@/hooks/useProfile';
import { useDemo } from '@/hooks/useDemo';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TradeModalProps {
  stock: Stock | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TradeType = 'buy' | 'sell';
type TradeStep = 'input' | 'processing' | 'verifying' | 'complete';

const FEE_RATE = 0.001; // 0.1% trading fee

export function TradeModal({ stock, open, onOpenChange }: TradeModalProps) {
  const [tradeType, setTradeType] = useState<TradeType>('buy');
  const [quantity, setQuantity] = useState(1);
  const [step, setStep] = useState<TradeStep>('input');
  const { portfolio, executeTrade } = usePortfolio();
  const { profile, updateBalance } = useProfile();
  const { isDemoMode, demoBalance, demoPortfolio, executeDemoTrade } = useDemo();
  const { toast } = useToast();

  if (!stock) return null;

  const activePortfolio = isDemoMode ? demoPortfolio : portfolio;
  const activeBalance = isDemoMode ? demoBalance : (profile?.balance || 0);
  const position = activePortfolio.find(p => p.symbol === stock.symbol);
  const maxSellShares = position?.shares || 0;
  const totalValue = quantity * stock.price;
  const fee = totalValue * FEE_RATE;
  const grandTotal = tradeType === 'buy' ? totalValue + fee : totalValue - fee;

  const canTrade = tradeType === 'buy' 
    ? activeBalance >= grandTotal 
    : maxSellShares >= quantity;

  const handleQuantityChange = (delta: number) => {
    setQuantity(Math.max(1, quantity + delta));
  };

  const handleTrade = async () => {
    setStep('processing');
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setStep('verifying');
    
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (isDemoMode) {
      // Demo mode - use local state
      const { error } = executeDemoTrade(
        tradeType,
        stock.symbol,
        stock.name,
        quantity,
        stock.price,
        fee
      );

      if (error) {
        toast({
          title: "Trade Failed",
          description: error.message,
          variant: "destructive"
        });
        setStep('input');
        return;
      }
    } else {
      // Live mode - use real database
      const { error } = await executeTrade(
        tradeType,
        stock.symbol,
        stock.name,
        quantity,
        stock.price,
        fee
      );

      if (error) {
        toast({
          title: "Trade Failed",
          description: error.message,
          variant: "destructive"
        });
        setStep('input');
        return;
      }

      // Update balance
      const newBalance = tradeType === 'buy' 
        ? (profile?.balance || 0) - grandTotal
        : (profile?.balance || 0) + grandTotal;
      await updateBalance(newBalance);
    }

    setStep('complete');
  };

  const handleClose = () => {
    setStep('input');
    setQuantity(1);
    setTradeType('buy');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Trade {stock.symbol}
            <span className="text-muted-foreground font-normal text-sm">
              ${stock.price.toFixed(2)}
            </span>
            {isDemoMode && (
              <span className="ml-auto flex items-center gap-1 text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full">
                <FlaskConical className="h-3 w-3" />
                Demo
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-6">
            <Tabs value={tradeType} onValueChange={(v) => setTradeType(v as TradeType)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="buy">Buy</TabsTrigger>
                <TabsTrigger value="sell">Sell</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              <Label>Quantity</Label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-center"
                  min={1}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tradeType === 'sell' && (
                <p className="text-xs text-muted-foreground">
                  Available: {maxSellShares.toFixed(4)} shares
                </p>
              )}
            </div>

            <div className="space-y-2 rounded-lg border p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${totalValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Trading Fee (0.1%)</span>
                <span>${fee.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {tradeType === 'buy' && (
              <p className="text-xs text-muted-foreground">
                Available Balance: ${activeBalance.toFixed(2)}
                {isDemoMode && " (Demo)"}
              </p>
            )}

            <Button
              className="w-full"
              onClick={handleTrade}
              disabled={!canTrade}
            >
              {tradeType === 'buy' ? 'Buy' : 'Sell'} {stock.symbol}
            </Button>

            {!canTrade && (
              <p className="text-xs text-destructive text-center">
                {tradeType === 'buy' 
                  ? 'Insufficient balance' 
                  : 'Insufficient shares'}
              </p>
            )}
          </div>
        )}

        {(step === 'processing' || step === 'verifying') && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-lg font-medium">
              {step === 'processing' ? 'Processing order...' : 'Verifying funds...'}
            </p>
            <p className="text-sm text-muted-foreground">
              Please wait while we process your {tradeType} order
            </p>
          </div>
        )}

        {step === 'complete' && (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 mx-auto text-success" />
            <h3 className="text-xl font-semibold">Order Confirmed!</h3>
            <div className="rounded-lg border p-4 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <span className={cn(
                  "font-medium",
                  tradeType === 'buy' ? "text-success" : "text-destructive"
                )}>
                  {tradeType.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Symbol</span>
                <span className="font-medium">{stock.symbol}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shares</span>
                <span>{quantity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price</span>
                <span>${stock.price.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
            </div>
            <Button className="w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}