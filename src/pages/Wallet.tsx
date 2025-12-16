import { useState, useEffect } from 'react';
import { Wallet, Copy, Check, Plus, Bitcoin, DollarSign, PoundSterling } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface UserWallet {
  id: string;
  currency: string;
  address: string;
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
      setWallets(data);
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
        address
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
    { code: 'BTC', name: 'Bitcoin', icon: '₿' },
    { code: 'ETH', name: 'Ethereum', icon: 'Ξ' },
    { code: 'USDT', name: 'Tether', icon: '₮' },
  ];

  const hasWallet = (currency: string) => wallets.some(w => w.currency === currency);
  const getWallet = (currency: string) => wallets.find(w => w.currency === currency);

  // Currency conversion rates
  const rates = { USD: 1, GBP: 0.79 };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Wallet</h1>
            <p className="text-muted-foreground">
              Manage your crypto wallets and balances
            </p>
          </div>
          <Link to="/deposit">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Deposit
            </Button>
          </Link>
        </div>

        {/* Main Balance Card */}
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account Balance</p>
                <p className="text-3xl font-bold text-foreground">
                  ${(profile?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Currency Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">USD</span>
                </div>
                <p className="font-semibold text-foreground">
                  ${(profile?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <PoundSterling className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">GBP</span>
                </div>
                <p className="font-semibold text-foreground">
                  £{((profile?.balance || 0) * rates.GBP).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet ID */}
        {profile?.wallet_id && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Your TAMIC Wallet ID</p>
                  <p className="font-mono font-bold text-lg text-foreground">{profile.wallet_id}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bitcoin className="h-5 w-5" />
              Crypto Wallets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {supportedCurrencies.map((currency) => {
              const wallet = getWallet(currency.code);
              const isGenerating = generating === currency.code;

              return (
                <div key={currency.code} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-lg font-bold">{currency.icon}</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{currency.name}</p>
                        <p className="text-xs text-muted-foreground">{currency.code}</p>
                      </div>
                    </div>
                    {!wallet && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => createWallet(currency.code)}
                        disabled={isGenerating}
                      >
                        {isGenerating ? 'Generating...' : 'Create Wallet'}
                      </Button>
                    )}
                  </div>

                  {wallet && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 mr-2">
                          <p className="text-xs text-muted-foreground mb-1">Receive Address</p>
                          <p className="font-mono text-xs text-foreground break-all">
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