import { useState, useEffect } from 'react';
import { Wallet, Building2, Copy, Check, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EthDiamondIcon } from '@/components/ui/EthDiamondIcon';

type DepositMethod = 'bank' | 'crypto';
type CryptoType = 'BTC' | 'ETH' | 'USDT';

interface DepositDetails {
  bankName?: string;
  bankAccount?: string;
  bankRouting?: string;
  bankAccountName?: string;
  btcAddresses?: string[];
  ethAddresses?: string[];
  usdtAddresses?: string[];
}

export default function Deposit() {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [method, setMethod] = useState<DepositMethod>('bank');
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoType>('BTC');
  const [loading, setLoading] = useState(false);
  const [depositDetails, setDepositDetails] = useState<DepositDetails | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>('');

  const getRandomLoadTime = () => {
    const times = [2000, 3000, 4000, 5000, 7000, 10000];
    return times[Math.floor(Math.random() * times.length)];
  };

  const fetchDepositDetails = async () => {
    setLoading(true);
    setDepositDetails(null);
    setSelectedAddress('');
    
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
          case 'deposit_btc_addresses':
            try { settings.btcAddresses = JSON.parse(item.setting_value); } catch { settings.btcAddresses = []; }
            break;
          case 'deposit_eth_addresses':
            try { settings.ethAddresses = JSON.parse(item.setting_value); } catch { settings.ethAddresses = []; }
            break;
          case 'deposit_usdt_addresses':
            try { settings.usdtAddresses = JSON.parse(item.setting_value); } catch { settings.usdtAddresses = []; }
            break;
        }
      });
      setDepositDetails(settings);
      
      // Select random address for current crypto
      selectRandomAddress(settings, selectedCrypto);
    }
    
    setLoading(false);
  };

  const selectRandomAddress = (details: DepositDetails, crypto: CryptoType) => {
    let addresses: string[] = [];
    switch (crypto) {
      case 'BTC': addresses = details.btcAddresses || []; break;
      case 'ETH': addresses = details.ethAddresses || []; break;
      case 'USDT': addresses = details.usdtAddresses || []; break;
    }
    
    if (addresses.length > 0) {
      const randomIndex = Math.floor(Math.random() * addresses.length);
      setSelectedAddress(addresses[randomIndex]);
    } else {
      setSelectedAddress('');
    }
  };

  useEffect(() => {
    fetchDepositDetails();
  }, [method]);

  useEffect(() => {
    if (depositDetails) {
      selectRandomAddress(depositDetails, selectedCrypto);
    }
  }, [selectedCrypto]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({ title: 'Copied', description: `${label} copied to clipboard` });
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyButton = ({ text, label }: { text: string; label: string }) => (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 flex-shrink-0"
      onClick={() => copyToClipboard(text, label)}
    >
      {copied === label ? (
        <Check className="h-4 w-4 text-success" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );

  const cryptoOptions: { code: CryptoType; name: string; network: string; icon: React.ReactNode }[] = [
    { code: 'BTC', name: 'Bitcoin', network: '', icon: <span className="text-lg text-orange-500">₿</span> },
    { code: 'ETH', name: 'Ethereum', network: 'ERC20', icon: <EthDiamondIcon className="h-5 w-5 text-blue-500" /> },
    { code: 'USDT', name: 'Tether', network: 'TRC20', icon: <span className="text-lg text-green-500">₮</span> },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deposit Funds</h1>
          <p className="text-muted-foreground text-sm">
            Add funds to your TAMIC account
          </p>
        </div>

        {/* Current Balance */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
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
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Your Wallet ID</p>
                  <p className="font-mono font-semibold text-foreground truncate">{profile.wallet_id}</p>
                </div>
                <CopyButton text={profile.wallet_id} label="Wallet ID" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Deposit Method Tabs */}
        <Tabs value={method} onValueChange={(v) => setMethod(v as DepositMethod)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bank" className="gap-2 text-xs sm:text-sm">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Bank Transfer</span>
              <span className="sm:hidden">Bank</span>
            </TabsTrigger>
            <TabsTrigger value="crypto" className="gap-2 text-xs sm:text-sm">
              <span className="text-lg">₿</span>
              <span className="hidden sm:inline">Cryptocurrency</span>
              <span className="sm:hidden">Crypto</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bank" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Bank Transfer Details</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Transfer funds to the account below. Your balance will be updated within 24-48 hours.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground">Generating secure deposit details...</p>
                    <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                  </div>
                ) : depositDetails ? (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Bank Name</p>
                        <p className="font-medium text-foreground text-sm truncate">{depositDetails.bankName}</p>
                      </div>
                      <CopyButton text={depositDetails.bankName || ''} label="Bank Name" />
                    </div>
                    
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Account Name</p>
                        <p className="font-medium text-foreground text-sm truncate">{depositDetails.bankAccountName}</p>
                      </div>
                      <CopyButton text={depositDetails.bankAccountName || ''} label="Account Name" />
                    </div>
                    
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Account Number</p>
                        <p className="font-mono font-semibold text-foreground text-sm truncate">{depositDetails.bankAccount}</p>
                      </div>
                      <CopyButton text={depositDetails.bankAccount || ''} label="Account Number" />
                    </div>
                    
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Routing Number</p>
                        <p className="font-mono font-semibold text-foreground text-sm truncate">{depositDetails.bankRouting}</p>
                      </div>
                      <CopyButton text={depositDetails.bankRouting || ''} label="Routing Number" />
                    </div>

                    <div className="p-3 sm:p-4 bg-warning/10 border border-warning/20 rounded-lg">
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
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Cryptocurrency Deposit</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Send cryptocurrency to receive equivalent USD in your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Crypto Selection */}
                <div className="flex gap-2">
                  {cryptoOptions.map((crypto) => (
                    <Button
                      key={crypto.code}
                      variant={selectedCrypto === crypto.code ? 'default' : 'outline'}
                      className="flex-1 gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4"
                      onClick={() => setSelectedCrypto(crypto.code)}
                    >
                      {crypto.icon}
                      <span>{crypto.code}</span>
                      {crypto.network && (
                        <span className="hidden sm:inline text-[10px] opacity-70">({crypto.network})</span>
                      )}
                    </Button>
                  ))}
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground">Fetching secure wallet address...</p>
                    <p className="text-xs text-muted-foreground mt-1">Please wait</p>
                  </div>
                ) : selectedAddress ? (
                  <div className="space-y-4">
                    <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-2">
                        {selectedCrypto} Deposit Address 
                        {cryptoOptions.find(c => c.code === selectedCrypto)?.network && 
                          ` (${cryptoOptions.find(c => c.code === selectedCrypto)?.network})`
                        }
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-[10px] sm:text-sm text-foreground break-all flex-1">
                          {selectedAddress}
                        </p>
                        <CopyButton 
                          text={selectedAddress} 
                          label={`${selectedCrypto} Address`} 
                        />
                      </div>
                    </div>

                    <div className="p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm text-destructive font-medium">Warning</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Only send {selectedCrypto} to this address. Sending other cryptocurrencies may result in permanent loss.
                      </p>
                    </div>

                    <div className="p-3 sm:p-4 bg-muted/30 rounded-lg space-y-1">
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
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">No deposit address available for {selectedCrypto}</p>
                    <p className="text-xs text-muted-foreground mt-1">Please contact support</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}