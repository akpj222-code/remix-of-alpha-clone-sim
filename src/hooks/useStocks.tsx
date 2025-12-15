import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  category: string;
}

// Extended list of popular US stocks
const US_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', category: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', category: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', category: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', category: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla Inc.', category: 'Automotive' },
  { symbol: 'META', name: 'Meta Platforms Inc.', category: 'Technology' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', category: 'Technology' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', category: 'Finance' },
  { symbol: 'V', name: 'Visa Inc.', category: 'Finance' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', category: 'Healthcare' },
  { symbol: 'WMT', name: 'Walmart Inc.', category: 'Retail' },
  { symbol: 'PG', name: 'Procter & Gamble Co.', category: 'Consumer Goods' },
  { symbol: 'MA', name: 'Mastercard Inc.', category: 'Finance' },
  { symbol: 'HD', name: 'Home Depot Inc.', category: 'Retail' },
  { symbol: 'DIS', name: 'Walt Disney Co.', category: 'Entertainment' },
  { symbol: 'BAC', name: 'Bank of America Corp.', category: 'Finance' },
  { symbol: 'XOM', name: 'Exxon Mobil Corp.', category: 'Energy' },
  { symbol: 'PFE', name: 'Pfizer Inc.', category: 'Healthcare' },
  { symbol: 'KO', name: 'Coca-Cola Co.', category: 'Consumer Goods' },
  { symbol: 'NFLX', name: 'Netflix Inc.', category: 'Technology' },
  { symbol: 'INTC', name: 'Intel Corporation', category: 'Technology' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', category: 'Technology' },
  { symbol: 'CRM', name: 'Salesforce Inc.', category: 'Technology' },
  { symbol: 'ORCL', name: 'Oracle Corporation', category: 'Technology' },
  { symbol: 'ADBE', name: 'Adobe Inc.', category: 'Technology' },
];

export function useStocks() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStocks = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('stock-prices', {
        body: { symbols: US_STOCKS.map(s => s.symbol) }
      });
      
      if (fnError) throw fnError;
      
      if (data?.stocks) {
        const stocksWithDetails = data.stocks.map((stock: any) => {
          const stockInfo = US_STOCKS.find(s => s.symbol === stock.symbol);
          return {
            ...stock,
            name: stockInfo?.name || stock.symbol,
            category: stockInfo?.category || 'Other'
          };
        });
        setStocks(stocksWithDetails);
      }
    } catch (err) {
      console.error('Error fetching stocks:', err);
      setError('Failed to fetch stock prices');
      setStocks(generateSimulatedStocks());
    } finally {
      setLoading(false);
    }
  }, []);

  // Search any stock by symbol
  const searchStock = useCallback(async (symbol: string): Promise<Stock | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('stock-prices', {
        body: { symbols: [symbol.toUpperCase()], search: true }
      });
      
      if (fnError || !data?.stocks?.length) return null;
      
      const stockData = data.stocks[0];
      return {
        ...stockData,
        name: stockData.name || symbol.toUpperCase(),
        category: 'Other'
      };
    } catch {
      return null;
    }
  }, []);

  const getStock = useCallback((symbol: string) => {
    return stocks.find(s => s.symbol === symbol);
  }, [stocks]);

  return { stocks, loading, error, fetchStocks, searchStock, getStock };
}

function generateSimulatedStocks(): Stock[] {
  return US_STOCKS.map(stock => {
    const basePrice = getBasePrice(stock.symbol);
    const change = (Math.random() - 0.5) * basePrice * 0.05;
    const changePercent = (change / basePrice) * 100;
    
    return {
      symbol: stock.symbol,
      name: stock.name,
      category: stock.category,
      price: Number((basePrice + change).toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      volume: Math.floor(Math.random() * 50000000) + 1000000
    };
  });
}

function getBasePrice(symbol: string): number {
  const prices: Record<string, number> = {
    'AAPL': 178.50, 'MSFT': 378.25, 'GOOGL': 141.80, 'AMZN': 178.90,
    'TSLA': 248.50, 'META': 505.75, 'NVDA': 875.30, 'JPM': 195.40,
    'V': 278.60, 'JNJ': 156.80, 'WMT': 165.20, 'PG': 158.90,
    'MA': 458.30, 'HD': 345.20, 'DIS': 112.50, 'BAC': 35.80,
    'XOM': 105.40, 'PFE': 28.90, 'KO': 62.30, 'NFLX': 485.60,
    'INTC': 42.50, 'AMD': 165.80, 'CRM': 265.40, 'ORCL': 125.60,
    'ADBE': 545.20
  };
  return prices[symbol] || 100;
}
