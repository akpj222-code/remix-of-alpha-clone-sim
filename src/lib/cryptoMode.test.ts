import { describe, expect, test } from 'bun:test';
import { modeHoldings, modeRoute } from './cryptoMode';

describe('global crypto-only mode', () => {
  const holdings = [{ symbol: 'BTC' }, { symbol: 'ETH' }, { symbol: 'AAPL' }, { symbol: 'TAMG', isTamg: true }];
  test('on shows only crypto holdings without deleting saved stocks or TAMG', () => {
    expect(modeHoldings(holdings, true).map(item => item.symbol)).toEqual(['BTC', 'ETH']);
    expect(holdings).toHaveLength(4);
  });
  test('off restores every original holding', () => {
    expect(modeHoldings(holdings, false)).toEqual(holdings);
  });
  test('on redirects direct stock access to crypto', () => {
    expect(modeRoute('/stocks', true)).toBe('/crypto');
    expect(modeRoute('/wallet', true)).toBe('/wallet');
  });
  test('off restores the stock route', () => {
    expect(modeRoute('/stocks', false)).toBe('/stocks');
  });
});