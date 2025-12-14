import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Stock } from '@/hooks/useStocks';
import { cn } from '@/lib/utils';

interface StockCardProps {
  stock: Stock;
  onTrade: (stock: Stock) => void;
}

export function StockCard({ stock, onTrade }: StockCardProps) {
  const isPositive = stock.change >= 0;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{stock.symbol}</h3>
              <Badge variant="secondary" className="text-xs">
                {stock.category}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate mt-1">
              {stock.name}
            </p>
          </div>

          <div className="text-right">
            <p className="text-lg font-bold text-foreground">
              ${stock.price.toFixed(2)}
            </p>
            <div className={cn(
              "flex items-center justify-end gap-1 text-sm",
              isPositive ? "text-success" : "text-destructive"
            )}>
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>
                {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Vol: {(stock.volume / 1000000).toFixed(2)}M
          </span>
          <Button size="sm" onClick={() => onTrade(stock)}>
            Trade
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}