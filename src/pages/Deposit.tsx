import { useState, useEffect } from 'react';
import { Wallet, Copy, Check, Loader2, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EthDiamondIcon } from '@/components/ui/EthDiamondIcon';

type CryptoType = 'BTC' | 'ETH' | 'USDT';

interface BTCAddressWithQR {
  address: string;
  qrCode?: string;
}

interface DepositDetails {
  btcAddresses?: string[];
  btcAddressesWithQR?: BTCAddressWithQR[];
  ethAddresses?: string[];
  usdtAddresses?: string[];
}

export default function Deposit() {
  const { profile } = useProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoType>('BTC');
  const [loading, setLoading] = useState(false);
  const [depositDetails, setDepositDetails] = useState<DepositDetails | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [selectedQRCode, setSelectedQRCode] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [submittingDeposit, setSubmittingDeposit] = useState(false);

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
          case 'deposit_btc_addresses':
            try { settings.btcAddresses = JSON.parse(item.setting_value); } catch { settings.btcAddresses = []; }
            break;
          case 'deposit_btc_addresses_with_qr':
            try { settings.btcAddressesWithQR = JSON.parse(item.setting_value); } catch { settings.btcAddressesWithQR = []; }
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
    setSelectedQRCode(null);
    
    if (crypto === 'BTC') {
      // For BTC, combine regular addresses and addresses with QR codes
      const regularAddresses = details.btcAddresses || [];
      const addressesWithQR = details.btcAddressesWithQR || [];
      
      // Create a combined pool
      const allBTCOptions: { address: string; qrCode?: string }[] = [
        ...regularAddresses.map(addr => ({ address: addr })),
        ...addressesWithQR
      ];
      
      if (allBTCOptions.length > 0) {
        const randomIndex = Math.floor(Math.random() * allBTCOptions.length);
        const selected = allBTCOptions[randomIndex];
        setSelectedAddress(selected.address);
        setSelectedQRCode(selected.qrCode || null);
      } else {
        setSelectedAddress('');
      }
    } else {
      let addresses: string[] = [];
      switch (crypto) {
        case 'ETH': addresses = details.ethAddresses || []; break;
        case 'USDT': addresses = details.usdtAddresses || []; break;
      }
      
      if (addresses.length > 0) {
        const randomIndex = Math.floor(Math.random() * addresses.length);
        setSelectedAddress(addresses[randomIndex]);
      } else {
        setSelectedAddress('');
      }
    }
  };

  useEffect(() => {
    fetchDepositDetails();
  }, []);

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

  const handleDepositNotification = async () => {
    if (!user) {
      toast({ title: 'Error', description: 'Please log in first', variant: 'destructive' });
      return;
    }

    const amount = parseFloat(depositAmount);
    if (!depositAmount || isNaN(amount) || amount <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid deposit amount', variant: 'destructive' });
      return;
    }

    setSubmittingDeposit(true);

    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'deposit',
      method: selectedCrypto.toLowerCase(),
      amount: amount,
      status: 'pending',
      notes: `User initiated ${selectedCrypto} crypto deposit. Wallet ID: ${profile?.wallet_id || 'N/A'}`,
    });

    // Send email notification to user
    try {
      await supabase.functions.invoke('send-user-email', {
        body: {
          type: 'deposit',
          user_id: user.id,
          amount: amount,
          currency: selectedCrypto,
        }
      });
    } catch (emailError) {
      console.error('Failed to send deposit email:', emailError);
    }

    setSubmittingDeposit(false);

    if (error) {
      toast({ title: 'Error', description: 'Failed to notify admin. Please try again.', variant: 'destructive' });
    } else {
      toast({ 
        title: 'Success', 
        description: 'Admin has been notified of your deposit. Your balance will be updated once payment is verified.' 
      });
      setDepositAmount('');
    }
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

        {/* Crypto Deposit */}
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
                {/* QR Code for BTC (if available) */}
                {selectedCrypto === 'BTC' && selectedQRCode && (
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <img 
                      src={selectedQRCode} 
                      alt="BTC QR Code" 
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                )}

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

                {/* I Have Deposited Section */}
                <div className="p-4 bg-success/5 border border-success/20 rounded-lg space-y-3">
                  <p className="text-sm font-medium text-foreground">Already sent your crypto?</p>
                  <p className="text-xs text-muted-foreground">Enter the USD equivalent and click the button below to notify our team for faster processing.</p>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Amount (USD)"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleDepositNotification}
                      disabled={submittingDeposit || !depositAmount}
                      className="gap-2"
                    >
                      {submittingDeposit ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      I Have Deposited
                    </Button>
                  </div>
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
      </div>
    </AppLayout>
  );
}