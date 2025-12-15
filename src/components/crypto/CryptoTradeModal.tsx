import { useState, useEffect } from 'react';
import { Minus, Plus, Loader2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
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
import { Crypto } from '@/hooks/useCrypto';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CryptoTradeModalProps {
  crypto: Crypto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TradeType = 'buy' | 'sell';
type TradeStep = 'input' | 'processing' | 'verifying' | 'waiting' | 'complete';

const FEE_RATE = 0.0015; // 0.15% trading fee for crypto

export function CryptoTradeModal({ crypto, open, onOpenChange }: CryptoTradeModalProps) {
  const [tradeType, setTradeType] = useState<TradeType>('buy');
  const [quantity, setQuantity] = useState('1');
  const [step, setStep] = useState<TradeStep>('input');
  const [processingTime, setProcessingTime] = useState(0);
  const { portfolio, executeTrade } = usePortfolio();
  const { profile, updateBalance } = useProfile();
  const { toast } = useToast();

  useEffect(() => {
    if (step === 'processing' || step === 'verifying' || step === 'waiting') {
      const interval = setInterval(() => {
        setProcessingTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step]);

  if (!crypto) return null;

  const numQuantity = parseFloat(quantity) || 0;
  const position = portfolio.find(p => p.symbol === crypto.symbol);
  const maxSellShares = position?.shares || 0;
  const totalValue = numQuantity * crypto.price;
  const fee = totalValue * FEE_RATE;
  const grandTotal = tradeType === 'buy' ? totalValue + fee : totalValue - fee;

  const canTrade = tradeType === 'buy'
    ? (profile?.balance || 0) >= grandTotal && numQuantity > 0
    : maxSellShares >= numQuantity && numQuantity > 0;

  const handleQuantityChange = (delta: number) => {
    const current = parseFloat(quantity) || 0;
    const newVal = Math.max(0.0001, current + delta);
    setQuantity(newVal.toString());
  };

  const handleTrade = async () => {
    setProcessingTime(0);
    setStep('processing');

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setStep('verifying');

    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Show waiting message if it takes longer
    setStep('waiting');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Execute trade
    const { error } = await executeTrade(
      tradeType,
      crypto.symbol,
      crypto.name,
      numQuantity,
      crypto.price,
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

    setStep('complete');
  };

  const handleClose = () => {
    setStep('input');
    setQuantity('1');
    setTradeType('buy');
    setProcessingTime(0);
    onOpenChange(false);
  };

  const formatPrice = (price: number) => {
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Trade {crypto.symbol}
            <span className="text-muted-foreground font-normal text-sm">
              {formatPrice(crypto.price)}
            </span>
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
                  onClick={() => handleQuantityChange(-0.1)}
                  disabled={parseFloat(quantity) <= 0.1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="text-center"
                  step="0.0001"
                  min="0.0001"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(0.1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tradeType === 'sell' && (
                <p className="text-xs text-muted-foreground">
                  Available: {maxSellShares.toFixed(6)} {crypto.symbol}
                </p>
              )}
            </div>

            <div className="space-y-2 rounded-lg border p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${totalValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Trading Fee (0.15%)</span>
                <span>${fee.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {tradeType === 'buy' && (
              <p className="text-xs text-muted-foreground">
                Available Balance: ${(profile?.balance || 0).toFixed(2)}
              </p>
            )}

            <Button
              className="w-full"
              onClick={handleTrade}
              disabled={!canTrade}
            >
              {tradeType === 'buy' ? 'Buy' : 'Sell'} {crypto.symbol}
            </Button>

            {!canTrade && numQuantity > 0 && (
              <p className="text-xs text-destructive text-center">
                {tradeType === 'buy'
                  ? 'Insufficient balance'
                  : 'Insufficient holdings'}
              </p>
            )}
          </div>
        )}

        {(step === 'processing' || step === 'verifying' || step === 'waiting') && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-lg font-medium">
              {step === 'processing' && 'Processing order...'}
              {step === 'verifying' && 'Verifying on blockchain...'}
              {step === 'waiting' && 'Almost there...'}
            </p>
            <p className="text-sm text-muted-foreground">
              Please wait while we process your {tradeType} order
            </p>
            {processingTime > 5 && (
              <div className="flex items-center justify-center gap-2 text-warning">
                <Clock className="h-4 w-4" />
                <span className="text-sm">This may take a moment, please hold on...</span>
              </div>
            )}
          </div>
        )}

        {step === 'complete' && (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 mx-auto text-success" />
            <h3 className="text-xl font-semibold">Trade Confirmed!</h3>
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
                <span className="text-muted-foreground">Asset</span>
                <span className="font-medium">{crypto.symbol}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Quantity</span>
                <span>{numQuantity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price</span>
                <span>{formatPrice(crypto.price)}</span>
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
