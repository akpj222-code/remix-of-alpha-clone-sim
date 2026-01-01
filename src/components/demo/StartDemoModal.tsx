import { useState } from 'react';
import { FlaskConical, DollarSign, GraduationCap, TrendingUp, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDemo } from '@/hooks/useDemo';
import { useNavigate } from 'react-router-dom';

const PRESET_AMOUNTS = [10000, 50000, 100000, 500000];

interface StartDemoModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

export function StartDemoModal({ open: controlledOpen, onOpenChange, showTrigger = true }: StartDemoModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(50000);
  const { startDemo } = useDemo();
  const navigate = useNavigate();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;

  const handleStart = () => {
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount;
    if (amount && amount > 0) {
      startDemo(amount);
      setOpen(false);
      navigate('/dashboard');
    }
  };

  const features = [
    { icon: Shield, text: "Risk-free trading environment" },
    { icon: GraduationCap, text: "Interactive trading tutorials" },
    { icon: TrendingUp, text: "Real market data simulation" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <FlaskConical className="h-4 w-4" />
            Try Demo
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Start Demo Trading
          </DialogTitle>
          <DialogDescription>
            Practice trading with virtual money. Learn the ropes without any risk!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Features */}
          <div className="grid gap-3">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-4 w-4 text-primary" />
                </div>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Amount Selection */}
          <div className="space-y-3">
            <Label>Choose your starting balance</Label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_AMOUNTS.map((amount) => (
                <Button
                  key={amount}
                  variant={selectedAmount === amount && !customAmount ? "default" : "outline"}
                  className="w-full"
                  onClick={() => {
                    setSelectedAmount(amount);
                    setCustomAmount('');
                  }}
                >
                  ${amount.toLocaleString()}
                </Button>
              ))}
            </div>
            
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Or enter custom amount..."
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                className="pl-9"
                min="100"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleStart}
            disabled={!selectedAmount && !customAmount}
            className="gap-2"
          >
            <FlaskConical className="h-4 w-4" />
            Start Demo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
