import { TOP_CRYPTOS } from '@/hooks/useCrypto';

const cryptoSymbols = new Set(TOP_CRYPTOS.map(asset => asset.symbol));

export function isCryptoAsset(symbol: string) {
  return cryptoSymbols.has(symbol.toUpperCase());
}

export function modeHoldings<T extends { symbol: string; isTamg?: boolean }>(items: T[], cryptoOnly: boolean): T[] {
  return cryptoOnly ? items.filter(item => !item.isTamg && isCryptoAsset(item.symbol)) : items;
}

export function modeRoute(path: string, cryptoOnly: boolean) {
  return cryptoOnly && path === '/stocks' ? '/crypto' : path;
}