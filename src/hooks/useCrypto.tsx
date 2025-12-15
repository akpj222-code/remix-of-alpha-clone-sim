import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Crypto {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  image?: string;
}

// Top 50 Cryptocurrencies
export const TOP_CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin', coingeckoId: 'bitcoin' },
  { symbol: 'ETH', name: 'Ethereum', coingeckoId: 'ethereum' },
  { symbol: 'USDT', name: 'Tether', coingeckoId: 'tether' },
  { symbol: 'BNB', name: 'BNB', coingeckoId: 'binancecoin' },
  { symbol: 'SOL', name: 'Solana', coingeckoId: 'solana' },
  { symbol: 'XRP', name: 'XRP', coingeckoId: 'ripple' },
  { symbol: 'USDC', name: 'USD Coin', coingeckoId: 'usd-coin' },
  { symbol: 'STETH', name: 'Lido Staked Ether', coingeckoId: 'staked-ether' },
  { symbol: 'ADA', name: 'Cardano', coingeckoId: 'cardano' },
  { symbol: 'DOGE', name: 'Dogecoin', coingeckoId: 'dogecoin' },
  { symbol: 'TRX', name: 'TRON', coingeckoId: 'tron' },
  { symbol: 'AVAX', name: 'Avalanche', coingeckoId: 'avalanche-2' },
  { symbol: 'TON', name: 'Toncoin', coingeckoId: 'the-open-network' },
  { symbol: 'SHIB', name: 'Shiba Inu', coingeckoId: 'shiba-inu' },
  { symbol: 'LINK', name: 'Chainlink', coingeckoId: 'chainlink' },
  { symbol: 'DOT', name: 'Polkadot', coingeckoId: 'polkadot' },
  { symbol: 'BCH', name: 'Bitcoin Cash', coingeckoId: 'bitcoin-cash' },
  { symbol: 'NEAR', name: 'NEAR Protocol', coingeckoId: 'near' },
  { symbol: 'XLM', name: 'Stellar', coingeckoId: 'stellar' },
  { symbol: 'MATIC', name: 'Polygon', coingeckoId: 'matic-network' },
  { symbol: 'LTC', name: 'Litecoin', coingeckoId: 'litecoin' },
  { symbol: 'UNI', name: 'Uniswap', coingeckoId: 'uniswap' },
  { symbol: 'DAI', name: 'Dai', coingeckoId: 'dai' },
  { symbol: 'ICP', name: 'Internet Computer', coingeckoId: 'internet-computer' },
  { symbol: 'ETC', name: 'Ethereum Classic', coingeckoId: 'ethereum-classic' },
  { symbol: 'APT', name: 'Aptos', coingeckoId: 'aptos' },
  { symbol: 'HBAR', name: 'Hedera', coingeckoId: 'hedera-hashgraph' },
  { symbol: 'FIL', name: 'Filecoin', coingeckoId: 'filecoin' },
  { symbol: 'ATOM', name: 'Cosmos', coingeckoId: 'cosmos' },
  { symbol: 'ARB', name: 'Arbitrum', coingeckoId: 'arbitrum' },
  { symbol: 'IMX', name: 'Immutable', coingeckoId: 'immutable-x' },
  { symbol: 'CRO', name: 'Cronos', coingeckoId: 'crypto-com-chain' },
  { symbol: 'VET', name: 'VeChain', coingeckoId: 'vechain' },
  { symbol: 'MNT', name: 'Mantle', coingeckoId: 'mantle' },
  { symbol: 'OP', name: 'Optimism', coingeckoId: 'optimism' },
  { symbol: 'RNDR', name: 'Render', coingeckoId: 'render-token' },
  { symbol: 'MKR', name: 'Maker', coingeckoId: 'maker' },
  { symbol: 'INJ', name: 'Injective', coingeckoId: 'injective-protocol' },
  { symbol: 'GRT', name: 'The Graph', coingeckoId: 'the-graph' },
  { symbol: 'SUI', name: 'Sui', coingeckoId: 'sui' },
  { symbol: 'AAVE', name: 'Aave', coingeckoId: 'aave' },
  { symbol: 'THETA', name: 'Theta Network', coingeckoId: 'theta-token' },
  { symbol: 'FTM', name: 'Fantom', coingeckoId: 'fantom' },
  { symbol: 'RUNE', name: 'THORChain', coingeckoId: 'thorchain' },
  { symbol: 'LDO', name: 'Lido DAO', coingeckoId: 'lido-dao' },
  { symbol: 'ALGO', name: 'Algorand', coingeckoId: 'algorand' },
  { symbol: 'FLOW', name: 'Flow', coingeckoId: 'flow' },
  { symbol: 'QNT', name: 'Quant', coingeckoId: 'quant-network' },
  { symbol: 'SAND', name: 'The Sandbox', coingeckoId: 'the-sandbox' },
  { symbol: 'AXS', name: 'Axie Infinity', coingeckoId: 'axie-infinity' },
];

export function useCrypto() {
  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCryptos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('crypto-prices');
      
      if (fnError) throw fnError;

      if (data?.cryptos) {
        setCryptos(data.cryptos);
      }
    } catch (err) {
      console.error('Error fetching cryptos:', err);
      setError('Failed to fetch crypto prices');
      setCryptos(generateSimulatedCryptos());
    } finally {
      setLoading(false);
    }
  }, []);

  const searchCrypto = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    return cryptos.filter(
      c => c.symbol.toLowerCase().includes(lowerQuery) || 
           c.name.toLowerCase().includes(lowerQuery)
    );
  }, [cryptos]);

  const getCrypto = useCallback((symbol: string) => {
    return cryptos.find(c => c.symbol === symbol);
  }, [cryptos]);

  return { cryptos, loading, error, fetchCryptos, searchCrypto, getCrypto };
}

function generateSimulatedCryptos(): Crypto[] {
  const basePrices: Record<string, number> = {
    'BTC': 67500, 'ETH': 3450, 'USDT': 1, 'BNB': 605, 'SOL': 175,
    'XRP': 0.52, 'USDC': 1, 'STETH': 3440, 'ADA': 0.45, 'DOGE': 0.12,
    'TRX': 0.11, 'AVAX': 35, 'TON': 6.5, 'SHIB': 0.000022, 'LINK': 14.5,
    'DOT': 7.2, 'BCH': 455, 'NEAR': 5.8, 'XLM': 0.11, 'MATIC': 0.58,
    'LTC': 72, 'UNI': 9.5, 'DAI': 1, 'ICP': 12.5, 'ETC': 26,
    'APT': 9.2, 'HBAR': 0.085, 'FIL': 5.8, 'ATOM': 8.5, 'ARB': 0.95,
    'IMX': 2.1, 'CRO': 0.12, 'VET': 0.035, 'MNT': 1.05, 'OP': 2.3,
    'RNDR': 8.5, 'MKR': 2850, 'INJ': 28, 'GRT': 0.22, 'SUI': 1.35,
    'AAVE': 165, 'THETA': 1.85, 'FTM': 0.72, 'RUNE': 5.2, 'LDO': 1.85,
    'ALGO': 0.18, 'FLOW': 0.72, 'QNT': 95, 'SAND': 0.42, 'AXS': 7.5
  };

  return TOP_CRYPTOS.map(crypto => {
    const basePrice = basePrices[crypto.symbol] || 10;
    const change = (Math.random() - 0.5) * basePrice * 0.08;
    const changePercent = (change / basePrice) * 100;

    return {
      symbol: crypto.symbol,
      name: crypto.name,
      price: Number((basePrice + change).toFixed(basePrice < 1 ? 6 : 2)),
      change: Number(change.toFixed(basePrice < 1 ? 6 : 2)),
      changePercent: Number(changePercent.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000000) + 100000000,
      marketCap: Math.floor(Math.random() * 500000000000) + 1000000000,
    };
  });
}
