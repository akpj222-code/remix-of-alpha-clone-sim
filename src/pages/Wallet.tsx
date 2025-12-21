import { useState, useEffect } from 'react';
import { Wallet, Copy, Check, Plus, Bitcoin, DollarSign, PoundSterling, Euro, ArrowDownToLine } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { EthDiamondIcon } from '@/components/ui/EthDiamondIcon';

interface UserWallet {
  id: string;
  currency: string;
  address: string;
  balance: number;
}

export default function WalletPage() {
  const { profile } = useProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchWallets();
    }
  }, [user]);

  const fetchWallets = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', user.id);
    
    if (!error && data) {
      setWallets(data.map(w => ({ ...w, balance: Number(w.balance) || 0 })));
    }
  };

  const generateWalletAddress = (currency: string): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let address = '';
    
    switch (currency) {
      case 'BTC':
        address = 'bc1q' + Array.from({ length: 38 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        break;
      case 'ETH':
      case 'USDT':
        address = '0x' + Array.from({ length: 40 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        break;
      default:
        address = Array.from({ length: 34 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
    
    return address;
  };

  const createWallet = async (currency: string) => {
    if (!user) return;
    
    setGenerating(currency);
    
    // Simulate generation time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const address = generateWalletAddress(currency);
    
    const { error } = await supabase
      .from('user_wallets')
      .insert({
        user_id: user.id,
        currency,
        address,
        balance: 0
      });
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to create wallet', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `${currency} wallet created` });
      fetchWallets();
    }
    
    setGenerating(null);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({ title: 'Copied', description: `${label} copied to clipboard` });
    setTimeout(() => setCopied(null), 2000);
  };

  const supportedCurrencies = [
    { code: 'BTC', name: 'Bitcoin', icon: <span className="text-lg font-bold text-orange-500">₿</span>, network: '' },
    { code: 'ETH', name: 'Ethereum', icon: <EthDiamondIcon className="h-5 w-5 text-blue-500" />, network: 'ERC20' },
    { code: 'USDT', name: 'Tether', icon: <span className="text-lg font-bold text-green-500">₮</span>, network: 'TRC20' },
  ];

  const hasWallet = (currency: string) => wallets.some(w => w.currency === currency);
  const getWallet = (currency: string) => wallets.find(w => w.currency === currency);

  // Currency conversion rates
  const rates = { USD: 1, GBP: 0.79, EUR: 0.92 };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground truncate">Wallet</h1>
            <p className="text-muted-foreground text-sm truncate">
              Manage your crypto wallets and balances
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link to="/deposit">
              <Button className="gap-2" size="sm">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Deposit</span>
              </Button>
            </Link>
            <Link to="/withdraw">
              <Button variant="outline" className="gap-2" size="sm">
                <ArrowDownToLine className="h-4 w-4" />
                <span className="hidden sm:inline">Withdraw</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Balance Card */}
        <Card className="border-primary/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Wallet className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">Account Balance</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground truncate">
                  ${(profile?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Currency Breakdown */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-muted/50 rounded-lg min-w-0">
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs text-muted-foreground">USD</span>
                </div>
                <p className="font-semibold text-foreground text-xs sm:text-sm truncate">
                  ${(profile?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-muted/50 rounded-lg min-w-0">
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <PoundSterling className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs text-muted-foreground">GBP</span>
                </div>
                <p className="font-semibold text-foreground text-xs sm:text-sm truncate">
                  £{((profile?.balance || 0) * rates.GBP).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-muted/50 rounded-lg min-w-0">
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <Euro className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs text-muted-foreground">EUR</span>
                </div>
                <p className="font-semibold text-foreground text-xs sm:text-sm truncate">
                  €{((profile?.balance || 0) * rates.EUR).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet ID */}
        {profile?.wallet_id && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Your TAMIC Wallet ID</p>
                  <p className="font-mono font-bold text-base sm:text-lg text-foreground truncate">{profile.wallet_id}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0"
                  onClick={() => copyToClipboard(profile.wallet_id!, 'Wallet ID')}
                >
                  {copied === 'Wallet ID' ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Crypto Wallets */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bitcoin className="h-5 w-5" />
              Crypto Wallets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {supportedCurrencies.map((currency) => {
              const wallet = getWallet(currency.code);
              const isGenerating = generating === currency.code;

              return (
                <div key={currency.code} className="p-3 sm:p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        currency.code === 'BTC' ? 'bg-orange-500/10' :
                        currency.code === 'ETH' ? 'bg-blue-500/10' :
                        'bg-green-500/10'
                      }`}>
                        {currency.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                          <p className="font-medium text-foreground text-sm sm:text-base">{currency.name}</p>
                          {currency.network && (
                            <span className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 bg-muted rounded text-muted-foreground font-medium flex-shrink-0">
                              {currency.network}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{currency.code}</p>
                      </div>
                    </div>
                    {!wallet && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => createWallet(currency.code)}
                        disabled={isGenerating}
                        className="flex-shrink-0 text-xs sm:text-sm"
                      >
                        {isGenerating ? 'Creating...' : 'Create'}
                      </Button>
                    )}
                  </div>

                  {wallet && (
                    <div className="mt-3 space-y-2">
                      {/* Wallet Balance */}
                      <div className="p-2 sm:p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground">Balance</p>
                            <p className="font-bold text-foreground text-sm sm:text-base truncate">
                              {wallet.balance.toFixed(8)} {currency.code}
                            </p>
                          </div>
                          {wallet.balance > 0 && (
                            <Link to={`/withdraw?crypto=${currency.code.toLowerCase()}&fromTamic=true`}>
                              <Button variant="outline" size="sm" className="gap-1 flex-shrink-0 text-xs">
                                <ArrowDownToLine className="h-3 w-3" />
                                <span className="hidden sm:inline">Withdraw</span>
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                      
                      {/* Wallet Address */}
                      <div className="p-2 sm:p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground mb-1">Receive Address</p>
                            <p className="font-mono text-[10px] sm:text-xs text-foreground break-all">
                              {wallet.address}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={() => copyToClipboard(wallet.address, `${currency.code} Address`)}
                          >
                            {copied === `${currency.code} Address` ? (
                              <Check className="h-4 w-4 text-success" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}