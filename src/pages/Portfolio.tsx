import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AppLayout } from '@/components/layout/AppLayout';
import { TradeModal } from '@/components/stocks/TradeModal';
import { TAMGLiquidateModal } from '@/components/tamg/TAMGLiquidateModal';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useStocks, Stock } from '@/hooks/useStocks';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export default function Portfolio() {
  const { portfolio, trades, fetchPortfolio } = usePortfolio();
  const { stocks, fetchStocks, getStock } = useStocks();
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [tamgPrice, setTamgPrice] = useState<number>(25);
  const [liquidateModalOpen, setLiquidateModalOpen] = useState(false);
  const [selectedTamgHolding, setSelectedTamgHolding] = useState<{ shares: number; price: number } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStocks();
    fetchTamgPrice();
  }, [fetchStocks]);

  const fetchTamgPrice = async () => {
    const { data } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'tamg_share_price')
      .maybeSingle();
    
    if (data) {
      setTamgPrice(parseFloat(data.setting_value) || 25);
    }
  };

  const portfolioWithPrices = portfolio.map((item) => {
    // For TAMG, use the fetched price from admin_settings
    if (item.isTamg) {
      const currentPrice = tamgPrice;
      const currentValue = item.shares * currentPrice;
      const costBasis = item.shares * item.average_price;
      const unrealizedPL = currentValue - costBasis;
      const unrealizedPLPercent = costBasis > 0 ? (unrealizedPL / costBasis) * 100 : 0;
      
      return {
        ...item,
        currentPrice,
        currentValue,
        unrealizedPL,
        unrealizedPLPercent,
      };
    }
    
    // For regular stocks
    const stock = getStock(item.symbol);
    const currentPrice = stock?.price || item.average_price;
    const currentValue = item.shares * currentPrice;
    const costBasis = item.shares * item.average_price;
    const unrealizedPL = currentValue - costBasis;
    const unrealizedPLPercent = costBasis > 0 ? (unrealizedPL / costBasis) * 100 : 0;

    return {
      ...item,
      currentPrice,
      currentValue,
      unrealizedPL,
      unrealizedPLPercent,
    };
  });

  const totalValue = portfolioWithPrices.reduce((sum, item) => sum + item.currentValue, 0);
  const totalPL = portfolioWithPrices.reduce((sum, item) => sum + item.unrealizedPL, 0);

  const handleTrade = (symbol: string, isTamg?: boolean) => {
    if (isTamg) {
      // For TAMG, navigate to dashboard where the TAMG card is
      navigate('/dashboard');
      return;
    }
    const stock = getStock(symbol);
    if (stock) {
      setSelectedStock(stock);
      setTradeModalOpen(true);
    }
  };

  const handleLiquidateTamg = (shares: number) => {
    setSelectedTamgHolding({ shares, price: tamgPrice });
    setLiquidateModalOpen(true);
  };

  const handleLiquidationSuccess = () => {
    fetchPortfolio();
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Portfolio</h1>
          <p className="text-muted-foreground">
            Track your investments and performance
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Portfolio Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">
                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unrealized P/L
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {totalPL >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-success" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
                <p className={cn(
                  "text-3xl font-bold",
                  totalPL >= 0 ? "text-success" : "text-destructive"
                )}>
                  {totalPL >= 0 ? '+' : ''}${totalPL.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Holdings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            {portfolio.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  You don't have any holdings yet
                </p>
                <Button onClick={() => window.location.href = '/stocks'}>
                  Browse Stocks
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead className="text-right">Shares</TableHead>
                      <TableHead className="text-right">Avg Price</TableHead>
                      <TableHead className="text-right">Current Price</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">P/L</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portfolioWithPrices.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.symbol}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                              {item.company_name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.shares.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${item.average_price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${item.currentPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${item.currentValue.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            "font-medium",
                            item.unrealizedPL >= 0 ? "text-success" : "text-destructive"
                          )}>
                            {item.unrealizedPL >= 0 ? '+' : ''}${item.unrealizedPL.toFixed(2)}
                            <br />
                            <span className="text-xs">
                              ({item.unrealizedPL >= 0 ? '+' : ''}{item.unrealizedPLPercent.toFixed(2)}%)
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {item.isTamg && (
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleLiquidateTamg(item.shares)}
                              >
                                Liquidate
                              </Button>
                            )}
                            <Button size="sm" onClick={() => handleTrade(item.symbol, item.isTamg)}>
                              {item.isTamg ? 'Buy More' : 'Trade'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Trades */}
        {trades.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Trade History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trades.map((trade) => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        className={cn(
                          trade.trade_type === 'buy' 
                            ? 'bg-success/10 text-success' 
                            : 'bg-destructive/10 text-destructive'
                        )}
                      >
                        {trade.trade_type.toUpperCase()}
                      </Badge>
                      <div>
                        <p className="font-medium text-foreground">{trade.symbol}</p>
                        <p className="text-xs text-muted-foreground">
                          {trade.shares.toFixed(4)} shares @ ${trade.price_per_share.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">
                        ${trade.total_amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(trade.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <TradeModal
          stock={selectedStock}
          open={tradeModalOpen}
          onOpenChange={setTradeModalOpen}
        />

        {selectedTamgHolding && (
          <TAMGLiquidateModal
            open={liquidateModalOpen}
            onOpenChange={setLiquidateModalOpen}
            currentShares={selectedTamgHolding.shares}
            currentPrice={selectedTamgHolding.price}
            onSuccess={handleLiquidationSuccess}
          />
        )}
      </div>
    </AppLayout>
  );
}