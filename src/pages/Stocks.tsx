import { useState, useEffect, useMemo } from 'react';
import { Search, RefreshCw, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { StockCard } from '@/components/stocks/StockCard';
import { TradeModal } from '@/components/stocks/TradeModal';
import { useStocks, Stock } from '@/hooks/useStocks';
import { getMarketStatus } from '@/lib/marketHours';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const categories = ['All', 'Technology', 'Finance', 'Healthcare', 'Retail', 'Consumer Goods', 'Automotive', 'Energy', 'Entertainment'];

export default function Stocks() {
  const { stocks, loading, fetchStocks, searchStock } = useStocks();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchedStock, setSearchedStock] = useState<Stock | null>(null);
  const { toast } = useToast();

  const marketStatus = getMarketStatus();

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  // Debounced search for any stock symbol
  useEffect(() => {
    const searchSymbol = search.toUpperCase().trim();
    
    // Only search if it looks like a symbol (2-5 uppercase letters)
    if (searchSymbol.length >= 2 && searchSymbol.length <= 5 && /^[A-Z]+$/.test(searchSymbol)) {
      // Check if it's already in our predefined list
      const existsInList = stocks.some(s => s.symbol === searchSymbol);
      if (!existsInList) {
        const timer = setTimeout(async () => {
          setSearchLoading(true);
          const result = await searchStock(searchSymbol);
          setSearchedStock(result);
          setSearchLoading(false);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
    setSearchedStock(null);
  }, [search, stocks, searchStock]);

  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) => {
      const matchesSearch = 
        stock.symbol.toLowerCase().includes(search.toLowerCase()) ||
        stock.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'All' || stock.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [stocks, search, category]);

  const handleTrade = (stock: Stock) => {
    setSelectedStock(stock);
    setTradeModalOpen(true);
  };

  const handleSearchStockTrade = () => {
    if (searchedStock) {
      handleTrade(searchedStock);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">US Stocks</h1>
            <p className="text-muted-foreground">
              Browse and trade any US stock
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={marketStatus.isOpen ? 'default' : 'secondary'} className="gap-1">
              <span className={cn(
                "w-2 h-2 rounded-full",
                marketStatus.isOpen ? "bg-success animate-pulse" : "bg-muted-foreground"
              )} />
              {marketStatus.status}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStocks}
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
              placeholder="Search any US stock symbol (e.g., AAPL, MSFT, UBER)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            {searchLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant={category === cat ? 'default' : 'outline'}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        {/* Search Result for Any Stock */}
        {searchedStock && (
          <div className="p-4 rounded-lg border bg-card">
            <p className="text-sm text-muted-foreground mb-2">Found stock by symbol:</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">{searchedStock.symbol}</p>
                <p className="text-sm text-muted-foreground">{searchedStock.name}</p>
              </div>
              <div className="text-right mr-4">
                <p className="font-semibold text-lg">${searchedStock.price.toFixed(2)}</p>
                <p className={cn(
                  "text-sm",
                  searchedStock.change >= 0 ? "text-success" : "text-destructive"
                )}>
                  {searchedStock.change >= 0 ? '+' : ''}{searchedStock.change.toFixed(2)} ({searchedStock.changePercent.toFixed(2)}%)
                </p>
              </div>
              <Button onClick={handleSearchStockTrade}>
                Trade
              </Button>
            </div>
          </div>
        )}

        {/* Stocks Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStocks.map((stock) => (
            <StockCard key={stock.symbol} stock={stock} onTrade={handleTrade} />
          ))}
        </div>

        {filteredStocks.length === 0 && !loading && !searchedStock && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No stocks found matching your criteria</p>
            <p className="text-sm text-muted-foreground mt-2">
              Try searching for any US stock symbol (e.g., UBER, LYFT, COIN)
            </p>
          </div>
        )}

        <TradeModal
          stock={selectedStock}
          open={tradeModalOpen}
          onOpenChange={setTradeModalOpen}
        />
      </div>
    </AppLayout>
  );
}
