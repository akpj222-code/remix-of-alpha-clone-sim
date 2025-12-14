import { useState, useEffect, useMemo } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { StockCard } from '@/components/stocks/StockCard';
import { TradeModal } from '@/components/stocks/TradeModal';
import { useStocks, Stock } from '@/hooks/useStocks';
import { cn } from '@/lib/utils';

const categories = ['All', 'Technology', 'Finance', 'Healthcare', 'Retail', 'Consumer Goods', 'Automotive'];

export default function Stocks() {
  const { stocks, loading, fetchStocks } = useStocks();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

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

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">US Stocks</h1>
            <p className="text-muted-foreground">
              Browse and trade popular US stocks
            </p>
          </div>
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

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stocks..."
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
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        {/* Stocks Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStocks.map((stock) => (
            <StockCard key={stock.symbol} stock={stock} onTrade={handleTrade} />
          ))}
        </div>

        {filteredStocks.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No stocks found matching your criteria</p>
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