import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Eye, EyeOff, ChevronDown, ChevronUp, Shield, Lock, DollarSign, PoundSterling, Euro } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProfile } from '@/hooks/useProfile';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useKYC } from '@/hooks/useKYC';
import { useStocks } from '@/hooks/useStocks';
import { cn } from '@/lib/utils';
import { TAMGCard } from '@/components/tamg/TAMGCard';

type PositionView = 'net-worth' | 'investment' | 'currency';
type Currency = 'USD' | 'GBP' | 'EUR';

export default function Dashboard() {
  const { profile } = useProfile();
  const { portfolio } = usePortfolio();
  const { kycRequest } = useKYC();
  const { stocks, fetchStocks } = useStocks();
  const [positionView, setPositionView] = useState<PositionView>('net-worth');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');
  const [showValue, setShowValue] = useState(false);
  const [investmentsExpanded, setInvestmentsExpanded] = useState(true);

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

  // Total net worth (balance + portfolio)
  const totalNetWorth = (profile?.balance || 0) + portfolioValue;

  // Currency conversion rates
  const rates: Record<Currency, number> = {
    USD: 1,
    GBP: 0.79,
    EUR: 0.92,
  };

  const formatCurrency = (amount: number, currency: Currency) => {
    const symbols: Record<Currency, string> = { USD: '$', GBP: '£', EUR: '€' };
    const converted = amount * rates[currency];
    return `${symbols[currency]}${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getDisplayValue = () => {
    switch (positionView) {
      case 'net-worth':
        return totalNetWorth;
      case 'investment':
        return portfolioValue;
      case 'currency':
        return totalNetWorth;
      default:
        return totalNetWorth;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in pb-8">
        {/* Financial Position Section */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Financial Position:</h2>
          
          {/* Position Toggle */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="position"
                checked={positionView === 'net-worth'}
                onChange={() => setPositionView('net-worth')}
                className="w-4 h-4 accent-primary"
              />
              <span className={cn("text-sm", positionView === 'net-worth' ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                Net Worth
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="position"
                checked={positionView === 'investment'}
                onChange={() => setPositionView('investment')}
                className="w-4 h-4 accent-primary"
              />
              <span className={cn("text-sm", positionView === 'investment' ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                Investment/Cash
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="position"
                checked={positionView === 'currency'}
                onChange={() => setPositionView('currency')}
                className="w-4 h-4 accent-primary"
              />
              <span className={cn("text-sm", positionView === 'currency' ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                By Currency
              </span>
            </label>
          </div>

          {/* Net Worth Card */}
          <Card className="bg-card border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {positionView === 'net-worth' ? 'Total Net Worth' : positionView === 'investment' ? 'Investment Value' : 'Total by Currency'}
                  </span>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <button 
                  onClick={() => setShowValue(!showValue)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2">
                {showValue ? formatCurrency(getDisplayValue(), selectedCurrency) : '******'}
              </p>
            </CardContent>
          </Card>

          {/* Carousel Indicator */}
          <div className="flex justify-center mt-4 gap-1">
            <div className="w-6 h-1.5 rounded-full bg-primary"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-muted"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-muted"></div>
          </div>
        </div>

        {/* Business Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-foreground">Business –</h2>
            <span className="text-sm text-muted-foreground">Explore TAMIC GROUP services</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Link to="/stocks" className="h-full">
              <Card className="bg-card border shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center h-full justify-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Securities Trading</span>
                </CardContent>
              </Card>
            </Link>

            <Link to="/portfolio" className="h-full">
              <Card className="bg-card border shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center h-full justify-center">
                  <div className="h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center mb-3">
                    <Lock className="h-8 w-8 text-warning" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Asset Management</span>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* TAMG Shares Card */}
          <div className="mt-4">
            <TAMGCard />
          </div>
        </div>

        {/* Investments Overview */}
        <div>
          <button 
            onClick={() => setInvestmentsExpanded(!investmentsExpanded)}
            className="w-full flex items-center justify-between mb-4"
          >
            <h2 className="text-lg font-semibold text-foreground">Investments Overview</h2>
            {investmentsExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          {investmentsExpanded && (
            <>
              {/* Currency Tabs - Only USD and GBP */}
              <div className="flex items-center gap-4 mb-4 border-b border-border pb-2">
                <button
                  onClick={() => setSelectedCurrency('USD')}
                  className={cn(
                    "flex items-center gap-2 pb-2 border-b-2 transition-colors",
                    selectedCurrency === 'USD' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'
                  )}
                >
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm font-medium">USD</span>
                </button>
                <div className="h-4 w-px bg-border"></div>
                <button
                  onClick={() => setSelectedCurrency('GBP')}
                  className={cn(
                    "flex items-center gap-2 pb-2 border-b-2 transition-colors",
                    selectedCurrency === 'GBP' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'
                  )}
                >
                  <PoundSterling className="h-4 w-4" />
                  <span className="text-sm font-medium">GBP</span>
                </button>
                <div className="h-4 w-px bg-border"></div>
                <button
                  onClick={() => setSelectedCurrency('EUR')}
                  className={cn(
                    "flex items-center gap-2 pb-2 border-b-2 transition-colors",
                    selectedCurrency === 'EUR' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'
                  )}
                >
                  <Euro className="h-4 w-4" />
                  <span className="text-sm font-medium">EUR</span>
                </button>
              </div>

              {/* Investment Value Display */}
              <Card className="bg-card border shadow-sm">
                <CardContent className="p-6">
                  <p className="text-center text-2xl font-bold text-foreground mb-4">
                    {formatCurrency(totalNetWorth, selectedCurrency)}
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${totalNetWorth > 0 ? Math.min((portfolioValue / totalNetWorth) * 100, 100) : 0}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>Portfolio: {formatCurrency(portfolioValue, selectedCurrency)}</span>
                    <span>Cash: {formatCurrency(profile?.balance || 0, selectedCurrency)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* KYC Status Notice */}
              {kycStatus !== 'approved' && (
                <Card className="mt-4 bg-warning/5 border-warning/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-warning" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Complete KYC Verification</p>
                        <p className="text-xs text-muted-foreground">Unlock all trading features</p>
                      </div>
                      <Link to="/kyc">
                        <Button size="sm" variant="outline" className="border-warning text-warning hover:bg-warning/10">
                          Start
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}