import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PortfolioItem {
  id: string;
  symbol: string;
  company_name: string;
  shares: number;
  average_price: number;
}

export interface Trade {
  id: string;
  symbol: string;
  company_name: string;
  trade_type: 'buy' | 'sell';
  shares: number;
  price_per_share: number;
  total_amount: number;
  fee: number;
  created_at: string;
}

export function usePortfolio() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', user.id);
    
    if (!error && data) {
      setPortfolio(data.map(item => ({
        ...item,
        shares: Number(item.shares),
        average_price: Number(item.average_price)
      })));
    }
  }, [user]);

  const fetchTrades = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (!error && data) {
      setTrades(data.map(trade => ({
        ...trade,
        trade_type: trade.trade_type as 'buy' | 'sell',
        shares: Number(trade.shares),
        price_per_share: Number(trade.price_per_share),
        total_amount: Number(trade.total_amount),
        fee: Number(trade.fee)
      })));
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      Promise.all([fetchPortfolio(), fetchTrades()]).then(() => setLoading(false));
    } else {
      setPortfolio([]);
      setTrades([]);
      setLoading(false);
    }
  }, [user, fetchPortfolio, fetchTrades]);

  const executeTrade = async (
    type: 'buy' | 'sell',
    symbol: string,
    companyName: string,
    shares: number,
    pricePerShare: number,
    fee: number
  ) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const totalAmount = shares * pricePerShare + fee;

    // Insert trade record
    const { error: tradeError } = await supabase
      .from('trades')
      .insert({
        user_id: user.id,
        symbol,
        company_name: companyName,
        trade_type: type,
        shares,
        price_per_share: pricePerShare,
        total_amount: totalAmount,
        fee
      });

    if (tradeError) return { error: tradeError };

    // Update portfolio
    const existingPosition = portfolio.find(p => p.symbol === symbol);
    
    if (type === 'buy') {
      if (existingPosition) {
        const newShares = existingPosition.shares + shares;
        const newAvgPrice = (
          (existingPosition.shares * existingPosition.average_price + shares * pricePerShare) / newShares
        );
        
        const { error } = await supabase
          .from('portfolios')
          .update({ shares: newShares, average_price: newAvgPrice })
          .eq('id', existingPosition.id);
        
        if (error) return { error };
      } else {
        const { error } = await supabase
          .from('portfolios')
          .insert({
            user_id: user.id,
            symbol,
            company_name: companyName,
            shares,
            average_price: pricePerShare
          });
        
        if (error) return { error };
      }
    } else {
      if (existingPosition) {
        const newShares = existingPosition.shares - shares;
        
        if (newShares <= 0) {
          const { error } = await supabase
            .from('portfolios')
            .delete()
            .eq('id', existingPosition.id);
          
          if (error) return { error };
        } else {
          const { error } = await supabase
            .from('portfolios')
            .update({ shares: newShares })
            .eq('id', existingPosition.id);
          
          if (error) return { error };
        }
      }
    }

    await Promise.all([fetchPortfolio(), fetchTrades()]);
    return { error: null };
  };

  return { portfolio, trades, loading, fetchPortfolio, fetchTrades, executeTrade };
}