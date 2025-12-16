import { useState, useEffect } from 'react';
import { Wallet, Building2, Bitcoin, Copy, Check, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type DepositMethod = 'bank' | 'crypto';
type CryptoType = 'BTC' | 'ETH' | 'USDT';

interface DepositDetails {
  bankName?: string;
  bankAccount?: string;
  bankRouting?: string;
  bankAccountName?: string;
  btcAddress?: string;
  ethAddress?: string;
  usdtAddress?: string;
}

export default function Deposit() {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [method, setMethod] = useState<DepositMethod>('bank');
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoType>('BTC');
  const [loading, setLoading] = useState(false);
  const [depositDetails, setDepositDetails] = useState<DepositDetails | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const getRandomLoadTime = () => {
    const times = [2000, 3000, 4000, 5000, 7000, 10000];
    return times[Math.floor(Math.random() * times.length)];
  };

  const fetchDepositDetails = async () => {
    setLoading(true);
    setDepositDetails(null);
    
    const loadTime = getRandomLoadTime();
    
    await new Promise(resolve => setTimeout(resolve, loadTime));
    
    const { data, error } = await supabase
      .from('admin_settings')
      .select('setting_key, setting_value');
    
    if (!error && data) {
      const settings: DepositDetails = {};
      data.forEach((item: { setting_key: string; setting_value: string }) => {
        switch (item.setting_key) {
          case 'deposit_bank_name':
            settings.bankName = item.setting_value;
            break;
          case 'deposit_bank_account':
            settings.bankAccount = item.setting_value;
            break;
          case 'deposit_bank_routing':
            settings.bankRouting = item.setting_value;
            break;
          case 'deposit_bank_account_name':
            settings.bankAccountName = item.setting_value;
            break;
          case 'deposit_btc_address':
            settings.btcAddress = item.setting_value;
            break;
          case 'deposit_eth_address':
            settings.ethAddress = item.setting_value;
            break;
          case 'deposit_usdt_address':
            settings.usdtAddress = item.setting_value;
            break;
        }
      });
      setDepositDetails(settings);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchDepositDetails();
  }, [method]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({ title: 'Copied', description: `${label} copied to clipboard` });
    setTimeout(() => setCopied(null), 2000);
  };

  const hasBankDetails = profile?.bank_name && profile?.bank_account_number;

  const CopyButton = ({ text, label }: { text: string; label: string }) => (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() => copyToClipboard(text, label)}
    >
      {copied === label ? (
        <Check className="h-4 w-4 text-success" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );

  const cryptoIcons: Record<CryptoType, string> = {
    BTC: '₿',
    ETH: 'Ξ',
    USDT: '₮',
  };

  const getCryptoAddress = (crypto: CryptoType) => {
    if (!depositDetails) return '';
    switch (crypto) {
      case 'BTC': return depositDetails.btcAddress || '';
      case 'ETH': return depositDetails.ethAddress || '';
      case 'USDT': return depositDetails.usdtAddress || '';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deposit Funds</h1>
          <p className="text-muted-foreground">
            Add funds to your TAMIC account
          </p>
        </div>

        {/* Current Balance */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-2xl font-bold text-foreground">
                  ${(profile?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                  <p className="text-xs text-muted-foreground">Your Wallet ID</p>
                  <p className="font-mono font-semibold text-foreground">{profile.wallet_id}</p>
                </div>
                <CopyButton text={profile.wallet_id} label="Wallet ID" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Deposit Method Tabs */}
        <Tabs value={method} onValueChange={(v) => setMethod(v as DepositMethod)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bank" className="gap-2">
              <Building2 className="h-4 w-4" />
              Bank Transfer
            </TabsTrigger>
            <TabsTrigger value="crypto" className="gap-2">
              <Bitcoin className="h-4 w-4" />
              Cryptocurrency
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bank" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Bank Transfer Details</CardTitle>
                <CardDescription>
                  Transfer funds to the account below. Your balance will be updated within 24-48 hours.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground">Generating secure deposit details...</p>
                    <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                  </div>
                ) : depositDetails ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground">Bank Name</p>
                        <p className="font-medium text-foreground">{depositDetails.bankName}</p>
                      </div>
                      <CopyButton text={depositDetails.bankName || ''} label="Bank Name" />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground">Account Name</p>
                        <p className="font-medium text-foreground">{depositDetails.bankAccountName}</p>
                      </div>
                      <CopyButton text={depositDetails.bankAccountName || ''} label="Account Name" />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground">Account Number</p>
                        <p className="font-mono font-semibold text-foreground">{depositDetails.bankAccount}</p>
                      </div>
                      <CopyButton text={depositDetails.bankAccount || ''} label="Account Number" />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground">Routing Number</p>
                        <p className="font-mono font-semibold text-foreground">{depositDetails.bankRouting}</p>
                      </div>
                      <CopyButton text={depositDetails.bankRouting || ''} label="Routing Number" />
                    </div>

                    <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                      <p className="text-sm text-warning font-medium">Important</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Include your Wallet ID ({profile?.wallet_id}) in the transfer reference for faster processing.
                      </p>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="crypto" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Cryptocurrency Deposit</CardTitle>
                <CardDescription>
                  Send cryptocurrency to receive equivalent USD in your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Crypto Selection */}
                <div className="flex gap-2">
                  {(['BTC', 'ETH', 'USDT'] as CryptoType[]).map((crypto) => (
                    <Button
                      key={crypto}
                      variant={selectedCrypto === crypto ? 'default' : 'outline'}
                      className="flex-1 gap-2"
                      onClick={() => setSelectedCrypto(crypto)}
                    >
                      <span className="text-lg">{cryptoIcons[crypto]}</span>
                      {crypto}
                    </Button>
                  ))}
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground">Fetching secure wallet address...</p>
                    <p className="text-xs text-muted-foreground mt-1">Please wait</p>
                  </div>
                ) : depositDetails ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-2">{selectedCrypto} Deposit Address</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm text-foreground break-all flex-1">
                          {getCryptoAddress(selectedCrypto)}
                        </p>
                        <CopyButton 
                          text={getCryptoAddress(selectedCrypto)} 
                          label={`${selectedCrypto} Address`} 
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm text-destructive font-medium">Warning</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Only send {selectedCrypto} to this address. Sending other cryptocurrencies may result in permanent loss.
                      </p>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        • Minimum deposit: {selectedCrypto === 'BTC' ? '0.0005 BTC' : selectedCrypto === 'ETH' ? '0.01 ETH' : '50 USDT'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        • Processing time: 3-6 network confirmations
                      </p>
                      <p className="text-xs text-muted-foreground">
                        • Your balance will be credited at current market rate
                      </p>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}