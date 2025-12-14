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
      // Use fallback simulated data
      setStocks(generateSimulatedStocks());
    } finally {
      setLoading(false);
    }
  }, []);

  const getStock = useCallback((symbol: string) => {
    return stocks.find(s => s.symbol === symbol);
  }, [stocks]);

  return { stocks, loading, error, fetchStocks, getStock };
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
    'AAPL': 178.50,
    'MSFT': 378.25,
    'GOOGL': 141.80,
    'AMZN': 178.90,
    'TSLA': 248.50,
    'META': 505.75,
    'NVDA': 875.30,
    'JPM': 195.40,
    'V': 278.60,
    'JNJ': 156.80,
    'WMT': 165.20,
    'PG': 158.90
  };
  return prices[symbol] || 100;
}