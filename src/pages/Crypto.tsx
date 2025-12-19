import { useState, useEffect, useMemo } from 'react';
import { Search, RefreshCw, TrendingUp, TrendingDown, Bitcoin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { CryptoTradeModal } from '@/components/crypto/CryptoTradeModal';
import { useCrypto, Crypto } from '@/hooks/useCrypto';
import { getCryptoMarketStatus } from '@/lib/marketHours';
import { cn } from '@/lib/utils';

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

const categories = ['All', 'Layer 1', 'DeFi', 'Stablecoins', 'Meme', 'Gaming'];

const CATEGORY_MAP: Record<string, string[]> = {
  'Layer 1': ['BTC', 'ETH', 'SOL', 'ADA', 'AVAX', 'DOT', 'NEAR', 'APT', 'SUI', 'TON', 'ALGO', 'FLOW', 'ATOM', 'FTM'],
  'DeFi': ['UNI', 'AAVE', 'MKR', 'LINK', 'GRT', 'LDO', 'INJ', 'RUNE', 'CRO'],
  'Stablecoins': ['USDT', 'USDC', 'DAI'],
  'Meme': ['DOGE', 'SHIB'],
  'Gaming': ['AXS', 'SAND', 'IMX', 'RNDR'],
};

function getCryptoCategory(symbol: string): string {
  for (const [category, symbols] of Object.entries(CATEGORY_MAP)) {
    if (symbols.includes(symbol)) return category;
  }
  return 'Other';
}

function getCryptoIcon(symbol: string) {
  if (symbol === 'ETH') {
    return <EthDiamondIcon className="h-5 w-5 text-blue-500" />;
  }
  return (
    <span className="text-sm font-bold text-primary">
      {symbol.slice(0, 2)}
    </span>
  );
}

export default function CryptoPage() {
  const { cryptos, loading, fetchCryptos } = useCrypto();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedCrypto, setSelectedCrypto] = useState<Crypto | null>(null);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);

  const marketStatus = getCryptoMarketStatus();

  useEffect(() => {
    fetchCryptos();
  }, [fetchCryptos]);

  const filteredCryptos = useMemo(() => {
    return cryptos.filter((crypto) => {
      const matchesSearch =
        crypto.symbol.toLowerCase().includes(search.toLowerCase()) ||
        crypto.name.toLowerCase().includes(search.toLowerCase());
      const cryptoCategory = getCryptoCategory(crypto.symbol);
      const matchesCategory = category === 'All' || cryptoCategory === category;
      return matchesSearch && matchesCategory;
    });
  }, [cryptos, search, category]);

  const handleTrade = (crypto: Crypto) => {
    setSelectedCrypto(crypto);
    setTradeModalOpen(true);
  };

  const formatPrice = (price: number) => {
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    return `$${volume.toLocaleString()}`;
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bitcoin className="h-6 w-6 text-warning" />
              Cryptocurrency
            </h1>
            <p className="text-muted-foreground">
              Trade top cryptocurrencies 24/7
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              {marketStatus.message}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCryptos}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cryptocurrencies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant={category === cat ? 'default' : 'outline'}
                className="cursor-pointer whitespace-nowrap flex-shrink-0"
                onClick={() => setCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        {/* Crypto Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCryptos.map((crypto) => (
            <Card
              key={crypto.symbol}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleTrade(crypto)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {getCryptoIcon(crypto.symbol)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground">{crypto.symbol}</h3>
                      <p className="text-xs text-muted-foreground truncate">{crypto.name}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    {getCryptoCategory(crypto.symbol)}
                  </Badge>
                </div>

                <div className="flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-lg sm:text-xl font-bold text-foreground truncate">
                      {formatPrice(crypto.price)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      Vol: {formatVolume(crypto.volume)}
                    </p>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 flex-shrink-0",
                    crypto.changePercent >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {crypto.changePercent >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">
                      {crypto.changePercent >= 0 ? '+' : ''}{crypto.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCryptos.length === 0 && !loading && (
          <div className="text-center py-12">
            <Bitcoin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No cryptocurrencies found matching your criteria</p>
          </div>
        )}

        <CryptoTradeModal
          crypto={selectedCrypto}
          open={tradeModalOpen}
          onOpenChange={setTradeModalOpen}
        />
      </div>
    </AppLayout>
  );
}
