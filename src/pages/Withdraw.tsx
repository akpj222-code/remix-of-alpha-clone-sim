import { useState, useEffect } from 'react';
import { ArrowDownToLine, Building2, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';

// Custom ETH Diamond Icon
const EthDiamondIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 256 417" className={className} fill="currentColor">
    <path d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z" opacity="0.6"/>
    <path d="M127.962 0L0 212.32l127.962 75.639V154.158z"/>
    <path d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.601L256 236.587z" opacity="0.6"/>
    <path d="M127.962 416.905v-104.72L0 236.585z"/>
    <path d="M127.961 287.958l127.96-75.637-127.96-58.162z" opacity="0.2"/>
    <path d="M0 212.32l127.96 75.638v-133.8z" opacity="0.6"/>
  </svg>
);

type WithdrawMethod = 'bank' | 'crypto';
type CryptoType = 'btc' | 'eth' | 'usdt';
type WithdrawStep = 'select' | 'details' | 'processing' | 'result';

interface BankDetails {
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  bank_routing_number: string | null;
}

interface UserWallet {
  id: string;
  currency: string;
  address: string;
}

export default function WithdrawPage() {
  const { profile, updateBalance, fetchProfile } = useProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const [step, setStep] = useState<WithdrawStep>('select');
  const [method, setMethod] = useState<WithdrawMethod>('bank');
  const [cryptoType, setCryptoType] = useState<CryptoType>('btc');
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [useStoredWallet, setUseStoredWallet] = useState(false);
  const [result, setResult] = useState<'success' | 'declined'>('success');
  const [userWallets, setUserWallets] = useState<UserWallet[]>([]);

  // Check URL params for pre-selected crypto
  useEffect(() => {
    const crypto = searchParams.get('crypto');
    const fromTamic = searchParams.get('fromTamic');
    
    if (crypto && ['btc', 'eth', 'usdt'].includes(crypto.toLowerCase())) {
      setMethod('crypto');
      setCryptoType(crypto.toLowerCase() as CryptoType);
      if (fromTamic === 'true') {
        setUseStoredWallet(true);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      fetchUserWallets();
    }
  }, [user]);

  const fetchUserWallets = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_wallets')
      .select('id, currency, address')
      .eq('user_id', user.id);
    if (data) setUserWallets(data);
  };

  const bankDetails: BankDetails = {
    bank_name: profile?.bank_name || null,
    bank_account_number: profile?.bank_account_number || null,
    bank_account_name: profile?.bank_account_name || null,
    bank_routing_number: profile?.bank_routing_number || null,
  };

  const hasBankDetails = bankDetails.bank_name && bankDetails.bank_account_number;

  const handleProceed = () => {
    if (method === 'bank' && !hasBankDetails) {
      toast({
        title: 'Bank Details Required',
        description: 'Please add your bank details in Settings first',
        variant: 'destructive'
      });
      return;
    }
    setStep('details');
  };

  const getRandomDelay = () => {
    const delays = [2000, 3000, 4000, 5000, 7000, 10000];
    return delays[Math.floor(Math.random() * delays.length)];
  };

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    if (withdrawAmount > (profile?.balance || 0)) {
      toast({ title: 'Insufficient Balance', description: 'You do not have enough funds', variant: 'destructive' });
      return;
    }

    if (method === 'crypto' && !walletAddress && !useStoredWallet) {
      toast({ title: 'Error', description: 'Please enter a wallet address', variant: 'destructive' });
      return;
    }

    setStep('processing');

    // Random delay
    const delay = getRandomDelay();
    await new Promise(resolve => setTimeout(resolve, delay));

    // Very rare decline (2% chance)
    const isDeclined = Math.random() < 0.02;
    
    if (isDeclined) {
      setResult('declined');
      setStep('result');
      return;
    }

    // Get wallet address
    const userWallet = getUserWallet(cryptoType);
    const finalWalletAddress = useStoredWallet && userWallet
      ? userWallet.address
      : walletAddress;

    // Create withdrawal request
    const { error: withdrawError } = await supabase
      .from('withdrawal_requests')
      .insert({
        user_id: user?.id,
        amount: withdrawAmount,
        method,
        crypto_type: method === 'crypto' ? cryptoType : null,
        wallet_address: method === 'crypto' ? finalWalletAddress : null,
        status: 'pending',
        from_tamic_wallet: useStoredWallet
      });

    if (withdrawError) {
      console.error('Withdrawal error:', withdrawError);
      toast({ title: 'Error', description: 'Failed to process withdrawal', variant: 'destructive' });
      setStep('details');
      return;
    }

    // Record transaction
    await supabase
      .from('transactions')
      .insert({
        user_id: user?.id,
        type: 'withdrawal',
        method: method === 'crypto' ? cryptoType : 'bank',
        amount: withdrawAmount,
        status: 'pending',
        wallet_address: method === 'crypto' ? finalWalletAddress : null,
        notes: method === 'bank' 
          ? `Bank: ${bankDetails.bank_name}` 
          : `${cryptoType.toUpperCase()} withdrawal${useStoredWallet ? ' from TAMIC wallet' : ''}`
      });

    // Deduct balance from main account
    await updateBalance((profile?.balance || 0) - withdrawAmount);

    setResult('success');
    setStep('result');
    await fetchProfile();
  };

  const resetForm = () => {
    setStep('select');
    setAmount('');
    setWalletAddress('');
    setUseStoredWallet(false);
  };

  const getUserWallet = (type: string): UserWallet | undefined => {
    return userWallets.find(w => w.currency.toLowerCase() === type.toLowerCase());
  };

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Withdraw Funds</h1>
          <p className="text-muted-foreground">
            Transfer your funds to bank account or crypto wallet
          </p>
        </div>

        {/* Balance Card */}
        <Card className="border-primary/20">
          <CardContent className="p-4 sm:p-6">
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">
              ${(profile?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        {/* Step: Select Method */}
        {step === 'select' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownToLine className="h-5 w-5" />
                Withdrawal Method
              </CardTitle>
              <CardDescription>Choose how you want to receive your funds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={method} onValueChange={(v) => setMethod(v as WithdrawMethod)}>
                <div 
                  className={`flex items-center space-x-4 p-4 rounded-lg border cursor-pointer transition-colors ${method === 'bank' ? 'border-primary bg-primary/5' : 'border-border'}`}
                  onClick={() => setMethod('bank')}
                >
                  <RadioGroupItem value="bank" id="bank" />
                  <Building2 className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="bank" className="text-base font-medium cursor-pointer">Bank Transfer</Label>
                    <p className="text-sm text-muted-foreground">Withdraw to your bank account</p>
                    {!hasBankDetails && (
                      <p className="text-xs text-destructive mt-1">Bank details not configured</p>
                    )}
                  </div>
                </div>

                <div 
                  className={`flex items-center space-x-4 p-4 rounded-lg border cursor-pointer transition-colors ${method === 'crypto' ? 'border-primary bg-primary/5' : 'border-border'}`}
                  onClick={() => setMethod('crypto')}
                >
                  <RadioGroupItem value="crypto" id="crypto" />
                  <span className="text-2xl">₿</span>
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="crypto" className="text-base font-medium cursor-pointer">Cryptocurrency</Label>
                    <p className="text-sm text-muted-foreground">Withdraw to crypto wallet</p>
                  </div>
                </div>
              </RadioGroup>

              <Button className="w-full" onClick={handleProceed}>
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: Details */}
        {step === 'details' && (
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Details</CardTitle>
              <CardDescription>
                {method === 'bank' ? 'Enter amount to withdraw to your bank' : 'Select crypto and enter details'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {method === 'bank' && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Bank Account</p>
                  <p className="text-sm text-muted-foreground">{bankDetails.bank_name}</p>
                  <p className="text-sm text-muted-foreground">{bankDetails.bank_account_name}</p>
                  <p className="text-sm font-mono">{bankDetails.bank_account_number}</p>
                </div>
              )}

              {method === 'crypto' && (
                <>
                  <div>
                    <Label>Select Cryptocurrency</Label>
                    <RadioGroup value={cryptoType} onValueChange={(v) => setCryptoType(v as CryptoType)} className="mt-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div 
                          className={`flex flex-col items-center p-3 rounded-lg border cursor-pointer ${cryptoType === 'btc' ? 'border-primary bg-primary/5' : 'border-border'}`}
                          onClick={() => setCryptoType('btc')}
                        >
                          <RadioGroupItem value="btc" id="btc" className="sr-only" />
                          <span className="text-2xl text-orange-500">₿</span>
                          <span className="text-xs mt-1">BTC</span>
                        </div>
                        <div 
                          className={`flex flex-col items-center p-3 rounded-lg border cursor-pointer ${cryptoType === 'eth' ? 'border-primary bg-primary/5' : 'border-border'}`}
                          onClick={() => setCryptoType('eth')}
                        >
                          <RadioGroupItem value="eth" id="eth" className="sr-only" />
                          <EthDiamondIcon className="h-6 w-6 text-blue-500" />
                          <span className="text-xs mt-1">ETH (ERC20)</span>
                        </div>
                        <div 
                          className={`flex flex-col items-center p-3 rounded-lg border cursor-pointer ${cryptoType === 'usdt' ? 'border-primary bg-primary/5' : 'border-border'}`}
                          onClick={() => setCryptoType('usdt')}
                        >
                          <RadioGroupItem value="usdt" id="usdt" className="sr-only" />
                          <span className="text-2xl text-green-500">₮</span>
                          <span className="text-xs mt-1">USDT (TRC20)</span>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {getUserWallet(cryptoType) && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="useStored"
                          checked={useStoredWallet}
                          onChange={(e) => {
                            setUseStoredWallet(e.target.checked);
                            if (e.target.checked) {
                              setWalletAddress('');
                            }
                          }}
                          className="rounded border-border"
                        />
                        <Label htmlFor="useStored" className="text-sm cursor-pointer">
                          Use my TAMIC {cryptoType.toUpperCase()} wallet address
                        </Label>
                      </div>
                      {useStoredWallet && (
                        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Withdrawal Address:</p>
                          <p className="font-mono text-xs text-foreground break-all">
                            {getUserWallet(cryptoType)?.address}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {!useStoredWallet && (
                    <div>
                      <Label>Destination Wallet Address</Label>
                      <Input
                        placeholder={`Enter your ${cryptoType.toUpperCase()} wallet address`}
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        className="font-mono text-sm mt-1"
                      />
                    </div>
                  )}
                </>
              )}

              <div>
                <Label>Amount (USD)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Max: ${(profile?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setStep('select')}>
                  Back
                </Button>
                <Button className="flex-1" onClick={handleWithdraw}>
                  Withdraw
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <Card>
            <CardContent className="p-8 sm:p-12 flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium text-foreground">Processing Withdrawal</p>
              <p className="text-sm text-muted-foreground text-center">Please wait while we process your request...</p>
            </CardContent>
          </Card>
        )}

        {/* Step: Result */}
        {step === 'result' && (
          <Card>
            <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center text-center">
              {result === 'success' ? (
                <>
                  <CheckCircle2 className="h-16 w-16 text-success mb-4" />
                  <p className="text-xl font-bold text-foreground mb-2">Withdrawal Submitted</p>
                  <p className="text-muted-foreground mb-2">
                    Your withdrawal request for ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} has been submitted.
                  </p>
                  <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg mt-2">
                    <AlertCircle className="h-4 w-4 text-warning flex-shrink-0" />
                    <p className="text-xs text-warning">
                      Processing may take up to 24-48 hours to reflect in your account.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-16 w-16 text-destructive mb-4" />
                  <p className="text-xl font-bold text-foreground mb-2">Withdrawal Declined</p>
                  <p className="text-muted-foreground">
                    Your withdrawal request could not be processed at this time. Please try again later or contact support.
                  </p>
                </>
              )}
              <Button className="mt-6" onClick={resetForm}>
                Done
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}