import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet, Briefcase, FileText, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProfile } from '@/hooks/useProfile';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useKYC } from '@/hooks/useKYC';
import { useStocks } from '@/hooks/useStocks';
import { cn } from '@/lib/utils';

const kycStatusColors: Record<string, string> = {
  not_started: 'bg-muted text-muted-foreground',
  pending: 'bg-warning/10 text-warning',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
};

const kycStatusLabels: Record<string, string> = {
  not_started: 'Not Started',
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export default function Dashboard() {
  const { profile } = useProfile();
  const { portfolio, trades } = usePortfolio();
  const { kycRequest } = useKYC();
  const { stocks, fetchStocks } = useStocks();

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  const kycStatus = kycRequest?.status || 'not_started';
  
  // Calculate portfolio value
  const portfolioValue = portfolio.reduce((total, item) => {
    const stock = stocks.find(s => s.symbol === item.symbol);
    const currentPrice = stock?.price || item.average_price;
    return total + (item.shares * currentPrice);
  }, 0);

  // Calculate daily gain/loss (simplified - uses change from API)
  const dailyChange = portfolio.reduce((total, item) => {
    const stock = stocks.find(s => s.symbol === item.symbol);
    return total + (item.shares * (stock?.change || 0));
  }, 0);

  const topStocks = stocks.slice(0, 4);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Investor'}
            </h1>
            <p className="text-muted-foreground">
              Here's your investment overview
            </p>
          </div>
          <Badge className={cn('self-start', kycStatusColors[kycStatus])}>
            KYC: {kycStatusLabels[kycStatus]}
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Available Balance
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                ${(profile?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Portfolio Value
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                ${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-muted-foreground">
                {portfolio.length} holdings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today's Change
              </CardTitle>
              {dailyChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
            </CardHeader>
            <CardContent>
              <p className={cn(
                "text-2xl font-bold",
                dailyChange >= 0 ? "text-success" : "text-destructive"
              )}>
                {dailyChange >= 0 ? '+' : ''}${dailyChange.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* KYC CTA */}
          {kycStatus === 'not_started' && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Complete Your KYC</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Verify your identity to unlock all trading features
                    </p>
                    <Link to="/kyc">
                      <Button size="sm" className="mt-4 gap-2">
                        Start KYC <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Stocks Preview */}
          <Card className={kycStatus === 'not_started' ? '' : 'md:col-span-2'}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Market Overview</CardTitle>
              <Link to="/stocks">
                <Button variant="ghost" size="sm" className="gap-2">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {topStocks.map((stock) => (
                  <div
                    key={stock.symbol}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium text-foreground">{stock.symbol}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {stock.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">
                        ${stock.price.toFixed(2)}
                      </p>
                      <p className={cn(
                        "text-xs",
                        stock.change >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Trades */}
        {trades.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trades.slice(0, 5).map((trade) => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={trade.trade_type === 'buy' ? 'default' : 'secondary'}
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
                          {trade.shares} shares @ ${trade.price_per_share.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">
                        ${trade.total_amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(trade.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}